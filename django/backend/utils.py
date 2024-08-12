import re

def validateEmail(email):

	email_regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
	max_length = 49

	if len(email) > 0 and len(email) <= max_length and not ' ' in email:
		return bool(re.fullmatch(email_regex, email))
	return False

def validatePassword(password):
	regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_=+:;"\'<>?,./`~]).{8,}$'
	if re.fullmatch(regex, password):
		return True
	return False

def validateUsername(username):
	return len(username) >= 3 and len(username) <= 25 and ' ' not in username

