from functools import wraps
from hashlib import sha1
from flask import render_template, request, Response, Flask, flash, redirect, url_for, abort, jsonify
import re
from unicodedata import normalize
import datetime, time
from unicodedata import normalize
import markdown

from google.appengine.ext import ndb
from google.appengine.api import users


app = Flask(__name__)
app.config.from_object('settings')

POSTS_PER_PAGE = app.config.get('POSTS_PER_PAGE', 10)

_punct_re = re.compile(r'[\t !"#$%&\'()*\-/<=>?@\[\\\]^_`{|},.]+')

@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html", now=datetime.datetime.now()), 404


@app.errorhandler(500)
def server_error(e):
    return render_template("500.html", now=datetime.datetime.now()), 500


class Post(ndb.Model):
    title = ndb.StringProperty(required=True, indexed=False)
    slug = ndb.StringProperty(required=True)
    text = ndb.TextProperty(required=True, indexed=False)
    draft = ndb.BooleanProperty(default=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    id = ndb.ComputedProperty(lambda self: self.key.id() if self.key else None)

    @classmethod
    def get_by_slug(cls, slug):
        q = cls.query(cls.slug==slug)
        return q.get()

    @classmethod
    def get_posts(cls, draft=True):
        q = cls.query(cls.draft==draft)
        q.order(-cls.updated_at)
        #Fetch all posts - if you have more than 10 million posts, you're on
        #your own
        return q.fetch(10000000)

    def render_content(self):
        return markdown.Markdown(extensions=['fenced_code', 'mathjax'], output_format="html5", safe_mode=True).convert(self.text)


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

    posts_count_future = Post.query(Post.draft==False).count_async()

    posts_async = Post.query(Post.draft==False).order(-Post.created_at).fetch_async(limit=POSTS_PER_PAGE, offset=page*POSTS_PER_PAGE)

    posts_count = posts_count_future.get_result()
    is_more = posts_count > ((page*POSTS_PER_PAGE) + POSTS_PER_PAGE)

    posts = posts_async.get_result()

    return render_template("index.html", posts=posts, now=datetime.datetime.now(),
                                         is_more=is_more, current_page=page)
@app.route("/<slug>/")
@app.route("/<int:year>/<int:month>/<slug>")
def view_post_slug(slug, **kwarg):
    post = Post.get_by_slug(slug)

    if not post:
        abort(404)

    pid = request.args.get("pid", "0")
    return render_template("view.html", post=post, pid=pid)


@app.route("/posts.rss")
def feed():
    posts = Post.query(Post.draft==False).order(-Post.created_at).fetch(limit=10)

    return render_template('index.xml', posts=posts)


#---------- Admin Views ---------------


@app.route("/admin/new/", methods=["POST", "GET"])
@requires_authentication
def new_post():
    post = Post()
    post.title = request.form.get("title","untitled")
    post.slug = slugify(post.title)
    post.text = "emptypost"

    post.put()

    return redirect(url_for("edit", id=post.key.id()))

@app.route("/admin/edit/<int:id>/", methods=["GET","POST"])
@requires_authentication
def edit(id):
    post = Post.get_by_id(id)

    if not post:
        return abort(404)

    if request.method == "GET":
        return render_template("edit.html", post=post)
    else:
        title = request.form.get("post_title","")
        text  = request.form.get("post_content","")
        draft = request.form.get("post_draft", type=bool)
	if not draft:
	    draft = False

        if post.draft and not draft:
            slug = slugify(title)

            other_post = Post.get_by_slug(slug)
            if other_post and other_post.id != id:
                slug = '-'.join([slug, sha1('%s' % time.time()).hexdigest()[:8]])

            post.slug = slug

        post.draft = draft
        post.title = title
        post.text  = text

        post.put()

        if request.is_xhr:
            return jsonify(status='success')
        else:
            return redirect(url_for("edit", id=post.key.id()))


@app.route("/admin/delete/<int:id>/", methods=["GET","POST"])
@requires_authentication
def delete(id):
    post = Post.get_by_id(id)

    if not post:
        flash("Error deleting post ID %s" % id, category="error")
    else:
        post.key.delete()

    return redirect(request.args.get("next","") or request.referrer or url_for('index'))


@app.route("/admin/", methods=["GET", "POST"])
@requires_authentication
def admin():
    drafts = Post.get_posts(draft=True)
    posts = Post.get_posts(draft=False)
    return render_template("admin.html", drafts=drafts, posts=posts)



def slugify(text, delim=u'-'):
    """Generates an slightly worse ASCII-only slug."""
    result = []
    for word in _punct_re.split(text.lower()):
        word = normalize('NFKD', unicode(word)).encode('ascii', 'ignore')
        if word:
            result.append(word)
    return unicode(delim.join(result))
