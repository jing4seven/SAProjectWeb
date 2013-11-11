from django.conf import settings
import requests

from . import HTTP_METHOD_GET, HTTP_METHOD_POST
from auth import hmac_auth

def _get_full_url(relative_path):
    hostname = settings.FRONT_END['API_HOST']
    port = settings.FRONT_END['API_PORT']
    return str.format("http://{0}:{1}/{2}/", hostname, port, relative_path.strip('/'))

def get_api_data(username, url, method=HTTP_METHOD_GET, data=dict()):
    full_url = _get_full_url(url)    
    http_session = requests.Session()            
    http_session.auth = hmac_auth(username, full_url, method, data)
    
    if method == HTTP_METHOD_GET:
        response = http_session.get(full_url)
    elif method == HTTP_METHOD_POST:
        response = http_session.post(full_url, data)
        
    if response.status_code == requests.codes.ok:            
        return response.json()   
    
    raise requests.exceptions.RequestException(str.format("unable to fetch data from {0}. and response status {1}, details {2}", url, response.status_code, response.text))     