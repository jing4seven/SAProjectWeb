
from . import URLS_TYPE_API, URLS_TYPE_FRENTEND

_api_urls = {
    'USER_GET': '/api/secure/user/{username}',
    'USER_PROJECTS_GET': '/api/owner/{owner-username}/projects/',    
    'PROJECT_RELEASES_GET': '/api/owner/{owner-username}/project/{project-name}/releases',
}

_fe_urls = {
    'USER_PROJECTS_GET': '/secure/{username}/projects/',
    'PROJECT_RELEASES_GET': '/secure/{username}/project/{project-name}/releases/',
}

def get_format_urls(key, url_type, **kwargs):
    if url_type == URLS_TYPE_API:
        if _api_urls.has_key(key):
            return _fill_url(_api_urls.get(key), **kwargs)
        else:
            raise NameError(str.format("{0} is not configured!", key))
    elif url_type == URLS_TYPE_FRENTEND:
        if _fe_urls.has_key(key):
            return _fill_url(_fe_urls.get(key), **kwargs)
        else:
            raise NameError(str.format("{0} is not configured!", key))
      
        
def _fill_url(url, **kwargs):
    for key, value in kwargs.iteritems():
        format_key = '{' + key + '}'
        format_key = format_key.replace("_", "-")
        if value is not None:
            url = url.replace(format_key, str(value))
      
    format_later = kwargs.get("format_later", False)
    if (not format_later) and (url.find('{') > 0 or url.find('}') > 0):
        raise NameError(str.format("{0} is not be well formatted!", url))
    
    return url
        
        