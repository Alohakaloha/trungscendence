from django.urls import re_path
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat import consumers

#the r before the string is to flag indicating a raw string
#the re_path is a function that takes a regular expression and a consumer
websocket_urlpatterns = [
    re_path(r'ws/chatting/$', consumers.chatConsumer.as_asgi()),
]

