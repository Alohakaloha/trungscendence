import re

def validateEmail(email):
	regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}$'
	if re.fullmatch(regex, email):
		return True
	return False

def validatePassword(password):
	regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_=+:;"\'<>?,./`~]).{8,}$'
	if re.fullmatch(regex, password):
		return True
	return False

def validateUsername(username):
	if len(username) < 3 or ' ' in username:
		return False
	return True

