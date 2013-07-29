from django.shortcuts import render_to_response
from django.http import HttpResponse


def classroom_layout(request):
    return render_to_response("index.html", {"course": "6.00x"})
