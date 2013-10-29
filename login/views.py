from django.http.response import HttpResponse
from lib.views import BaseView

class Login(BaseView):

	def get(self, request, *args, **kwargs):			
		return HttpResponse("aaa", args, kwargs);