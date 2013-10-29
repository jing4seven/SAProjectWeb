from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
	# we only route request to different folder and 
	# let the view decide return a html or json base
	# on where its inherited 
	url(r'^(?i)login/', include('login.urls')),
	url(r'^(?i)secure/', include('secure.urls')),

)
