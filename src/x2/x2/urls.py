from django.conf.urls import patterns, include, url
from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/view-layout$', 'instructor.views.view_layout'),
    url(r'^instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/manage-layout$', 'instructor.views.manage_layout'),
    url(r'^instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/capture$', 'instructor.views.capture'),
    # url(r'^ajax/layout/create$', 'instructor.views.create_layout'),
    url(r'^ajax/layout/blocks/update$', 'instructor.views.ajax_layout_blocks_update'),
    url(r'^ajax/layout/students/update$', 'instructor.views.ajax_layout_students_update'),
    url(r'^ajax/layout/student/update$', 'instructor.views.ajax_layout_student_update'),
    url(r'^ajax/layout/session-student/update$', 'instructor.views.ajax_layout_session_student_update'),
    url(r'^ajax/capture/interaction/stop$', 'instructor.views.ajax_capture_interaction_stop'),
    url(r'^ajax/capture/interaction/accept$', 'instructor.views.ajax_capture_interaction_accept'),
    
    # url(r'^ajax/layout/remove$', 'instructor.views.remove_layout'),

    # Examples:
    # url(r'^$', 'x2.views.home', name='home'),
    # url(r'^x2/', include('x2.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    # static files (images, css, javascript, etc.)
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.MEDIA_ROOT}))
