import sys
import json
from django.utils import timezone
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

# Constants
DEFAULT_ROOM_NAME = 'chatting'

# Dictionary to map usernames to their WebSocket channels
user_channel_mapping = {}

def logprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from .models import Chat, Message
        from auth_app.models import AppUser

        self.room_name = DEFAULT_ROOM_NAME
        self.room_group_name = f'chat_{self.room_name}'
        self.username = self.scope['user'].username

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

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
        from .models import Chat, Message
        from auth_app.models import AppUser

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': f"{self.username} has left the chat",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }
        )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Remove user from user_channel_mapping
        user_channel_mapping.pop(self.username, None)

    async def receive(self, text_data):
        from .models import Chat, Message
        from auth_app.models import AppUser

        try:
            chat_json = json.loads(text_data)
            action_type = chat_json.get('type')
            sender_username = chat_json.get('sender')
            message_content = chat_json.get('message')
            receiver_username = chat_json.get('receiver')

            logprint(f"Received {action_type} from sender {sender_username}: {message_content}")

            if action_type == 'message':
                await self.handle_message(sender_username, receiver_username, message_content)
            elif action_type == 'block':
                await self.block_user(chat_json)
            elif action_type == 'chatroom':
                await self.handle_chatroom(sender_username, receiver_username)
            else:
                logprint(f"Unknown action type received: {action_type}")

        except (KeyError, json.JSONDecodeError) as e:
            logprint(f"Invalid JSON: {text_data}, Error: {e}")
        except AppUser.DoesNotExist as e:
            logprint(f"User '{receiver_username}' does not exist: {e}")
        except Exception as e:
            logprint(f"An error occurred: {e}")

    async def handle_message(self, sender_username, receiver_username, message_content):
        from .models import Chat, Message
        from auth_app.models import AppUser

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)

        if receiver_username == 'global':
            await self.broadcast_message(message_content, sender.username)
        else:
            await self.send_private_message(sender, receiver_username, message_content)

    async def broadcast_message(self, message_content, sender_username):
        from .models import Chat, Message
        from auth_app.models import AppUser

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_content,
                'sender': sender_username,
                'timestamp': self.get_current_timestamp(),
            }
        )

    async def send_private_message(self, sender, receiver_username, message_content):
        from .models import Chat, Message
        from auth_app.models import AppUser

        receiver_channel = user_channel_mapping.get(receiver_username)

        if receiver_channel:
            receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)
            chat = await sync_to_async(Chat().find_or_create_chat)(sender, receiver)
            await sync_to_async(Message.objects.create)(
                chat=chat,
                sender=sender,
                content=message_content
            )

            message_event = {
                'type': 'chat_message',
                'message': message_content,
                'sender': sender.username,
                'timestamp': self.get_current_timestamp(),
                'direct_message': True
            }

            await self.channel_layer.send(receiver_channel, message_event)
            sender_channel = user_channel_mapping.get(sender.username)
            if sender_channel:
                await self.channel_layer.send(sender_channel, message_event)
        else:
            logprint(f"Receiver '{receiver_username}' is not connected")
            system_message_event = {
                'type': 'chat_message',
                'message': f"{receiver_username} is not connected but will receive your message once coming online",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }
            sender_channel = user_channel_mapping.get(sender.username)
            if sender_channel:
                await self.channel_layer.send(sender_channel, system_message_event)

    async def block_user(self, chat_json):
        from auth_app.models import AppUser
        from .models import Block

        sender_username = chat_json.get('sender')
        receiver_username = chat_json.get('receiver')

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)

        # Check if the block already exists
        block_exists = await sync_to_async(Block.objects.filter(blocker=sender, blocked=receiver).exists)()
        if not block_exists:
            # Create a new block record
            await sync_to_async(Block.objects.create)(blocker=sender, blocked=receiver)
            logprint(f"{sender.username} has blocked {receiver.username}")

            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': f"You have blocked {receiver.username}",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }))
        else:
            logprint(f"{sender.username} had already blocked {receiver.username}")

            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': f"You have already blocked {receiver.username}",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }))

    async def handle_chatroom(self, sender_username, receiver_username):
        from .models import Chat, Message
        from auth_app.models import AppUser

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)

        chat_messages = await sync_to_async(Chat().load_history)(sender, receiver)
        await self.send(text_data=json.dumps(chat_messages))

    async def chat_message(self, event):
        from .models import Chat, Message
        from auth_app.models import AppUser

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

    def get_current_timestamp(self):
        current_time = timezone.now()
        local_time = timezone.localtime(current_time)
        return local_time.strftime('%d.%m.%Y %H:%M')
