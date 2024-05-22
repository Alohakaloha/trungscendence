from auth_app.models import AppUser
from django.conf import settings

# requires to define two functions authenticate and get_user

class PasswordlessAuthBackend:  

    def authenticate(self, request, email=None):
        try:
            user = AppUser.objects.get(email=email)
            return user
        except AppUser.DoesNotExist:
            return None
        
    def get_user(self, user_id):
        try:
            return AppUser.objects.get(pk=user_id)
        except AppUser.DoesNotExist:
            return None