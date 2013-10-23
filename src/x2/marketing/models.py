from django.contrib.auth.models import User
from django.db import models

def create_course(slug, name):
    c = Resource()
    c.name = name
    c.slug = slug
    c.save()

class Resource(models.Model):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=32, unique = True)
    parent = models.ForeignKey("Resource", default=None) # e.g. for a section, 
    

class Enrollment(models.Model):
    user = models.ForeignKey(User)
    resource = models.ForeignKey(Resource)
    MODES = (('A', 'Active'),
             ('L', 'Lurker'), 
             ('U', 'Unenrolled'))
    mode = models.CharField(max_length=100, choices=MODES, default = 'Active')

