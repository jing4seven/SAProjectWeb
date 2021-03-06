from __future__ import unicode_literals

from lib import HTTP_METHOD_GET, HTTP_METHOD_POST, \
                URLS_TYPE_FRENTEND, URLS_TYPE_API, urls
from lib.views import BaseView

USER_PROJECTS = 'USER_PROJECTS_GET'
PROJECT_RELEASES = 'PROJECT_RELEASES_GET'


class dashboard_view(BaseView):
    '''
    Dashboard view.
    '''
    template_name = 'dashboard.html'
    
    def get(self, request, *args, **kwargs):
        user_projects_fe_url = urls.get_format_urls(USER_PROJECTS, URLS_TYPE_FRENTEND, \
                                                    username=request.user['username'])
        project_releases_fe_url = urls.get_format_urls(PROJECT_RELEASES, URLS_TYPE_FRENTEND, \
                                                       username=request.user['username'], \
                                                       project_name="ASPP")
        
        variables = dict(project_tree_id='project_tree', 
                         project_tree_url=user_projects_fe_url,
                         release_tree_id='release_tree',
                         release_tree_url=project_releases_fe_url)
        self.context.update(variables)
        return self.render_to_response(self.context)

class project_tree_view(BaseView):
    
    template_name = 'projects_tree.html'

    def get(self, request, *args, **kwargs):
        if kwargs.has_key('owner_username'):
            api_url = urls.get_format_urls(USER_PROJECTS, URLS_TYPE_API, \
                                           owner_username=kwargs['owner_username'])
            self.get_data(request.user['username'], api_url, HTTP_METHOD_GET, dict(), 'user_projects')
        
        return self.render_to_response(self.context)
    
class release_tree_view(BaseView):
    
    template_name = 'releases_tree.html'

    def get(self, request, *args, **kwargs):
        if kwargs.has_key('owner_username') and kwargs.has_key('project_name'):
            api_url = urls.get_format_urls(PROJECT_RELEASES, URLS_TYPE_API, \
                                           owner_username=kwargs['owner_username'], \
                                           project_name=kwargs['project_name']) 
            
            self.get_data(request.user['username'], api_url, HTTP_METHOD_GET, dict(), 'project_releases')
        
        return self.render_to_response(self.context)
