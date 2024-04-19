from django.shortcuts import render
from django.http import HttpResponse
from . import pong


def header_view(request):
	return render(request,'header.html')

def menu(request):
	return render(request,'game/menu.html')

def game(request):
	return render(request,'game/setupGameMode.html')

def localSetup(request):
	return render(request,'game/local.html')

def tournamentSetup(request):
	return render(request,'game/setupLocalTournament.html')

def enterLocalTournament(request):
	return render(request,'game/enterLocalTournament.html')

def rtournamentSetup(request):
	return render(request,'game/setupRemoteTournament.html')

def versusSetup(request):
	return render(request,'game/setupVersus.html')

def pong_view(request):
	return render(request,'game/pong.html')

def localMatch(request):
	return HttpResponse(request, status=200)

def match(request):
	return render(request,'game/match.html')