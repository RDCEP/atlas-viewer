import os
_basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = False

ADMINS = frozenset(['matteson@obstructures.org'])
SECRET_KEY = 'REPLACEME'

THREADS_PER_PAGE = 8

CSRF_ENABLED = True
CSRF_SESSION_KEY = 'REPLACEME'