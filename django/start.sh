#!/bin/sh

python3 manage.py migrate
# runstatic files
python3 manage.py collectstatic --noinput

python3 create_superuser.py
# -u is for debug mode
# python3 -u manage.py runserver 0.0.0.0:7000
daphne -b 0.0.0.0 -p 7000 backend.asgi:application