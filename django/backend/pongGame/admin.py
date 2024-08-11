from django.contrib import admin
from .models import Game, Tournaments, RemoteMatch, LocalMatch

# Register your models here.
admin.site.register(Game)
admin.site.register(Tournaments)
admin.site.register(RemoteMatch)
admin.site.register(LocalMatch)