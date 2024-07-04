import sys
import json
from django.utils import timezone
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import chat

# Dictionary to map usernames to their WebSocket channels
user_channel_mapping = {}

def logprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = 'chatting'
        self.room_group_name = f'chat_{self.room_name}'
        self.username = self.scope['user'].username

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Add user to user_channel_mapping
        user_channel_mapping[self.username] = self.channel_name

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': f"{self.username} has joined the chat",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': f"{self.username} has left the chat",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }
        )

        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Remove user from user_channel_mapping
        if self.username in user_channel_mapping:
            del user_channel_mapping[self.username]

    async def receive(self, text_data):
        from .models import Chat, Message
        from auth_app.models import AppUser

        try:
            chat_json = json.loads(text_data)
            action_type = chat_json.get('type')
            sender_uname = chat_json.get('sender')
            message_content = chat_json.get('message')
            receiver_uname = chat_json.get('receiver')

            logprint(f"Received {action_type} from sender {sender_uname}: {message_content}")

            # Fetch sender asynchronously
            sender = await sync_to_async(AppUser.objects.get)(username=sender_uname)

            if receiver_uname == 'global':
                # Broadcast message to the chat room without saving to database
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_content,
                        'sender': sender.username,
                        'timestamp': self.get_current_timestamp(),
                    }
                )
            else:
                sender_channel = user_channel_mapping.get(sender_uname)
                if action_type == 'message':
                    # Private message handling
                    try:
                        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_uname)
                    except AppUser.DoesNotExist:
                        logprint(f"User '{receiver_uname}' does not exist")
                        return
                    # Check if receiver is connected
                    receiver_channel = user_channel_mapping.get(receiver_uname)
                    if receiver_channel:
                        logprint(f"Receiver '{receiver_uname}' is currently connected")
                    else:
                        logprint(f"Receiver '{receiver_uname}' is not connected")

                    chat = await sync_to_async(Chat().find_or_create_chat)(sender, receiver)
                    # Create message asynchronously
                    await sync_to_async(Message.objects.create)(
                        chat=chat,
                        sender=sender,
                        content=message_content
                    )
                    # Send private message to receiver and sender
                    receiver_channel = user_channel_mapping.get(receiver_uname)
                    message_event = {
                        'type': 'chat_message',
                        'message': message_content,
                        'sender': sender_uname,
                        'timestamp': self.get_current_timestamp(),
                        'direct_message': True
                    }
                    if receiver_channel:
                        await self.channel_layer.send(receiver_channel, message_event)
                    if sender_channel:
                        await self.channel_layer.send(sender_channel, message_event)
                elif action_type == 'block':
                    logprint("Block action received")
                    await self.block_user(chat_json)
                elif action_type == "chatroom":
                    logprint("Chatroom condition met")
                    receiver = await sync_to_async(AppUser.objects.get)(username=receiver_uname)
                    chat_messages = await sync_to_async(Chat().load_history)(sender, receiver)
                    if sender_channel:
                        await self.send(json.dumps(chat_messages))
                else:
                    logprint(f"Unknown action type received: {action_type}")

        except KeyError as e:
            logprint(f"Missing key in JSON data: {e}")
        except json.JSONDecodeError:
            logprint(f"Invalid JSON: {text_data}")
        except AppUser.DoesNotExist as e:
            logprint(f"User '{receiver_uname}' does not exist: {e}")
        except Exception as e:
            logprint(f"An error occurred: {e}")


    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        timestamp = event['timestamp']
        direct_message = event.get('direct_message', False)

        await self.send(text_data=json.dumps({
            'type': "message",
            'message': message,
            'sender': sender,
            'timestamp': timestamp,
            'direct_message': direct_message,
        }))

    async def block_user(self, chat_json):
        from .models import Chat, Message
        from auth_app.models import AppUser

        sender_frontend = chat_json.get('sender')
        receiver_frontend = chat_json.get('receiver')

        sender = await sync_to_async(AppUser.objects.get)(username=sender_frontend)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_frontend)

        logprint(f"{sender.username} is blocking {receiver.username}")

    def get_current_timestamp(self):
        current_time = timezone.now()
        local_time = timezone.localtime(current_time)
        return local_time.strftime('%d.%m.%Y %H:%M')
    