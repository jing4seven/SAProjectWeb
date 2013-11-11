import logging
import inspect

from django.conf import settings
from django.views.generic.base import View
from jinja2 import Environment, Template, FileSystemLoader, PackageLoader, ChoiceLoader 

from .api import get_api_data
from .resources import JavascriptResource, CSSResource, ResourcePackageFinder

class BaseView(View):
    '''
    the base view class, all the views should inherit from this class
    '''    
    _context = None    
    _logger = None
    _css_resource = None
    _js_resource = None

    template_name = None
    content_type = None
    

    def __init__(self, *args, **kwargs): 
        self._context = dict()      
        self._package_name = inspect.getmodule(self).__package__
        self._logger = logging.getLogger('django.request')        
        self._css_resource = CSSResource([ResourcePackageFinder(self._package_name)])
        self._js_resource = JavascriptResource([ResourcePackageFinder(self._package_name)])

    def add_resource(self, name):
        extension = os.path.splitext(resource_file)[1].lstrip(".") 
        if extension == 'js' and 'JSResource' in self._context:
            self._css_resource.push(name)
        elif extension == 'css' and 'CSSResource' in self._context:
            self._js_resource.push(name)

    def remove_context(self, key):
        if key in self._context:
            del self._context[key]

    def add_context(self, **kwargs):        
        for key, value in kwargs.iteritems():
            self._context[key] = value

    def get_logger(self):
        return self._logger

    def get(self, request, *args, **kwargs):
        pass
    
    def _get_template_render(self):
        env = Environment(
            loader = 
                ChoiceLoader([ 
                        FileSystemLoader(settings.TEMPLATE_DIRS),
                        PackageLoader(self._package_name, 'templates')
                ])
            )

        template = env.get_template(self.template_name)

        env.globals['CSSResource'] = self._css_resource
        env.globals['JSResource'] = self._js_resource

        return template.render(self._context)