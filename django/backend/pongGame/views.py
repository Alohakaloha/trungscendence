from django.shortcuts import render
from django.http import HttpResponse

def menu(request):
	return render(request,'game/menu.html')

def game(request):
	return render(request,'game/gameSetup.html')

def localSetup(request):
	return render(request,'game/local.html')

def localMatch(request):
	return HttpResponse("Nice", status=200)
