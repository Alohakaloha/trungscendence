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

export function validateEmail(email){
	let regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}$/;
	return regex.test(email);
}

export function validatePassword(password){
	let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,?<>"';:-_=+\|/`~])(?=.*\d).{8,}$/;
	return regex.test(password);
}

export function validateUsername(username){
	if(username.length < 3 || /\s/.test(username)){
		return false;
	}
	return true
}
