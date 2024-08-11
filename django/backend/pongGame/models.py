from django.db import models
from auth_app.models import AppUser
from django.utils import timezone

# Create your models here.
class Game(models.Model):
	number = models.IntegerField(default=0)

class Tournaments(models.Model):
	tournament_id = models.IntegerField(default=0)
	tournament_winner = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='tournament_winner', null=True, blank=True)
	participants = models.ManyToManyField(AppUser, related_name='participants')
	host = models.CharField(max_length=15)
	canceled = models.BooleanField(default=False)
	date = models.DateTimeField(default=timezone.now)

class RemoteMatch(models.Model):
	match_id = models.AutoField(primary_key=True)
	player_1 = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='player_1')
	player_2 = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='player_2')
	score_1 = models.IntegerField(default=0)
	score_2 = models.IntegerField(default=0)
	winner = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='winner', null=True, blank=True)
	cancelled = models.BooleanField(default=False)
	date = models.DateTimeField(default=timezone.now)

	def __str__(self):
		return str(self.match_id)

class LocalMatch(models.Model):
	match_id = models.AutoField(primary_key=True)
	type = models.CharField(max_length=20, blank=True)
	player_1 = models.CharField(max_length=15)
	player_2 = models.CharField(max_length=15)
	rounds_player_1 = models.IntegerField(default=0)
	rounds_player_2 = models.IntegerField(default=0)
	winner = models.CharField(max_length=15)
	cancelled = models.BooleanField(default=False)
	date = models.DateTimeField(default=timezone.now)

	def __str__(self):
		return str(self.match_id)