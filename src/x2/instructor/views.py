from django.conf import settings
from django.shortcuts import render_to_response
from django.http import HttpResponse, Http404, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import ObjectDoesNotExist
from instructor.models import *
from datetime import datetime
from django.utils.timezone import utc

import sys
import os
import json
import urllib2

from django_socketio.events import on_connect, on_message, on_subscribe, on_unsubscribe, on_error, on_disconnect, on_finish


@on_connect
def socketio_connect_handler(request, socket, context):
    print socket, context
    socket.send("connection established")


@on_subscribe
def socketio_subscribe_handler(request, socket, context, channel):
    print "subscribing to", channel
    socket.send("subscribed to", channel)

student_data = []


@on_message
def socketio_message_handler(request, socket, context, message):
    print "message received", context, message
    course = Course.objects.get(slug="6.00x")
    students = Student.objects.filter(course_id=course.id)
    student_data = [None] * len(students)
    try:
        for index, student in enumerate(students):
            # print student.id
            # datum = urllib2.urlopen("http://juhokim.com:2233/qinfo?student=" + str(student.id)).read()
            datum = {"student": 1, "currentIndex": 3}
            # if student_data[index] != datum:
            student_data[index] = datum
    except:
        print "student information not available"
    print json.dumps(student_data)
    socket.send(json.dumps(student_data))


def model_to_json(instances):
    result = []
    # Hack to serialize a django model. There is no good way to deal with foreign keys.
    for instance in instances:
        result.append(json.loads(instance.toJSON()))
    return json.dumps(result)


def populate_session_students(session_id, students):
    for student in students:
        try:
            model = SessionStudentData.objects.get(session_id=session_id, student_id=student.id)
        except ObjectDoesNotExist:
            model = SessionStudentData(session_id=session_id, student_id=student.id)
            model.save()


@ensure_csrf_cookie
def view_layout(request, course_slug, session_slug):
    try:
        instructor_id = int(request.GET.get('iid'))
    except (KeyError, TypeError):
        instructor_id = 11
    try:
        course = Course.objects.get(slug=course_slug)
        session = Session.objects.get(slug=session_slug)
        instructor = Instructor.objects.get(id=instructor_id)
        students = Student.objects.filter(course=course.id)
        blocks = TableBlock.objects.filter(session=session.id)
        populate_session_students(session.id, students)
        session_students = SessionStudentData.objects.filter(session_id=session.id)
    except ObjectDoesNotExist:
        raise Http404
    return render_to_response(
        "view_layout.html",
        {"course": course,
        "session": session,
        "instructor": instructor,
        "blocks": model_to_json(blocks),
        "students": model_to_json(students),
        "session_students": model_to_json(session_students)})


@ensure_csrf_cookie
def instructor_shorturl(request):
    """a version of view_layout that for a shorter url"""
    return view_layout(request, '6.00x', 'sep-1-2013')


def manage_layout(request, course_slug, session_slug):
    try:
        course = Course.objects.get(slug=course_slug)
        session = Session.objects.get(slug=session_slug)
        blocks = TableBlock.objects.filter(session=session.id)
    except ObjectDoesNotExist:
        raise Http404
    return render_to_response(
        "update_layout.html",
        {"course": course,
        "session": session,
        "blocks": model_to_json(blocks)})


# TODO: duplicate code with capture(). Refactor.
def capture_iframe(request, course_slug, session_slug):
    try:
        student_id = int(request.GET.get('sid'))
    except (KeyError, TypeError):
        student_id = 1
    try:
        instructor_id = int(request.GET.get('iid'))
    except (KeyError, TypeError):
        instructor_id = 11  # juho
    try:
        hr_id = int(request.GET.get('hr'))
    except (KeyError, TypeError):
        hr_id = -1
    try:
        course = Course.objects.get(slug=course_slug)
        session = Session.objects.get(slug=session_slug)
        student = Student.objects.get(id=student_id)
        instructor = Instructor.objects.get(id=instructor_id)
        interaction = Interaction(
            started_at=datetime.utcnow().replace(tzinfo=utc),
            ended_at=datetime.utcnow().replace(tzinfo=utc),
            is_rejected=True)
        interaction.t = instructor
        interaction.l = student
        interaction.save()
    except ObjectDoesNotExist:
        raise Http404

    try:    
        help_request = HelpRequest.objects.get(id=hr_id)
        help_request.status = "in_progress"
        help_request.save()
    except ObjectDoesNotExist:
        help_request = HelpRequest(
            session_id=session.id,
            student_id=student.id,
            requested_at=datetime.utcnow().replace(tzinfo=utc),
            description="started by the instructor" + instructor.name,
            resource="0",
            status="in_progress")
        help_request.save()
        hr_id = help_request.id

    return render_to_response(
        "capture_iframe.html",
        {"course": course,
        "session": session,
        "student": student,
        "instructor": instructor,
        "interaction": interaction,
        "help_request": model_to_json([help_request])})


def capture(request, course_slug, session_slug):
    try:
        student_id = int(request.GET.get('sid'))
    except (KeyError, TypeError):
        student_id = 1
    try:
        instructor_id = int(request.GET.get('iid'))
    except (KeyError, TypeError):
        instructor_id = 11  # juho
    try:
        hr_id = int(request.GET.get('hr'))
    except (KeyError, TypeError):
        hr_id = -1
    try:
        course = Course.objects.get(slug=course_slug)
        session = Session.objects.get(slug=session_slug)
        student = Student.objects.get(id=student_id)
        instructor = Instructor.objects.get(id=instructor_id)
        interaction = Interaction(
            started_at=datetime.utcnow().replace(tzinfo=utc),
            ended_at=datetime.utcnow().replace(tzinfo=utc),
            is_rejected=True)
        interaction.t = instructor
        interaction.l = student
        interaction.save()
    except ObjectDoesNotExist:
        raise Http404

    try:    
        help_request = HelpRequest.objects.get(id=hr_id)
        help_request.status = "in_progress"
        help_request.save()
    except ObjectDoesNotExist:  # todo make ad-hoc interactions explicit
        help_request = HelpRequest(
            session_id=session.id,
            student_id=student.id,
            requested_at=datetime.utcnow().replace(tzinfo=utc),
            description="started by the instructor" + instructor.name,
            resource="0",
            status="in_progress")
        help_request.save()
        hr_id = help_request.id

    return render_to_response(
        "capture_interaction.html",
        {"course": course,
        "session": session,
        "student": student,
        "instructor": instructor,
        "interaction": interaction,
        "hr_id": hr_id,
        "help_request": model_to_json([help_request])})

def capture_shorturl(request):
    return capture(request, '6.00x', 'sep-1-2013')

@csrf_protect
def ajax_layout_blocks_update(request):
    """
    Update information of all blocks in a layout
    """
    if request.method == "POST":
        # print request.POST
        # print json.loads(request.POST["data"])
        data = json.loads(request.POST["data"])
        for block in data:
            if block["id"] == "":
                block_model = TableBlock(session_id=block["session"], name=block["name"], location=str(block["left"]) + "," + str(block["top"]))
            else:
                block_model = TableBlock.objects.get(id=block["id"])
                block_model.name = block["name"]
                block_model.location = str(block["left"]) + "," + str(block["top"])
            block_model.save()
    return HttpResponse(
        json.dumps({'message': 'success'}, ensure_ascii=False), mimetype='application/json')


@csrf_protect
def ajax_layout_students_update(request):
    """
    Update information of all students in a layout
    """
    if request.method == "POST":
        # print request.POST
        # print json.loads(request.POST["data"])
        data = json.loads(request.POST["data"])
        for student in data:
            if student["id"] == "":
                print "student not found in the database"
            else:
                student_model = Student.objects.get(id=student["id"])
                student_model.location = str(student["left"]) + "," + str(student["top"])
                student_model.save()
    return HttpResponse(
        json.dumps({'message': 'success'}, ensure_ascii=False), mimetype='application/json')


@csrf_protect
def ajax_layout_student_update(request):
    """
    Update individual student information
    """
    if request.method == "POST":
        data = json.loads(request.POST["data"])
        if data["id"] == "":
            print "student not found in the database"
        else:
            student_model = Student.objects.get(id=data["id"])
            for key in data:
                setattr(student_model, key, data[key])
            student_model.save()
    return HttpResponse(
        json.dumps({'message': 'success'}, ensure_ascii=False), mimetype='application/json')


@csrf_protect
def ajax_layout_session_student_update(request):
    """
    Update individual student information specific to a session
    """
    message = "success"
    if request.method == "POST":
        data = json.loads(request.POST["data"])
        if data["session_id"] == "" or data["student_id"] == "":
            print "database access error"
        else:
            try:
                model = SessionStudentData.objects.get(
                    session_id=data["session_id"], student_id=data["student_id"])
                for key in data:
                    setattr(model, key, data[key])
                model.save()
            except ObjectDoesNotExist:
                # model = SessionStudentData(
                #     session_id=data["session_id"], student_id=data["student_id"])
                message = "database access error"
    return HttpResponse(
        json.dumps({'message': message}, ensure_ascii=False), mimetype='application/json')






#@csrf_protect
@ensure_csrf_cookie
def ajax_layout_help_request_new(request):
    """
    Create a new help request from a student
    """
    message = "success"
    hr_id = -1
    data = request.GET
    print request.method, data
    if data["session_id"] == "" or data["student_id"] == "":
        print "database access error"
    else:
        try:
            session = Session.objects.get(slug=data["session_id"])
            student = Student.objects.get(name=data["student_id"])
            model = HelpRequest(
                session_id=session.id,
                student_id=student.id,
                requested_at=datetime.utcnow().replace(tzinfo=utc),
                description=data["description"],
                resource=data["resource"],
                status="requested")
            model.save()
            hr_id = model.id
        except:
            message = "help request processing failed"
    """"
    print request.META
    XS_SHARING_ALLOWED_METHODS = ["POST", "GET", "OPTIONS", "PUT", "DELETE"]
    response = HttpResponse()
    try:
        #    if 'HTTP_ACCESS_CONTROL_REQUEST_METHOD' in request.META:
        #    json.dumps({'help_request_id': hr_id, 'message': message}, ensure_ascii=False), mimetype='application/json')
        response['Access-Control-Allow-Origin']  = "*" # XS_SHARING_ALLOWED_ORIGINS
        response['Access-Control-Allow-Methods'] = ",".join( XS_SHARING_ALLOWED_METHODS )
        response['Access-Control-Allow-Headers'] = ",".join( XS_SHARING_ALLOWED_HEADERS )
        #        response['Access-Control-Allow-Credentials'] = XS_SHARING_ALLOWED_CREDENTIALS
    except as e:
        print "hello"
    #print response
    """
    print hr_id, message
    XS_SHARING_ALLOWED_METHODS = ["POST", "GET", "OPTIONS", "PUT", "DELETE"]
    response = HttpResponse(
        json.dumps({'help_request_id': hr_id, 'message': message}, ensure_ascii=False), mimetype='application/json')
    response['Access-Control-Allow-Origin']  = "*" # XS_SHARING_ALLOWED_ORIGINS 
    response['Access-Control-Allow-Methods'] = ",".join( XS_SHARING_ALLOWED_METHODS ) 
    return response


# @csrf_protect
@csrf_exempt
def ajax_capture_interaction_stop(request):
    """
    store captured audio data
    """
    print "interaction stop"
    message = "success"
    url = "#"
    # TODO: update whiteboard, ended_at information
    if request.method == "POST":
        # data = request.POST["data"]
        try:
            print request.POST, request.FILES
            blob = request.FILES['audio_file']
            interaction_id = request.POST['interaction_id']
            interaction = Interaction.objects.get(id=interaction_id)
            # look at the recorded type and choose the extension accordingly
            filename = interaction_id + ".ogg"
            filepath = os.path.join(settings.MEDIA_ROOT, filename)
            print "saving", filepath
            with open(filepath, "wb+") as fd:
                for chunk in blob.chunks():
                    fd.write(chunk)
            interaction.audio_path = filename
            interaction.ended_at = datetime.utcnow().replace(tzinfo=utc)
            interaction.save()
            url = settings.MEDIA_URL + filename
        except Exception as e:
            import sys
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            message = "database access error"

        try:
            # mark all help requests from this student as resolved
            # help_request = HelpRequest.objects.get(id=request.POST['hr_id'])
            # help_request.status = "resolved"
            # help_request.save()
            help_requests = HelpRequest.objects.filter(student=request.POST['student_id'])
            for hr in help_requests:
                hr.status = "resolved"
                hr.save()
        except:
            print "help request processing error"
            message = "help request processing error"
    return HttpResponse(
        json.dumps({'message': message, 'url': url}, ensure_ascii=False), mimetype='application/json')


@csrf_protect
def ajax_capture_interaction_accept(request):
    """
    accept this interaction, and store summary
    """
    message = "success"
    if request.method == "POST":
        print request.POST
        data = json.loads(request.POST["data"])
        try:
            interaction_id = data["interaction_id"]
            interaction = Interaction.objects.get(id=interaction_id)
            interaction.instructor_summary = data["instructor_summary"]
            interaction.is_rejected = False
            interaction.save()
        except:
            print "exception"
    return HttpResponse(
        json.dumps({'message': message}, ensure_ascii=False), mimetype='application/json')

@csrf_exempt
def ajax_capture_interaction_store_media(request):

    try:
        media_type = request.GET['media_type']
    except KeyError as e:
        return HttpResponseBadRequest(str(e))


    if media_type == 'audio_wav':
        # jRecorder is sending us an audio file
        wav_blob = request.body
        print 'received audio of size: ', len(wav_blob)

        try:
            interaction_id = request.GET['interaction_id']
        except KeyError as e:
            return HttpResponseBadRequest(e)

        interaction = Interaction.objects.get(id=interaction_id)
        wav_filename = interaction_id + '.wav'
        mp3_filename = interaction_id + '.mp3'
        ogg_filename = interaction_id + '.ogg'
        wav_filepath = os.path.join(settings.MEDIA_ROOT, wav_filename)
        mp3_filepath = os.path.join(settings.MEDIA_ROOT, mp3_filename)
        ogg_filepath = os.path.join(settings.MEDIA_ROOT, ogg_filename)

        with open(wav_filepath, "wb+") as fd:
            fd.write(wav_blob)
        interaction.audio_path = wav_filename
        interaction.ended_at = datetime.utcnow().replace(tzinfo=utc) # todo use client's time
        interaction.save()

        if not os.fork():
        #if True:
            commands = ['avconv -i '+ wav_filepath + ' ' +mp3_filepath, 'avconv -i '+ wav_filepath + ' ' +ogg_filepath]
            for cmd in commands: 
                print cmd
                os.system(cmd)
            sys.exit(-1)

        url = settings.MEDIA_URL + wav_filename

        return HttpResponse(json.dumps({'url': url}, ensure_ascii=False),
                             mimetype='application/json')
    elif media_type == 'canvascapture_json':

        try:
            interaction_id = request.POST['interaction_id']
            canvas_capture = request.POST['capture']
        except KeyError as e:
            return HttpResponseBadRequest(str(e))

        print 'received video of size ', len(canvas_capture)
        interaction = Interaction.objects.get(id=interaction_id)
        filename = interaction_id + '.can'
        filepath = os.path.join(settings.MEDIA_ROOT, filename)
        with open(filepath, "wb+") as fd:
            fd.write(canvas_capture)
        interaction.video_path = filename
        interaction.save()

        url = settings.MEDIA_URL + filename
        return HttpResponse(json.dumps({'url': url}, ensure_ascii=False),
                             mimetype='application/json')


    else:
        return HttpResponseBadRequest('unknown media type')



@csrf_protect
def ajax_layout_students_progress(request):
    """
    get updated student progress
    """
    message = "success"
    if request.method == "POST":
        print request.POST
        data = json.loads(request.POST["data"])
        course = Course.objects.get(id=data["course_id"])
        session = Session.objects.get(id=data["session_id"])
        students = Student.objects.filter(course=course.id)
        results = {}
        # for student in students:
        #     try:
        #         result = urllib2.urlopen("http://ls.edx.org:2233/qinfo?student=" + str(student.id)).read()
        #         results[str(student.id)] = json.loads(result)
        #     except (urllib2.HTTPError, urllib2.URLError) as e:
        #         print e, "error returned"

        try:
            results = urllib2.urlopen("http://ls.edx.org:2233/allqinfo").read()
        except (urllib2.HTTPError, urllib2.URLError) as e:
            print e, "error returned"

        requests = {}
        try:
            pending_requests = HelpRequest.objects.filter(
                session_id=session.id,
                status__in=["requested", "in_progress"])
            # TODO: add "resolved" and show them as previous resolved requests

            # handling multiple requests from a student
            # if in discussion, show only that and ignore all others
            # if not in discussion, show only the most recent unattended request
            from collections import Counter
            request_count = Counter()
            most_recent_request = {}
            progress_count = Counter()
            filtered_requests = []
            # count in-progress and requested items per student
            for pr in pending_requests:
                # if "in_progress", ignore all "requested"
                if pr.status == "in_progress":
                    filtered_requests.append(pr)
                    progress_count[pr.student.id] += 1
                elif pr.status == "requested":
                    request_count[pr.student.id] += 1
                    if pr.student.id not in most_recent_request:
                        most_recent_request[pr.student.id] = pr
                    if most_recent_request[pr.student.id].requested_at <= pr.requested_at:
                        most_recent_request[pr.student.id] = pr

            for student_id in most_recent_request:
                if student_id not in progress_count:
                    filtered_requests.append(most_recent_request[student_id])

            requests = model_to_json(filtered_requests)

        except ObjectDoesNotExist:
            print "no pending help requests"

    return HttpResponse(
        json.dumps({'results': results, 'requests': requests}, ensure_ascii=False), mimetype='application/json')

def index(request):
    return render_to_response("sitemap.html", {})
