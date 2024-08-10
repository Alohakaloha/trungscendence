from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import authenticate, login as auth_login, views as auth_views
import urllib.parse, json, os
import http.client
from auth_app.views import register_view

import http.client as http_client
from auth_app.models import AppUser
import secrets

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
    headers = {
        'Content-Type': 'application/json'
    }
    try:
		conn = http.client.HTTPSConnection('api.intra.42.fr')
		conn.request('POST', '/oauth/token', data, headers)
		response_raw = conn.getresponse()
		      
        if response_raw.status == 200:
            response = json.loads(response_raw.read().decode('utf-8'))  
            access_token = response.get("access_token")

            token_headers = {"Authorization": f"Bearer {access_token}"}
            user_data_req = urllib.request.Request(USERDATA_ENDPOINT, headers=token_headers)
            with urllib.request.urlopen(user_data_req) as response:
                user_json = response.read()
            user_data = json.loads(user_json)

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
