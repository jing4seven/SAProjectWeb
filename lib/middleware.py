from django.conf import settings
from django.http import response 
from django.core.handlers.wsgi import WSGIRequest

from . import URLS_TYPE_API
from .api import get_api_data
from .urls import get_format_urls


AUTH_USER_SESSION_KEY = '_auth_user_name'
API_USER_GET = 'USER_GET'


class AuthenticationMiddleware(object):
    def process_request(self, request):
        username = None
        #wsgi_request = WSGIRequest(request)
#         if hasattr(request, 'session'):
#             if hasattr(request.session, AUTH_USER_SESSION_KEY):
#                 username = request.session[AUTH_USER_SESSION_KEY]
            
        # if username is None and hasattr(request, 'username'):
        #     username = getattr(request, 'username')
            
        # if settings.FRONT_END['ALLOW_GUEST'] and username is None:
        #     request.user = dict(username='userpo', user_id=1)
            
        # if not hasattr(request, 'user'):
        #     api_url = get_format_urls(API_USER_GET, URLS_TYPE_API, 
        #                               username=username)            
        #     request.user = get_api_data(username, api_url)
        
        #if request.get_full_path() != '/login/signin/':
        #    return response.HttpResponseRedirect("/login/signin/")