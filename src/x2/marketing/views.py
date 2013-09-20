from django.shortcuts import render

def index(request):
    return render(request, "marketing_index.html", {})
