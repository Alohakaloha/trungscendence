# Generated by Django 4.2.7 on 2023-12-21 14:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0004_appuser_is_active'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appuser',
            name='profile_picture',
            field=models.ImageField(blank=True, null=True, upload_to=''),
        ),
    ]
