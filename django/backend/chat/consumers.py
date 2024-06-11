import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

import sys

def logprint(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)


class chatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = "all_chat"
		self.room_group_name = f"chat_{self.room_name}"

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		await self.accept()

	async def disconnect(self, close_code):
		# Leave room group
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
	


	async def chat_message(self, event):
		# Extract the message from the event
		message = event['message']

		# Send the message to the WebSocket
		await self.send(text_data=json.dumps({
			'message': message
		}))

	async def receive(self, text_data):
		from .models import Chat
		from auth_app.models import AppUser

		chat_json = json.loads(text_data)
		receiver_uname = chat_json['receiver']
		sender_email = chat_json['sender']
		receiver_email = await AppUser.get_email_by_username(receiver_uname)
		try:
			user1 = await sync_to_async(AppUser.objects.get)(email=sender_email)
			user2 = await sync_to_async(AppUser.objects.get)(email=receiver_email)
			logprint(user1, user2)
			chat = await sync_to_async(Chat.find_or_create_chat)(self, user1, user2)
			
		except Exception as e:
			logprint(f"User {receiver_uname} does not exist: {e}")
		# try:
		# 	user_email = AppUser.objects.get(username=chatJSON.receiver).email
		# 	logprint(user_email)

		# except json.JSONDecodeError:
		# 	logprint(f"Invalid JSON: {text_data}")

	
	# @async_to_sync
	def getMessageModel(self):
		from .models import Message
		return Message.last_5_messages()
		