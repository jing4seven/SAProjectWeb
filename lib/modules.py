import inspect

from django.conf import settings
from django.utils import simplejson
from django.http.response import HttpResponse

from .views import BaseView

class BaseModule(BaseView):
	'''
	Base class for modules
	'''
	def __init__(self):		
		super(BaseModule, self).__init__()		

	def get(self, request, *args, **kwargs):
		self.before_render(request, args, kwargs)
		result = []
		result.append({'html-content':self._get_template_render()})
		return HttpResponse(simplejson.dumps(result), mimetype='application/json', args, kwargs)

	def before_render(self, request, *args, **kwargs):
		pass