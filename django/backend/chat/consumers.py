import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import sys

def logprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class ChatConsumer(AsyncWebsocketConsumer):
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

        try:
            chat_json = json.loads(text_data)
            receiver_uname = chat_json['receiver']
            sender_email = chat_json['sender']
            receiver_email = await AppUser.get_email_by_username(receiver_uname)

            user1 = await sync_to_async(AppUser.objects.get)(email=sender_email)
            user2 = await sync_to_async(AppUser.objects.get)(email=receiver_email)
            logprint(user1, user2)
            chat = await sync_to_async(Chat.find_or_create_chat)(self, user1, user2)

        except KeyError as e:
            logprint(f"Missing key in JSON data: {e}")
        except json.JSONDecodeError:
            logprint(f"Invalid JSON: {text_data}")
        except AppUser.DoesNotExist as e:
            logprint(f"User does not exist: {e}")
        except Exception as e:
            logprint(f"An error occurred: {e}")

    def getMessageModel(self):
        from .models import Message
        return Message.last_5_messages()



# # This are my local functions for the whisper mechanic, needs adjustment for project scope
# # chat/consumers.py

# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from datetime import datetime
# from asgiref.sync import sync_to_async
# from django.contrib.auth import get_user_model
# from .models import ChatMessage, DirectMessage

# # A global dictionary to store the mapping of usernames to channel names
# user_channel_mapping = {}

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         if self.scope["user"].is_authenticated:
#             self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#             self.room_group_name = "chat_%s" % self.room_name

#             # Store the user's channel name
#             user_channel_mapping[self.scope["user"].username] = self.channel_name

#             # Join room group
#             await self.channel_layer.group_add(self.room_group_name, self.channel_name)

#             await self.accept()

#             # Print the connection attempt
#             print(f"User {self.scope['user'].username} connected to room {self.room_name}")
#         else:
#             # Print the unauthorized connection attempt
#             print("Unauthorized connection attempt")
#             await self.close()

#     async def disconnect(self, close_code):
#         # Remove the user's channel name from the mapping
#         if self.scope["user"].username in user_channel_mapping:
#             del user_channel_mapping[self.scope["user"].username]

#         # Leave room group
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json["message"]
#         recipient_username = text_data_json.get("recipient")

#         if recipient_username and recipient_username != self.scope["user"].username:  
#             # Direct message to another user
#             await self.save_direct_message_to_database(message, recipient_username)
#             await self.send_direct_message_to_recipient(message, recipient_username)
#         else:  
#             # Message to room or message to self (not a direct message)
#             await self.save_message_to_database(message)
#             await self.send_to_room(message)

#     async def send_direct_message_to_recipient(self, message, recipient_username):
#         # Retrieve the recipient's channel name from the mapping
#         recipient_channel_name = user_channel_mapping.get(recipient_username)
#         if recipient_channel_name:
#             print("Recipient channel name:", recipient_channel_name)

#             await self.channel_layer.send(
#                 recipient_channel_name,
#                 {
#                     "type": "chat_message",
#                     "message": message,
#                     "username": self.scope["user"].username,
#                     "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
#                     "direct": True,  # Indicate that it's a direct message
#                 }
#             )

#     async def save_message_to_database(self, message):
#         user = self.scope["user"]
#         room_name = self.room_name
#         timestamp = datetime.now()

#         # Use sync_to_async to save the message asynchronously
#         await sync_to_async(ChatMessage.objects.create)(
#             user=user, room_name=room_name, message=message, timestamp=timestamp
#         )

#     async def save_direct_message_to_database(self, message, recipient_username):
#         sender = self.scope["user"]
#         recipient = await sync_to_async(get_user_model().objects.get)(username=recipient_username)

#         await sync_to_async(DirectMessage.objects.create)(
#             sender=sender, recipient=recipient, message=message
#         )

#         # Send acknowledgment to sender
#         await self.send(text_data=json.dumps({
#             "message": "Direct message sent successfully",
#             "username": "System",
#             "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
#         }))

#     async def send_to_room(self, message):
#         # Send message to room group
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 "type": "chat_message",
#                 "message": message,
#                 "username": self.scope["user"].username,
#                 "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
#                 "direct": False,  # Indicate that it's not a direct message
#             }
#         )

#     async def chat_message(self, event):
#         message = event["message"]
#         username = event["username"]
#         timestamp = event["timestamp"]
#         is_direct = event.get("direct", False)

#         if is_direct:
#             # Send direct message to WebSocket
#             await self.send(text_data=json.dumps({
#                 "message": message,
#                 "username": username,
#                 "timestamp": timestamp,
#                 "direct": True,
#             }))
#         else:
#             # Send message to WebSocket
#             await self.send(text_data=json.dumps({
#                 "message": message,
#                 "username": username,
#                 "timestamp": timestamp,
#                 "direct": False,
#             }))
