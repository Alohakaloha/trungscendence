from django.urls import path
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
	path('chat/chat.html', views.chat, name='chat_view'),
	path('get_UID/<str:username>', views.getUserID_by_username_view, name='get_user_id_by_username_view'),
	
]
