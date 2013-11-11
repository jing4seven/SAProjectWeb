import hashlib
import hmac
from django.conf import settings
from requests.auth import AuthBase

class hmac_auth(AuthBase):
    '''
    HMAC Authentication class for api request.

    Caculate signature for each request between frontend and api.
    '''
    def __init__(self, username, url, method, data):
        self.username = username
        self.url = url
        self.method = method
        self.data = data

    def __call__(self, r):
        '''
        Prepare hmac auth header.

        We add client id into request header only if username is none.
        '''
        if not self.username or self.username == 'none':
            username = 'none'
            client_id_param = settings.FRONT_END['HEAD_CLIENT_ID']
            client_id = settings.FRONT_END['CLIENT_ID']
            r.headers[client_id_param] = client_id     
        hmac_message = '{method}{full_path}{body}'.format(
            method=self.method.upper(),
            full_path= self.url,
            body=  self.data or '',
        )
        security_key = settings.FRONT_END['CLIENT_SECURITY_KEY']
        signature = hmac.new(security_key, hmac_message, hashlib.sha1).hexdigest() 
        r.headers['AUTHORIZATION'] = 'ApiKey %s:%s' % (self.username, signature)
        
        return r

