from django.db import models
from django.utils import timezone
from django.db.models import Q
from auth_app.models import AppUser
import sys

User = AppUser

def logprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

# Create your models here.
class Chat(models.Model):
    participant1 = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, null = True, blank=True, related_name='participant1')
    participant2 = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, null = True, blank=True, related_name='participant2')


    def find_or_create_chat(self, sender, receiver):
        try:
            chat = Chat.objects.filter(
                Q(participant1=sender, participant2=receiver) |
                Q(participant1=receiver, participant2=sender)
            ).first()
            if chat is None:
                logprint("Creating a new chat")
                chat = Chat.objects.create(participant1=sender, participant2=receiver)
            else:
                logprint("Chat found")
                return chat

        except Exception as e:
            logprint(e)
            return None
        # if chat.exists():
        #  logprint("Chat found")
        #  return chat.first()
        # else:
        #     logprint("Creating a new chat")
        #     new_chat = Chat(participant1=participant1, participant2=participant2)
        #     new_chat.save()
        #     return new_chat




    def load_history(self, sender, receiver):
        try:
            chat = Chat.objects.filter(
                Q(participant1=sender, participant2=receiver) |
                Q(participant1=receiver, participant2=sender)
            ).first()
            if chat is None:
                logprint("Creating a new chat")
                chat = Chat.objects.create(participant1=sender, participant2=receiver)
            logprint("Chat found")
            # Fetch the newest 5 messages by ordering them in descending order of timestamp
            newest_messages = Message.objects.filter(chat=chat).order_by('-timestamp')[:5]
            # Reverse the order of messages for correct display
            newest_messages_reversed = reversed(newest_messages)
            return self.serialize_chat(newest_messages_reversed)
        except Exception as e:
            logprint(e)
            return None

    def serialize_chat(self, messages):
        chat_data = {
            "type": "history",
            "conversation": [
                {
                    "sender": message.sender.username,
                    "message": message.content,
                    "timestamp": timezone.localtime(message.timestamp).strftime("%d.%m.%Y %H:%M"),
                }
                for message in messages
            ],
        }
        return chat_data


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE , related_name='messages')
    sender = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, related_name='send_messages')
    content = models.TextField(max_length=255)
    timestamp= models.DateTimeField(default=timezone.now)

    def save_message(self, chat, sender, content):
        self.chat=chat
        self.sender=sender
        self.content = content
        self.save()

    def all_messages(self):
        return Message.objects.order_by('-timestamp').all()