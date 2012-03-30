from functools import wraps
import hashlib
from flask import render_template, request, Response, Flask, flash, redirect, url_for, abort, jsonify, Response
import re
from unicodedata import normalize
import datetime
from unicodedata import normalize
import markdown

from google.appengine.ext import ndb
from google.appengine.api import users

app = Flask(__name__)
app.config.from_object('settings')

_punct_re = re.compile(r'[\t !"#$%&\'()*\-/<=>?@\[\\\]^_`{|},.]+')

class Post(ndb.Model):
    title = ndb.StringProperty(required=True, indexed=False)
    slug = ndb.StringProperty(required=True)
    text = ndb.TextProperty(required=True, indexed=False)
    draft = ndb.BooleanProperty(indexed=True)
    views = ndb.IntegerProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    updated_at = ndb.DateTimeProperty()
    id = ndb.ComputedProperty(lambda self: self.key.id() if self.key else None)

    @classmethod
    def get_by_slug(cls, slug):
	q = cls.query(cls.slug==slug)
	return q.get()
    @classmethod
    def get_posts(cls, draft=True):
	q = cls.query(cls.draft==draft)
	q.order(-cls.updated_at)
	return q.fetch(1000)

    def render_content(self):
        return markdown.Markdown(extensions=['fenced_code'], output_format="html5", safe_mode=True).convert(self.text)


def requires_authentication(f):
    @wraps(f)
    def _auth_decorator(*args, **kwargs):
	if not users.is_current_user_admin():
            return redirect(users.create_login_url(request.url))

        return f(*args, **kwargs)

    return _auth_decorator


@app.route("/")
def index():
    page = request.args.get("page", 0, type=int)
    posts_master = Post.get_posts(draft=False)
    # posts_count = posts_master.count()
    posts_count = len(posts_master)

    # posts = posts_master.limit(app.config["POSTS_PER_PAGE"]).offset(page*app.config["POSTS_PER_PAGE"]).all()
    # pagination needed 
    posts = posts_master
    is_more = posts_count > ((page*app.config["POSTS_PER_PAGE"]) + app.config["POSTS_PER_PAGE"])

    return render_template("index.html", posts=posts, now=datetime.datetime.now(),
                                         is_more=is_more, current_page=page)
@app.route("/<slug>")
def view_post_slug(slug):
    try:
        post = Post.get_by_slug(slug)
    except Exception:
        return abort(404)
    pid = request.args.get("pid", "0")
    return render_template("view.html", post=post, pid=pid)

@app.route("/new", methods=["POST", "GET"])
@requires_authentication
def new_post():
    post = Post()
    post.title = request.form.get("title","untitled")
    post.slug = slugify(post.title)
    post.text = "Write something awesome here."
    post.updated_at = datetime.datetime.now()

    future = post.put_async()

    return redirect(url_for("edit", id=future.get_result().id()))

@app.route("/edit/<int:id>", methods=["GET","POST"])
@requires_authentication
def edit(id):
    try:
	post = Post.get_by_id(id)
    except Exception:
        return abort(404)

    if request.method == "GET":
        return render_template("edit.html", post=post)
    else:
        title = request.form.get("post_title","")
        text  = request.form.get("post_content","")
        post.title = title
        post.slug = slugify(post.title)
        post.text  = text
        post.updated_at = datetime.datetime.now()

        if any(request.form.getlist("post_draft", type=int)):
            post.draft = True
        else:
            post.draft = False


        future = post.put_async()

        return redirect(url_for("edit", id=future.get_result().id()))

@app.route("/delete/<int:id>", methods=["GET","POST"])
@requires_authentication
def delete(id):
    try:
	post = Post.get_by_id(id)
    except Exception:
        flash("Error deleting post ID %s"%id, category="error")
    else:
	post.delete()

    return redirect(request.args.get("next","") or request.referrer or url_for('index'))

@app.route("/admin", methods=["GET", "POST"])
@requires_authentication
def admin():
    drafts = Post.get_posts(draft=True)
    posts = Post.get_posts(draft=False)
    return render_template("admin.html", drafts=drafts, posts=posts)

@app.route("/admin/save/<int:id>", methods=["POST"])
@requires_authentication
def save_post(id):
    try:
        post = Post.get_by_id(id)
    except Exception:
        return abort(404)

    post.title = request.form.get("title","")
    post.slug = slugify(post.title)
    post.text = request.form.get("content", "")
    post.updated_at = datetime.datetime.now()
    future = post.put_async()
    if not future.check_success():
        return jsonify(success=True)
    else: 
	# handle errors here
	pass
        

@app.route("/preview/<int:id>")
@requires_authentication
def preview(id):
    try:
        post = Post.get_by_id(id)
    except Exception:
        return abort(404)

    return render_template("post_preview.html", post=post)

@app.route("/posts.rss")
def feed():
    def generate_feed():
        yield '<?xml version="1.0" encoding="UTF-8"?>\n'
        yield '<rss version="2.0">\n'
        yield '   <channel>\n'
        yield '      <title>%s</title>\n'%app.config["BLOG_TITLE"]
        yield '      <description>%s</title>\n'%app.config["BLOG_TAGLINE"]
        yield '      <link>%s</link>\n'%app.config["BLOG_URL"]
        for post in db.session.query(Post).filter_by(draft=False).order_by(Post.created_at.desc()).all():
            yield "         <item>\n"
            yield "            <title>%s</title>\n"%post.title
            if post.text:
                yield "            <description>%s</description>\n"%post.render_content()
            else:
                yield "            <description>No content</description>\n"
            yield "            <pubDate>%s</pubDate>\n"%post.created_at.strftime('%B %d, %Y')
            yield "            <link>%s</link>\n"%("%s/%s"%(app.config["BLOG_URL"], post.slug ))
            yield "            <guid>%s</guid>\n"%("%s/%s"%(app.config["BLOG_URL"], post.slug ))
            yield "         </item>\n"
        yield "   </channel>\n"
        yield "</rss>"

    return Response(generate_feed(), mimetype="application/rss+xml")

def slugify(text, delim=u'-'):
    """Generates an slightly worse ASCII-only slug."""
    result = []
    for word in _punct_re.split(text.lower()):
        word = normalize('NFKD', unicode(word)).encode('ascii', 'ignore')
        if word:
            result.append(word)
    return unicode(delim.join(result))


if __name__ == "__main__":
    app.run()
