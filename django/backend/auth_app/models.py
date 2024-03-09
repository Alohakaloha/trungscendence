from django.db import models
from django.utils import timezone
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.humanize.templatetags.humanize import naturaltime
from django.db.models import Q

class AppUserManager(BaseUserManager):
    def create_user(self, email, username, password):
        if not email:
            raise ValueError('An email is required.')
        if not username:
            raise ValueError('A username is required.')
        if not password:
            raise ValueError('A password is required.')
        email = self.normalize_email(email)
        user = self.model(email=email)
        user.username = username
        user.set_password(password)
        user.profile_picture = "images/default.jpg"
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self.db)
        return user
    
    

class AppUser(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=50, unique=True)
    USERNAME_FIELD = 'email'
    username = models.CharField(max_length=30, unique=True)
    objects = AppUserManager()
    profile_picture = models.ImageField(null=True, blank=True, upload_to='staticstuff/images')
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)
    games = models.IntegerField(blank=True, null=True, default=0)
    wins = models.IntegerField(blank=True, null=True, default=0)
    losses = models.IntegerField(blank=True, null=True, default=0)
    draws = models.IntegerField(blank=True, null=True, default=0)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    last_online = models.DateTimeField(blank=True, null=True)

# returns a queryset of History instances where the user is either player_one or player_two
    def get_game_history(self):
        return History.objects.filter(Q(player_one=self) | Q(player_two=self)).order_by('-game_date')
    
    def is_online (self):
        if self.last_online:
            return (timezone.now() - self.last_online < timezone.timedelta(minutes=3))

    def get_online_info(self):
        if self.is_online():
            return 'Online'
        
        if self.last_online:
            return 'Was active {}'.format(naturaltime(self.last_online))
        return 'Unknown'
    def __str__(self):
        return self.email

class History(models.Model):
    game_id = models.AutoField(primary_key=True)
    game_date = models.DateTimeField(default=timezone.now)
    player_one = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, related_name='player_one_history')
    player_two = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, related_name='player_two_history')
    player_one_score = models.IntegerField(blank=True, null=True)
    player_two_score = models.IntegerField(blank=True, null=True)

class FriendRequest(models.Model):
    sender = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='received_requests')
    is_accepted = models.BooleanField(default=False)

    def accept(self):
        self.is_accepted = True
        self.save()
        self.sender.friends.add(self.receiver)
        self.receiver.friends.add(self.sender)
