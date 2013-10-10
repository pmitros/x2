from django.db import models

def create_course(slug, name):
    c = Course()
    c.name = name
    c.slug = slug
    c.save()

class Course(models.Model):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=32, unique = True)
