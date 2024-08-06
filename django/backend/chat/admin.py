# admin.py

from django.contrib import admin
from .models import Chat, Message, Block

class ChatAdmin(admin.ModelAdmin):
    list_display = ('participant1', 'participant2')
    search_fields = ('participant1__username', 'participant2__username')

class MessageAdmin(admin.ModelAdmin):
    list_display = ('chat', 'sender', 'content', 'timestamp')
    search_fields = ('sender__username', 'content')
    list_filter = ('timestamp',)

class BlockAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked')
    search_fields = ('blocker__username', 'blocked__username')
    list_filter = ('blocker', 'blocked')

# Register the Chat and Message models with their respective admin classes
admin.site.register(Chat, ChatAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(Block, BlockAdmin)
