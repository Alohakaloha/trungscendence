import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


import sys

def logprint(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)


class chatConsumer(WebsocketConsumer):

	def connect(self):
		self.room_name = "Wobbot"
		self.room_group_name = f"chat_{self.room_name}"


		async_to_sync(self.channel_layer.group_add)(
			self.room_group_name,
			self.channel_name
		)
		self.accept()

	def fetch_messages(self, data):
		from .models import Message
		messages = Message.last_10_messages()
		return messages

	def new_message(self, data):
		pass

	commands = {
		'fetch_messages': fetch_messages,
		'new_message': new_message
	
	}

	def disconnect(self, close_code):
		logprint("Disconnected")
		# Leave room group
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name,
			self.channel_name
		)


	def chat_message(self, event):
		# Extract the message from the event
		message = event['message']

		# Send the message to the WebSocket
		async_to_sync(self.send)(text_data=json.dumps({
			'message': message,
			'fetch': "fetch_messages"
		}))

	def receive(self, text_data):
		from .models import Chat
		from auth_app.models import AppUser
		
		data = json.loads(text_data)
		if (data["type"] == "chatroom"):
			logprint("Chatroom")
			logprint("............")
			chat = Chat.getChat(data["sender"], Chat.get_user_mail(data["receiver"]))
		return


	
	# @async_to_sync
	def getMessageModel(self):
		from .models import Message
		return Message.last_5_messages()
		