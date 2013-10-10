from models import Course

def marketing_processor(request):
    return {'course_list' : Course.objects.all()}
