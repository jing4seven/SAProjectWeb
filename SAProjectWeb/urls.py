from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
	url(r'^(?i)secure/', include('SAProjectWeb.secure.urls')),
)
