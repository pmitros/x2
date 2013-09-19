
from django.conf.urls import patterns, url

urlpatterns = patterns('',
        (r'^player/(?P<path>.*)$', 'django.views.static.serve', {'document_root': './player/'}),
)