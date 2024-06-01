from django.db import models
from django.db.models import Q
from django.utils import timezone
from auth_app.models import AppUser
from .consumers import logprint
User = AppUser

# Create your models here.
class Chat(models.Model):
    participant1 = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, null = True, blank=True, related_name='participant1')
    participant2 = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, null = True, blank=True, related_name='participant2')

    def get_user_mail(username):
        try:
            user = User.objects.get(username=username)
            return user.email
        except:
            return "User not found"
        
    def getChat(mail1, mail2):
        logprint(mail1)
        logprint(mail2)
        try:
            participant1 = User.objects.get(email=mail1)
            participant2 = User.objects.get(email=mail2)
        except:
            logprint("User not found")
            return None
        chat =Chat.objects.filter(Q(participant1=participant1, participant2=participant2) | Q(participant1=participant2, participant2=participant1)).first()
        if chat is None:
            chat = Chat.objects.create(participant1=participant1, participant2=participant2)
            logprint("Chat created")
        return chat


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE , related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='send_messages')
    content = models.TextField(max_length=255)
    timestamp= models.DateTimeField(auto_now_add=True)

    def save_message(self, chat, sender, content):
        self.chat=chat
        self.sender=sender
        self.content = content
        self.save()


    def last_10_messages(self):
        return Message.objects.order_by('-timestamp').all()[:10]
