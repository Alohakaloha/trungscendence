from django.shortcuts import render
from django.http import HttpResponse
from .models import RemoteMatch
from . import pong
import sys

from tabulate import tabulate

def output_table(queryset, limit=50):
    headers = [x.name for x in queryset.model._meta.fields]
    rows = queryset.values_list(*headers)
    if limit is not None:
        rows = rows[:limit]
    print(tabulate(rows, headers), sys.stderr)

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

def localTournament(request):
	return render(request,'game/localTournament.html')

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

def history(request):
	if request.method == 'GET':
		# matches = RemoteMatch.object.all()
		# print(f'{request.user}', file=sys.stderr)
		matches = RemoteMatch.objects.filter(player_1=request.user.user_id) | RemoteMatch.objects.filter(player_2=request.user.user_id)
		output_table(matches)
		return render (request, 'history.html', {'matches': matches})
