from django.db import models
import json


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
    email = models.EmailField()
    location = models.CharField(max_length=255, blank=True)
    level = models.IntegerField(default=0)
    # parent = models.ForeignKey('self', null=True, default=None)
    def __unicode__(self):
        return self.name


class Student(Agent):
    profile_img_path = models.CharField(max_length=500, blank=True)
    needs_help = models.BooleanField()
    interaction_in_progress = models.BooleanField()

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)


class Instructor(Agent):
    pass


class Group(Agent):
    pass


class Assistant(Agent):
    pass


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
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)
    def __unicode__(self):
        return unicode(self.session) + " " + unicode(self.student)


class TableBlock(models.Model):
    session = models.ForeignKey(Session)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)
    def __unicode__(self):
        return self.name


class Interaction(models.Model):
    agent_teacher = models.ManyToManyField(Agent, related_name="t")
    agent_learner = models.ManyToManyField(Agent, related_name="l")
    started_at = models.DateTimeField(blank=True)
    ended_at = models.DateTimeField(blank=True)
    is_rejected = models.BooleanField()
    audio_path = models.URLField(blank=True)
    video_path = models.URLField(blank=True)
    whiteboard_path = models.URLField(blank=True)
