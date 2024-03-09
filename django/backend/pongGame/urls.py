from django.urls import path
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
	path('game/game.html', views.game, name='game'),
]