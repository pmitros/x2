"""Django views implementing the XBlock workbench.

This code is in the Workbench layer.

"""

import logging
import mimetypes
import pkg_resources
from StringIO import StringIO

from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import simplejson

from .runtime import Usage, create_xblock
from .util import webob_to_django_response, django_to_webob_request

from .models import SCOPED_KVS, NAMED_USAGES

LOG_STREAM = None


def setup_logging():
    """Sets up an in-memory logger."""
    # Allow us to use `global` within this function.
    # pylint: disable=W0603
    global LOG_STREAM
    LOG_STREAM = StringIO()

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    log_handler = logging.StreamHandler(LOG_STREAM)
    log_handler.setFormatter(logging.Formatter("<p>%(asctime)s %(name)s %(levelname)s: %(message)s</p>"))
    root_logger.addHandler(log_handler)

setup_logging()

log = logging.getLogger(__name__)


# We don't really have authentication and multiple students, just accept their
# id on the URL.
def get_student_id(request):
    """Get the student_id from the given request."""
    student_id = request.GET.get('student', None)
    return student_id


def index(_request):
    # """Render `index.html`"""
    # the_scenarios = sorted(SCENARIOS.items())
    # return render_to_response('index.html', {
    #     'scenarios': [(desc, scenario.description) for desc, scenario in the_scenarios]
    # })

    return HttpResponse(u"Index not implemented")


@ensure_csrf_cookie
def populate(request):
    cleardb(request)
    Usage._usage_index = {}  # todo hack, all state should go in the db, so we don't have to do this
    Usage._inited = set()  # todo hack, same as above


    course = request.GET.get('course', 'courseX')
    lesson = request.GET.get('lesson', 'lessonA')
    student_ids = ['student' + str(i) for i in range(1,6)]

    for student_id in student_ids:
        usage_problem_1 = Usage("problemitem",
                                initial_state={'content': 'static/html/problem_1.html',
                                               'thumb_caption':'Formulas and Definitions',
                                               'thumb_img':'static/img/p1.png'})


        # todo passing student_id couples a usage to a student_id -- not great
        usage_problem_2 = Usage("problemitem",
                                initial_state={'content': 'static/html/problem_2.html',
                                               'thumb_caption':'Part 1: Sampling Distribution of the Sample Mean',
                                               'thumb_img':'static/img/p2.png',
                                               'student_id': student_id,
                                               'input': simplejson.dumps({
                                                   'input_mean': {'val': '', 'corr':514},
                                                   'input_var': {'val': '', 'corr':456.3}
                                               })})

        usage_problem_3 = Usage("problemitem",
                                initial_state={'content': 'static/html/problem_3.html',
                                               'thumb_caption':'Part-2: Calculating the Z-score',
                                               'thumb_img':'static/img/p3.png',
                                               'student_id': student_id,
                                               'input': simplejson.dumps({
                                                   'input_zscore':{'val':'', 'corr':1.36}
                                               })})

        usage_problem_4 = Usage("problemitem",
                                initial_state={'content': 'static/html/problem_4.html',
                                               'thumb_caption':'Part: 3 Calculating the p-value',
                                               'thumb_img':'static/img/p4.png',
                                                'student_id': student_id,
                                                'input':simplejson.dumps({
                                                    'input_pvalue':{'val':'', 'corr':0.089}
                                                })})

        usage = Usage("queuewidget", [usage_problem_1,
                                      usage_problem_2,
                                      usage_problem_3,
                                      usage_problem_4])

        usage.store_initial_state()
        NAMED_USAGES.set(course=course, lesson=lesson, student=student_id, usage=usage)
        block = create_xblock(usage, student_id)
        block.save()

    return HttpResponse("Populated for: " + str(student_ids))


@ensure_csrf_cookie
def qinfo(request):

    student = request.GET.get('student')
    course = request.GET.get('course', 'courseX')
    lesson = request.GET.get('lesson', 'lessonA')

    if NAMED_USAGES.has(course=course, lesson=lesson, student=student):
        usage_id = NAMED_USAGES.get(course=course, lesson=lesson, student=student)
        try:
            usage = Usage.find_usage(usage_id)
        except KeyError:
            #recreate it from the DB
            print "recreating ", usage_id
            usage = Usage.recreate(usage_id)
    else:
        raise Http404

    block = create_xblock(usage, student)
    progress = block.progress()
    active = block.active_index()

    result = {'progress': progress, 'active': active}
    return HttpResponse(simplejson.dumps(result), mimetype='application/json')

def allqinfo(request):
    course = request.GET.get('course', 'courseX')
    lesson = request.GET.get('lesson', 'lessonA')
    usages = NAMED_USAGES.get_many(course=course, lesson=lesson)


    result = {}

    for u in usages:

        try:
            usage = Usage.find_usage(u['usage'])
        except KeyError:
            usage = Usage.recreate(u['usage'])

        block = create_xblock(usage, u['student'])
        progress = block.progress()
        active = block.active_index()

        info = {'progress': progress, 'active': active}

        result[u['student']]=info

    return HttpResponse(simplejson.dumps(result), mimetype='application/json')

@ensure_csrf_cookie
def qwidget(request):

    student_id = get_student_id(request)
    lesson = "lessonA"
    course = "courseX"
    template = "static/html/mblock.html"
    view_name = "student_view"
    class_id = "queuewidget"

    log.info("Start show_scenario %r for student %s", class_id, student_id)

    if NAMED_USAGES.has(course=course, lesson=lesson, student=student_id):
        usage_id = NAMED_USAGES.get(course=course, lesson=lesson, student=student_id)

        #have we loaded the usage?
        try:
            usage = Usage.find_usage(usage_id)
        except KeyError:
            #recreate it from the DB
            print "recreating ", usage_id
            usage = Usage.recreate(usage_id)
    else:

        return HttpResponse("Cannot find queue for student: %s" % student_id)
        # usage = Usage(class_id, [Usage(x) for x in ["dtext", "dvideo", "dtext", "dtext", "dtext", "dtext"]], def_id='kraken')
        # # problem_1 = Usage('dproblem', initial_state={'content':'static/html/problem_1.html'})
        # usage.store_initial_state()
        # NAMED_USAGES.set(course=course, lesson=lesson, student=student_id, usage=usage)


    block = create_xblock(usage, student_id)

    frag = block.runtime.render(block, {}, view_name)
    log.info("End show_scenario %s", class_id)
    return render_to_response(template, {
        'named_usage': '.'.join([course, lesson, student_id]),
        'block': block,
        'body': frag.body_html(),
        'database': SCOPED_KVS,
        'head_html': frag.head_html(),
        'foot_html': frag.foot_html(),
        'log': LOG_STREAM.getvalue(),
        'student_id': student_id,
        'usage': usage,
    })


def butler(request):

    student_id = "student_rex"
    template = "static/html/mblock.html"
    view_name = "student_view"

    usage = Usage.recreate('usage_12')
    block = create_xblock(usage, student_id)

    frag = block.runtime.render(block, {}, view_name)


    return render_to_response(template, {
        'scenario': None,
        'block': block,
        'body': frag.body_html(),
        'database': SCOPED_KVS,
        'head_html': frag.head_html(),
        'foot_html': frag.foot_html(),
        'log': LOG_STREAM.getvalue(),
        'student_id': student_id,
        'usage': usage,
    })


def queue(request):

    student = request.GET.get('student')
    course = request.GET.get('course', 'courseX')
    lesson = request.GET.get('lesson', 'lessonA')

    if NAMED_USAGES.has(course=course, lesson=lesson, student=student):
        usage_id = NAMED_USAGES.get(course=course, lesson=lesson, student=student)
        try:
            usage = Usage.find_usage(usage_id)
        except KeyError:
            usage = Usage.recreate(usage_id)
    else:
        raise Http404


    block = create_xblock(usage, student)
    frag = block.runtime.render(block, {}, 'queue_view')

    return HttpResponse(frag.body_html())


def showdb(request):

    return render_to_response("static/html/showdb.html", {
        'database': SCOPED_KVS,
    })

def cleardb(request):
    SCOPED_KVS.clear()
    return showdb(request)

@ensure_csrf_cookie
def show_scenario(request, scenario_id, view_name='student_view', template='block.html'):
    """
    Render the given `scenario_id` for the given `view_name`, on the provided `template`.

    `view_name` defaults to 'student_view'.
    `template` defaults to 'block.html'.

    """
    student_id = get_student_id(request)
    log.info("Start show_scenario %r for student %s", scenario_id, student_id)

    try:
        scenario = SCENARIOS[scenario_id]
    except KeyError:
        # Hmm, someone wants a class scenario auto-generated.
        description = "Auto-generated for %s" % scenario_id
        usage = Usage(scenario_id, [])
        scenario = Scenario(description, usage)
        SCENARIOS[scenario_id] = scenario

    usage = scenario.usage
    usage.store_initial_state()
    block = create_xblock(usage, student_id)
    frag = block.runtime.render(block, {}, view_name)
    log.info("End show_scenario %s", scenario_id)
    return render_to_response(template, {
        'scenario': scenario,
        'block': block,
        'body': frag.body_html(),
        'database': SCOPED_KVS,
        'head_html': frag.head_html(),
        'foot_html': frag.foot_html(),
        'log': LOG_STREAM.getvalue(),
        'student_id': student_id,
        'usage': usage,

    })


def handler(request, usage_id, handler_slug):
    """Provide a handler for the request."""
    student_id = get_student_id(request)
    log.info("Start handler %s/%s for student %s", usage_id, handler_slug, student_id)
    usage = Usage.find_usage(usage_id)
    block = create_xblock(usage, student_id)
    request = django_to_webob_request(request)
    request.path_info_pop()
    request.path_info_pop()
    result = block.runtime.handle(block, handler_slug, request)
    log.info("End handler %s/%s", usage_id, handler_slug)
    return webob_to_django_response(result)


def package_resource(_request, package, resource):
    """
    Wrapper for `pkg_resources` that tries to access a resource and, if it
    is not found, raises an Http404 error.
    """
    if ".." in resource:
        raise Http404
    try:
        content = pkg_resources.resource_string(package, "static/" + resource)
    except IOError:
        raise Http404
    mimetype, _ = mimetypes.guess_type(resource)
    return HttpResponse(content, mimetype=mimetype)
