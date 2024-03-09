from django.shortcuts import render

def menu(request):
	return render(request,'game/menu.html')

def game(request):
	return render(request,'game/game.html')

# Create your views here.
