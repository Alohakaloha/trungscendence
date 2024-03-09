from typing import Any
from django.utils import timezone
from .models import AppUser

class UpdateLastOnlineMiddleware:
	def __init__(self, get_response):
		self.get_response = get_response
	
	def __call__(self, request):
		response = self.get_response(request)

		if hasattr(request, 'user') and request.user.is_authenticated:
			self.update_last_online(request.user)

		return response
	
	def update_last_online(self, user):
		try:
			app_user = AppUser.objects.get(user_id=user.user_id)
			app_user.last_online = timezone.now()
			app_user.save()
		except AppUser.DoesNotExist:
			pass