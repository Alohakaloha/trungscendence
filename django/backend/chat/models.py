from django.db import models
from django.utils import timezone

# Create your models here.
class Chat(models.Model):
    participant1 = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, null = True, blank=True, related_name='participant1')
    participant2 = models.ForeignKey('auth_app.AppUser', on_delete=models.CASCADE, null = True, blank=True, related_name='participant2')

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


