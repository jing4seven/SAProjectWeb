from django.conf.urls import patterns, include, url
from . import views

urlpatterns = patterns('',
	# point to the sign in page
	#url(r'(?i)/$', views.login.as_view(), name='nnormal_view'),
    url(r'(?i)signin/$', views.Login.as_view(), name='sign_in_view'),
    # return json data with sing in pop up
	#url(r'(?i)ajax/signin', ),
)