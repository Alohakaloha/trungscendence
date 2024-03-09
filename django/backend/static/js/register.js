import { validateEmail, validatePassword, getCookie, validateUsername } from "./utils.js";

console.log("register.js loaded");

let registerBtn;

let registerBtnClickHandler = function(e) {
	console.log("register button clicked");
	let email = document.getElementById("email").value;
	let username = document.getElementById("username").value;
	let password = document.getElementById("password").value;
	register(email, username, password);
};
export function init() {
	return new Promise((resolve, reject) => {
		registerBtn = document.getElementById('registerBtn');
		if (registerBtn) {
			console.log("login button found");
			registerBtn.addEventListener('click', registerBtnClickHandler);
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the login button is not found
			console.log("login button not found");
		}
	});
}

export function unload(){
	return new Promise((resolve, reject) => {
		registerBtn = document.getElementById('registerBtn');
		if (registerBtn) {
			registerBtn.removeEventListener('click', registerBtnClickHandler);
			console.log("login button unloaded");
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the login button is not found
			reject(new Error("Register button not found"));
		}
		registerBtn = null;
	});
}

function register(email, username, password){
	let errormsg = document.getElementById("errorMsg");
	let successmsg = document.getElementById("successMsg");
	
		if (!validateEmail(email)){
			errormsg.textContent = 'Invalid email.';
			return;
		}

		if(!validateUsername(username)){
			errormsg.textContent = 'Invalid username.';
			return;
		}

		if (!validatePassword(password)){
			errormsg.textContent = 'Password must contain\n8 characters, 1 capital letter, 1 lowercase and 1 special character.';
			return;
		}
		let data = {
			"email": email,
			"username" : username,
			"password": password
		}
		fetch('/register/form', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify(data)
		})
		.then(response => response.json())
		.then(data => {
			if (data.status == "success"){
				errormsg.textContent = '';
				errormsg.textContent = '';
				successmsg.textContent = data.message;
			} else {
				successmsg.textContent = '';
				errormsg.textContent = 'Email or username already exists.';
			}
		})
}
