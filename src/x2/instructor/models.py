from django.db import models
import django.contrib.auth.models
import json
import datetime


class Course(models.Model):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=32)
    term = models.CharField(max_length=255)
    classroom_layout_path = models.URLField(blank=True)

    def __unicode__(self):
        return self.name


class Agent(models.Model):
    name = models.CharField(max_length=255)
    course = models.ForeignKey(Course)
    #email = models.EmailField()
    location = models.CharField(max_length=255, blank=True)
    level = models.IntegerField(default=0)
    profile_img_path = models.CharField(max_length=500, blank=True)

    def toJSON(self):
        return json.dumps(self, default=dthandler, sort_keys=True)    

    def __unicode__(self):
        return self.name

class Learner(models.Model):
    ''' Student (below) will be obsoleted by this '''
    agent = models.ForeignKey(Agent)    
    needs_help = models.BooleanField()
    # not used
    interaction_in_progress = models.BooleanField()

class Individual(models.Model):
    agent = models.ForeignKey(Agent)    
    user = models.ForeignKey(django.contrib.auth.models.User)

class Student(Agent):
    # not used
    needs_help = models.BooleanField()
    # not used
    interaction_in_progress = models.BooleanField()

    def toJSON(self):
        return json.dumps(self, default=dthandler, sort_keys=True)

class Session(models.Model):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=32)
    course = models.ForeignKey(Course)
    started_at = models.DateTimeField(blank=True)
    ended_at = models.DateTimeField(blank=True)

    def __unicode__(self):
        return self.name


class SessionStudentData(models.Model):
    """
    session-specific student data (not persistent across sessions)
    """
    session = models.ForeignKey(Session)
    student = models.ForeignKey(Student)
    progress = models.CharField(max_length=32, blank=True)
    group = models.CharField(max_length=32, blank=True)
    badge = models.CharField(max_length=32, blank=True)
    num_help_requested = models.IntegerField(default=0)
    num_help_received = models.IntegerField(default=0)

    def toJSON(self):
        return json.dumps(self, default=dthandler, sort_keys=True)

    def __unicode__(self):
        return unicode(self.session) + " " + unicode(self.student)


class TableBlock(models.Model):
    session = models.ForeignKey(Session)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)

    def toJSON(self):
        return json.dumps(self, default=dthandler, sort_keys=True)

    def __unicode__(self):
        return self.name


class HelpRequest(models.Model):
    session = models.ForeignKey(Session)
    student = models.ForeignKey(Student)
    requested_at = models.DateTimeField(blank=True)
    # status of this help request: requested, in_progress, resolved, canceled
    status = models.CharField(max_length=32)
    # description added by the student
    description = models.CharField(max_length=1024, blank=True, null=True)
    # current learning resource, index in the queue
    # TODO: access the database of resources and refer to the id there
    resource = models.CharField(max_length=32, blank=True, null=True)

    def toJSON(self):
        return json.dumps(self, default=dthandler, sort_keys=True)

    def __unicode__(self):
        return self.description


class Interaction(models.Model):
    agent_teacher = models.ManyToManyField(Agent, related_name="t")
    agent_learner = models.ManyToManyField(Agent, related_name="l")
    started_at = models.DateTimeField(blank=True)
    ended_at = models.DateTimeField(blank=True)
    is_rejected = models.BooleanField(default=True)
    audio_path = models.URLField(blank=True)
    video_path = models.URLField(blank=True) # also stores vertex data not video
    whiteboard_path = models.URLField(blank=True)
    instructor_summary = models.CharField(max_length=1024, blank=True, null=True)
    student_summary = models.CharField(max_length=1024, blank=True, null=True)

    def toJSON(self):
        return json.dumps(self, default=dthandler, sort_keys=True)

    def __unicode__(self):
        return str(self.id)


def dthandler(obj):
    # lambda obj: obj.isoformat() if isinstance(obj, datetime.datetime) else obj.__dict__
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        return obj.__dict__
        # raise TypeError, 'Object of type %s with value of %s is not JSON serializable' % (type(obj), repr(obj))
