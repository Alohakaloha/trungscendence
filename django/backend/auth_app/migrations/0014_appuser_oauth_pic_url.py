# Generated by Django 4.2.7 on 2024-04-07 11:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0013_appuser_oauth_created'),
    ]

    operations = [
        migrations.AddField(
            model_name='appuser',
            name='oauth_pic_url',
            field=models.URLField(blank=True, null=True),
        ),
    ]
