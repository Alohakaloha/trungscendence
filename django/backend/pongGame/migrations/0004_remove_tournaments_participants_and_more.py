# Generated by Django 4.2.7 on 2024-06-03 09:27

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pongGame', '0003_tournaments_date'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tournaments',
            name='participants',
        ),
        migrations.RemoveField(
            model_name='tournaments',
            name='tournament_winner',
        ),
        migrations.DeleteModel(
            name='RemoteMatch',
        ),
        migrations.DeleteModel(
            name='Tournaments',
        ),
    ]
