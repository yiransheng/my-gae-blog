import os

POSTS_PER_PAGE = 10
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = '5f4dcc3b5aa765d61d8327deb882cf99'
ANALYTICS_ID = ''
SQLALCHEMY_DATABASE_URI = "sqlite:///simple.db"
GITHUB_USERNAME = 'rmanocha'
CONTACT_EMAIL = 'rmanocha@gmail.com'
BLOG_TITLE = 'Test blog'
BLOG_TAGLINE = 'test blog'
BLOG_URL = 'http://localhost'
DEBUG = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')
