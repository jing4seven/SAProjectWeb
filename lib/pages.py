import inspect

from django.conf import settings
from django.http.response import HttpResponse

from .views import BaseView

class BasePage(BaseView):
	'''
	Base class for page call
	'''
	def __init__(self):		
		super(BasePage, self).__init__()		
		self._context['layout_template'] = settings.FRONT_END['DEFAULT_LAYOUT']
		self._context['page_title'] = "SAProject - %s" % inspect.getmodule(self).__name__

	def set_title(self, title):
		self._context['page_title'] = title

	def get(self, request, *args, **kwargs):
		self.before_render(request, args, kwargs)
		return HttpResponse(self._get_template_render(), args, kwargs)

	def before_render(self, request, *args, **kwargs):
		pass