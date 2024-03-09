import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from auth_app.models import AppUser

def create_superuser():
	email = os.getenv('DB_USER') + '@whateva.com'
	password = os.getenv('DB_PASSWORD')

	if not AppUser.objects.filter(email=email).exists():
		AppUser.objects.create_superuser(email, 'admin', password)
		print(f"Superuser {email} created")
	else:
		print(f"Superuser {email} already exists")

if __name__ == '__main__':
	create_superuser()