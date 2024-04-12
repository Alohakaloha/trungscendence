from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from auth_app import urls

urlpatterns = [
	path('game', views.header_view, name='game'),
	path('game/setupGameMode.html', views.game, name='gameSetup'),
	path('game/local.html', views.localSetup, name='local'),
	path('localmatch', views.localMatch, name='localmatch'),
	path('game/lTournamentSetup.html', views.tournamentSetup, name='rTournamentSetup'),
	path('game/enterLocalTournament.html', views.enterLocalTournament, name='rTournamentSetup'),
	path('game/rTournamentSetup.html', views.rtournamentSetup, name='rTournamentSetup'),
	path('game/versusSetup.html', views.versusSetup, name='versusSetup'),
	path('pong', views.header_view, name='online'),
	path('game/pong.html', views.pong_view , name='pongGame'),
]