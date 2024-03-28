from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from auth_app import urls

urlpatterns = [
	path('game', views.header_view, name='game'),
	path('game/gameSetup.html', views.game, name='gameSetup'),
	path('game/local.html', views.localSetup, name='local'),
	path('localmatch', views.localMatch, name='localmatch'),
	path('pong', views.header_view, name='online'),
	path('game/pong.html', views.pong_view , name='pongGame'),
]