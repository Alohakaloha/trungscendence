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


    def last_5_messages(self):
        return Message.objects.order_by('-timestamp').all()[:5]