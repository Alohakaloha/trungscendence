export function getCookie(name){
	let cookieValue = null;
	if (document.cookie && document.cookie !== ''){
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++){
			const cookie = cookies[i].trim();
			if (cookie.substring(0, name.length + 1) === (name + '=')){
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

export function validateEmail(email) {
	const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
	const maxLength = 25;
	const minLength = 3;

	return email.length >= minLength && email.length <= maxLength && emailRegex.test(email);
}

export function validatePassword(password){
	let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,?<>"';:-_=+\|/`~])(?=.*\d).{8,}$/;
	return regex.test(password);
}

export function validateUsername(username) {
	return /^[a-zA-Z0-9]+$/.test(username) && username.length >= 3 && username.length <= 25;
}

export function validateInput() {
	
}
