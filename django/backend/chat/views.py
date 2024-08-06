import sys
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from auth_app.models import AppUser

def chat(request):
	return render(request,'chat.html')

def getUserID_by_username_view(request, username):
	if request.user.is_authenticated:
		friend_user = AppUser.objects.get(username=username)
		if request.user.friends.filter(email=friend_user.email).exists():
			return JsonResponse({'status': 'success', 'user_id': friend_user.user_id})
		else:
			return JsonResponse({'status': 'error', 'message':'You are not friends with this user.'})
	else:
		return JsonResponse({'status': 'error', 'message':'You must be logged in to view this page.'})

