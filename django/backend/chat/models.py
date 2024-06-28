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
                last_5_messages = Message.objects.filter(chat=chat).order_by('-timestamp')[:5]
            return self.serialize_chat(last_5_messages)
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

    def serialize_chat(self, messages):
        chat_data = {
              "messages": [
               {
                    "sender": message.sender.username,  # Adjust as needed
                    "content": message.content,
                     "timestamp": message.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
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
    


# # chat/models.py
# from django.db import models
# from django.contrib.auth import get_user_model


# class ChatMessage(models.Model):
#     user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
#     room_name = models.CharField(max_length=255)
#     message = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.user.username} in {self.room_name} at {self.timestamp}"

# class DirectMessage(models.Model):
#     sender = models.ForeignKey(get_user_model(), related_name='sent_messages', on_delete=models.CASCADE)
#     recipient = models.ForeignKey(get_user_model(), related_name='received_messages', on_delete=models.CASCADE)
#     message = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.sender.username} to {self.recipient.username} at {self.timestamp}"


# add admin model for messages