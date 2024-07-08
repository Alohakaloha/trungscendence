import sys
import json
from django.utils import timezone
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

DEFAULT_ROOM_NAME = 'chatting'
user_channel_mapping = {}

def logprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = DEFAULT_ROOM_NAME
        self.room_group_name = f'chat_{self.room_name}'
        self.username = self.scope['user'].username

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
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

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        user_channel_mapping.pop(self.username, None)

    async def receive(self, text_data):
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
            elif action_type == 'unblock':
                await self.unblock_user(chat_json)
            elif action_type == 'chatroom':
                await self.handle_chatroom(sender_username, receiver_username)
            else:
                logprint(f"Unknown action type received: {action_type}")

        except (KeyError, json.JSONDecodeError) as e:
            logprint(f"Invalid JSON: {text_data}, Error: {e}")
        except Exception as e:
            logprint(f"An error occurred: {e}")

    async def handle_message(self, sender_username, receiver_username, message_content):
        if receiver_username == 'global':
            await self.broadcast_message(message_content, sender_username)
        else:
            await self.send_private_message(sender_username, receiver_username, message_content)

    async def broadcast_message(self, message_content, sender_username):
        blocked_users = await self.get_blocked_users(sender_username)
        
        for username, channel in user_channel_mapping.items():
            if username not in blocked_users:
                await self.channel_layer.send(
                    channel,
                    {
                        'type': 'chat_message',
                        'message': message_content,
                        'sender': sender_username,
                        'timestamp': self.get_current_timestamp(),
                        'direct_message': False,
                    }
                )

    async def send_private_message(self, sender_username, receiver_username, message_content):
        from .models import Chat, Message, Block
        from auth_app.models import AppUser

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)
        blocked = await sync_to_async(Block.objects.filter(blocker=receiver, blocked=sender).exists)()

        if blocked:
            logprint(f"Message from {sender.username} to {receiver.username} is blocked and will not be delivered.")
            sender_channel = user_channel_mapping.get(sender.username)
            if sender_channel:
                await self.channel_layer.send(sender_channel, {
                    'type': 'chat_message',
                    'message': f"You have been blocked by {receiver_username} and your message was not delivered.",
                    'sender': 'system',
                    'timestamp': self.get_current_timestamp(),
                })
            return

        receiver_channel = user_channel_mapping.get(receiver_username)
        if receiver_channel:
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
            sender_channel = user_channel_mapping.get(sender.username)
            if sender_channel:
                await self.channel_layer.send(sender_channel, {
                    'type': 'chat_message',
                    'message': f"{receiver_username} is not connected",
                    'sender': 'system',
                    'timestamp': self.get_current_timestamp(),
                })

    async def block_user(self, chat_json):
        from auth_app.models import AppUser
        from .models import Block

        sender_username = chat_json.get('sender')
        receiver_username = chat_json.get('receiver')

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)

        block_exists = await sync_to_async(Block.objects.filter(blocker=sender, blocked=receiver).exists)()
        if not block_exists:
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

    async def unblock_user(self, chat_json):
        from .models import Block
        from auth_app.models import AppUser

        sender_username = chat_json.get('sender')
        receiver_username = chat_json.get('receiver')

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)

        block_exists = await sync_to_async(Block.objects.filter(blocker=sender, blocked=receiver).exists)()
        if block_exists:
            block = await sync_to_async(Block.objects.get)(blocker=sender, blocked=receiver)
            await sync_to_async(block.delete)()
            logprint(f"{sender.username} has unblocked {receiver.username}")

            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': f"You have unblocked {receiver.username}",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }))
        else:
            logprint(f"{sender.username} has not blocked {receiver.username}")

            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': f"{receiver_username} was not blocked",
                'sender': 'system',
                'timestamp': self.get_current_timestamp(),
            }))

    async def handle_chatroom(self, sender_username, receiver_username):
        from .models import Chat
        from auth_app.models import AppUser

        sender = await sync_to_async(AppUser.objects.get)(username=sender_username)
        receiver = await sync_to_async(AppUser.objects.get)(username=receiver_username)

        chat_messages = await sync_to_async(Chat().load_history)(sender, receiver)
        await self.send(text_data=json.dumps(chat_messages))

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

    def get_current_timestamp(self):
        current_time = timezone.now()
        local_time = timezone.localtime(current_time)
        return local_time.strftime('%d.%m.%Y %H:%M')

    @sync_to_async
    def get_blocked_users(self, username):
        from .models import Block
        from auth_app.models import AppUser

        user = AppUser.objects.get(username=username)
        blocked_users = Block.objects.filter(blocked=user).values_list('blocker__username', flat=True)
        return set(blocked_users)
