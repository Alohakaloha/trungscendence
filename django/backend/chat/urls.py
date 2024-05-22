from django.urls import path
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
	path('chat/chat.html', views.chat, name='chat_view'),
]