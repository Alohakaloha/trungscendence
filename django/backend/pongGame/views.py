from django.shortcuts import render
from django.http import HttpResponse
from . import pong


def header_view(request):
	return render(request,'header.html')

def menu(request):
	return render(request,'game/menu.html')

def game(request):
	return render(request,'game/gameSetup.html')

def localSetup(request):
	return render(request,'game/local.html')

def pong_view(request):
	return render(request,'game/pong.html')

def localMatch(request):
	return HttpResponse(request, status=200)

def startGame(request):
	return pong.startGame(request)