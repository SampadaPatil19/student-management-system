from django.db import models

# Create your models here.
class Student(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    roll = models.IntegerField()
    city = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True, blank=True)
    course = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.name