from django.conf import settings
from django.shortcuts import render_to_response
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import csrf_protect
from django.core.exceptions import ObjectDoesNotExist
from instructor.models import *
from datetime import datetime
import os
import json


# def blocks_to_json(blocks):
#     result = []
#     for block in blocks:
#         json_block = {}
#         json_block["id"] = block.id
#         json_block["name"] = block.name
#         # json_block["location"] = block.location
#         json_block["left"] = block.location.split(",")[0]
#         json_block["top"] = block.location.split(",")[1]
#         result.append(json_block)
#     print json.dumps(result)
#     return json.dumps(result)


def model_to_json(instances):
    result = []
    # Hack to serialize a django model. There is no good way to deal with foreign keys.
    for instance in instances:
        result.append(json.loads(instance.toJSON()))
    return json.dumps(result)


# class DataEncoder(json.JSONEncoder):
#     def default(self, o):
#         return o.__dict__

def populate_session_students(session_id, students):
    for student in students:
        try:
            model = SessionStudentData.objects.get(session_id=session_id, student_id=student.id)
        except ObjectDoesNotExist:
            model = SessionStudentData(session_id=session_id, student_id=student.id)
            model.save()


def view_layout(request, course_slug, session_slug):
    try:
        course = Course.objects.get(slug=course_slug)
        session = Session.objects.get(slug=session_slug)
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
        "blocks": model_to_json(blocks),
        "students": model_to_json(students),
        "session_students": model_to_json(session_students)})


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


def capture(request, course_slug, session_slug):
    try:
        student_id = int(request.GET.get('sid'))
    except (KeyError, TypeError):
        student_id = 1
    try:
        course = Course.objects.get(slug=course_slug)
        session = Session.objects.get(slug=session_slug)
        student = Student.objects.get(id=student_id)
        # TODO: hardcoded for hack
        instructor = Instructor.objects.get(id=11)
        interaction = Interaction(
            started_at=datetime.now(),
            ended_at=datetime.now(),
            is_rejected=True)
        interaction.t = instructor
        interaction.l = student
        interaction.save()
    except ObjectDoesNotExist:
        raise Http404
    return render_to_response(
        "capture_interaction.html",
        {"course": course,
        "session": session,
        "student": student,
        "instructor": instructor,
        "interaction": interaction})


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
                print key, data[key]
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
                    print key, data[key]
                    setattr(model, key, data[key])
                model.save()
            except ObjectDoesNotExist:
                # model = SessionStudentData(
                #     session_id=data["session_id"], student_id=data["student_id"])
                message = "database access error"
    return HttpResponse(
        json.dumps({'message': message}, ensure_ascii=False), mimetype='application/json')


@csrf_protect
def ajax_layout_help_request_new(request):
    """
    Create a new help request from a student
    """
    message = "success"
    hr_id = -1
    if request.method == "POST":
        data = json.loads(request.POST["data"])
        if data["session_id"] == "" or data["student_id"] == "":
            print "database access error"
        else:
            try:
                model = HelpRequest(
                    session_id=data["session_id"], 
                    student_id=data["student_id"],
                    description=data["description"],
                    resource=data["resource"],
                    status="requested")
                hr_id = model.id
                model.save()
            except:
                message = "help request processing failed"
    return HttpResponse(
        json.dumps({'help_request_id': hr_id, 'message': message}, ensure_ascii=False), mimetype='application/json')


@csrf_protect
def ajax_capture_interaction_stop(request):
    """
    store captured audio data
    """
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
            filename = interaction_id + ".ogg"
            filepath = os.path.join(settings.MEDIA_ROOT, filename)
            with open(filepath, "wb+") as fd:
                for chunk in blob.chunks():
                    fd.write(chunk)
            interaction.audio_path = filename
            interaction.ended_at = datetime.now()
            interaction.save()
            url = settings.MEDIA_URL + filename
        except:
            print "error", url
            message = "database access error"
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
            interaction.instructor_summary = data["summary"]
            interaction.is_rejected = False
            interaction.save()
        except:
            print "exception"
    return HttpResponse(
        json.dumps({'message': message}, ensure_ascii=False), mimetype='application/json')
   

    
