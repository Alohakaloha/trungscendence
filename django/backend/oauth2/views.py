from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import authenticate, login as auth_login, views as auth_views
import requests
import urllib.parse, os
from auth_app.views import register_view
import logging
import http.client as http_client
from auth_app.models import AppUser
import secrets

http_client.HTTPConnection.debuglevel = 1

logger = logging.getLogger('mylogger')

logger.setLevel(logging.DEBUG)
logger.propagate = True

logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True

CLIENT_ID = os.getenv("OAUTH_CLIENT_ID")
CLIENT_SECRET =os.getenv("OAUTH_CLIENT_SECRET")
REDIRECT_URI="https://localhost/oauth2/redirect/"
BASE_URL = "https://api.intra.42.fr/oauth/authorize"
USERDATA_ENDPOINT = "https://api.intra.42.fr/v2/me"
OAUTH_PASSWORD_LENGTH=16

redirect_url = f"{BASE_URL}?client_id={CLIENT_ID}&redirect_uri={urllib.parse.quote_plus(REDIRECT_URI)}&response_type=code"
# Create your views here.
def oauth_login(request):
    return redirect(redirect_url)

def oauth_redirect(request):
    code = request.GET.get("code")
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret" : CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": code
    }
    try:
        r = requests.post("https://api.intra.42.fr/oauth/token", data=data)
        access_token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        if r.status_code == 200:
            user_data_res = requests.get(USERDATA_ENDPOINT, headers=headers)
            user_data = user_data_res.json()
            # result = "<br>"
            # result += str(user_data["login"]) + "<br>"
            # result += str(user_data["email"]) + "<br>"
            # for k in user_data.keys():
            #     result += f"<b>{k}</b>: " + str(user_data[k])  + "<hr>"

            user = authenticate(request, email=user_data["email"])
            if user is not None:
                auth_login(request, user, backend='oauth2.auth_backend.PasswordlessAuthBackend')
                return redirect("/profile")
            else:
                user = AppUser.objects.create_user(
                    email=user_data["email"],
                    username = user_data["login"],
                    password=secrets.token_urlsafe(OAUTH_PASSWORD_LENGTH),
                    oauth=True,
                    pic_url=user_data['image']['versions']['small']
                )
                auth_login(request, user, backend='oauth2.auth_backend.PasswordlessAuthBackend')
                # return JsonResponse({'status':'success: reg, login'})
                return redirect("/profile")
        else:
            return HttpResponse({'status':'success', 'message':'Redirected. failed to get user data'})
    except Exception as e:
        return HttpResponse(f"Redirected. Execption: {e}")
