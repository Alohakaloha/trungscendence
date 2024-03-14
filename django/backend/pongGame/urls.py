from django.urls import path
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
	path('game/gameSetup.html', views.game, name='gameSetup'),
	path('game/local.html', views.localSetup, name='local'),
	path('localmatch', views.localMatch, name='localmatch'),
]