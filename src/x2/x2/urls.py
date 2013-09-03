from django.conf.urls import patterns, include, url
from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^x2/instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/view-layout$', 'instructor.views.view_layout'),
    url(r'^x2/instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/manage-layout$', 'instructor.views.manage_layout'),
    url(r'^x2/instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/capture$', 'instructor.views.capture'),
    url(r'^x2/instructor/(?P<course_slug>.+)/(?P<session_slug>.+)/capture-iframe$', 'instructor.views.capture_iframe'),
    url(r'^teacher', 'instructor.views.instructor_shorturl'),
    url(r'^capture', 'instructor.views.capture_shorturl'),

    # url(r'^x2/ajax/layout/create$', 'instructor.views.create_layout'),
    url(r'^x2/ajax/layout/blocks/update$', 'instructor.views.ajax_layout_blocks_update'),
    url(r'^x2/ajax/layout/students/update$', 'instructor.views.ajax_layout_students_update'),
    url(r'^x2/ajax/layout/student/update$', 'instructor.views.ajax_layout_student_update'),
    url(r'^x2/ajax/layout/session-student/update$', 'instructor.views.ajax_layout_session_student_update'),
    url(r'^x2/ajax/layout/help-request/new$', 'instructor.views.ajax_layout_help_request_new'),
    url(r'^x2/ajax/capture/interaction/stop$', 'instructor.views.ajax_capture_interaction_stop'),
    url(r'^x2/ajax/capture/interaction/accept$', 'instructor.views.ajax_capture_interaction_accept'),
    url(r'^x2/ajax/layout/students/progress$', 'instructor.views.ajax_layout_students_progress'),
    # url(r'^ajax/layout/remove$', 'instructor.views.remove_layout'),

    # Examples:
    # url(r'^$', 'x2.views.home', name='home'),
    # url(r'^x2/', include('x2.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^x2/admin/', include(admin.site.urls)),

    url("", include('django_socketio.urls')),
)

if settings.DEBUG:
    # static files (images, css, javascript, etc.)
    urlpatterns += patterns('',
        (r'^x2/media/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.MEDIA_ROOT}))
