from django.db import models

# Create your models here.
class Game(models.Model):
	number = models.IntegerField(default=0)
