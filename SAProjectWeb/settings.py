# Django settings for SAProject project.
from ConfigParser import RawConfigParser

# Load config file
config = RawConfigParser()
config.read("D:\saproject_workspace\web_settings.ini")

# Debug
DEBUG = config.getboolean('debug','DEBUG')
TEMPLATE_DEBUG = config.getboolean('debug','TEMPLATE_DEBUG')
VIEW_TEST = config.getboolean('debug', 'VIEW_TEST')
INTERNAL_IPS = tuple(config.get('debug', 'INTERNAL_IPS').split())

# Admin
ADMINS = tuple(config.items('error mail'))
MANAGERS = tuple(config.items('404 mail'))

# Database
DATABASE_ENGINE = config.get('database', 'DATABASE_ENGINE')
DATABASE_USER = config.get('database', 'DATABASE_USER')
DATABASE_PASSWORD = config.get('database', 'DATABASE_PASSWORD')
DATABASE_HOST = config.get('database', 'DATABASE_HOST')
DATABASE_PORT = config.get('database', 'DATABASE_PORT')
DATABASE_NAME = config.get('database', 'DATABASE_NAME')

DATABASES = {
    'default': {
        'ENGINE' : DATABASE_ENGINE,
        'NAME' : DATABASE_NAME,
        'USER': DATABASE_USER,
        'PASSWORD': DATABASE_PASSWORD,
        'HOST': DATABASE_HOST,
        'PORT': DATABASE_PORT,
        'OPTIONS': {
            'charset': 'utf8',
            'use_unicode': True, 
        },
    }
}

SECRET_KEY = config.get('secrets', 'SECRET_KEY')

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = []

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'Asia/Chongqing'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"
MEDIA_ROOT = config.get('media', 'MEDIA_ROOT')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = config.get('media', 'MEDIA_URL')

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = config.get('statics', 'STATIC_ROOT')

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/' # config.get('statics', 'STATIC_URL')

# List of finder classes that know how to find static files in
# various locations.
# STATICFILES_FINDERS = tuple(config.get('statics', 'STATICFILES_FINDERS').split())
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder'
)

# Additional locations of static files
# Put strings here, like "/home/html/static" or "C:/www/django/static".
# Always use forward slashes, even on Windows.
# Don't forget to use absolute paths, not relative paths.
STATICFILES_DIRS = (config.get('statics', 'STATICFILES_DIRS'),)

# List of callables that know how to import templates from various sources.
# TEMPLATE_LOADERS = tuple(config.get('templates', 'TEMPLATE_LOADERS').split())
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader'
)

# Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
# Always use forward slashes, even on Windows.
# Don't forget to use absolute paths, not relative paths.
TEMPLATE_DIRS = tuple(config.get('templates', 'TEMPLATE_DIRS').split())

ROOT_URLCONF = 'SAProjectWeb.urls'
# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'SAProjectWeb.wsgi.application'

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    #'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'lib.middleware.AuthenticationMiddleware',
    #'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

INSTALLED_APPS = (
    #'django.contrib.auth',
    #'django.contrib.contenttypes',
    #'django.contrib.sessions',
    #'django.contrib.sites',
    #'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    #'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    #'django.contrib.admindocs',
    'lib',
    'SAProjectWeb.secure',
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}

# Only for front-end
FRONT_END = {
    'CLIENT_ID': config.get('frontend', 'CLIENT_ID'),
    'HEAD_CLIENT_ID': 'X_SAPROJECT_CLIENT_ID',
    'CLIENT_SECURITY_KEY' : config.get('frontend', 'CLIENT_SECURITY_KEY'),
    'ENVIRONMENT': config.get('frontend', 'ENVIRONMENT'),
    'API_HOST': config.get('frontend', 'API_HOST'),
    'API_PORT': config.get('frontend', 'API_PORT'),
    'ALLOW_GUEST': config.get('frontend', 'ALLOW_GUEST'),
}
