from django.db import models


class Agent(models.Model):
    course = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    level = models.IntegerField(default=0)
    parent = models.ForeignKey('self')

# class Student(models.Model):
#   name = models.CharField(max_length=255)
#   profile_img = models.CharField(max_length=255)

# class Instructor(models.Model): 


