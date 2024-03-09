import json
from asgiref.sync import async_to_sync
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
	
	async def receive(self, text_data):
		try:
			chatJSON = json.loads(text_data)
			message = chatJSON["message"]
			user = chatJSON["username"]
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data}")


	async def chat_message(self, event):
		# Extract the message from the event
		message = event['message']

		# Send the message to the WebSocket
		await self.send(text_data=json.dumps({
			'message': message
		}))

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']

		# Send message to room group
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': message
			}
		)

		# text_data_json = json.loads(text_data)

		#json.dumps is a module to convert python object into a json string
		await self.send(text_data)