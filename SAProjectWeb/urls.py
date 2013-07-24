from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
	url(r'^(?i)secure/', include('secure.urls')),
)
