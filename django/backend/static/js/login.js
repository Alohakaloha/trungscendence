import { getCookie, validateEmail, validateUsername } from "./utils.js";

console.log("login.js loaded");

let loginBtn;


 function loginBtnClickHandler(event){
	console.log("login button clicked");
	event.preventDefault();
	let email = document.getElementById("email").value;
	let password = document.getElementById("password").value;
	login(email, password);
};

export function init() {
	return new Promise((resolve, reject) => {
		loginBtn = document.getElementById('loginBtn');
		if (loginBtn) {
			console.log("login button found");
			loginBtn.addEventListener('click', (event) => loginBtnClickHandler(event));
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the login button is not found
			console.log("login button not found");
			reject(new Error("Login button not found"));
		}
	});
}

export function unload() {
	return new Promise((resolve, reject) => {
		loginBtn = document.getElementById('loginBtn');
		if (loginBtn) {
			loginBtn.removeEventListener('click', loginBtnClickHandler);
			console.log("login button unloaded");
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the login button is not found
			reject(new Error("Login button not found"));
		}
		loginBtn = null;
	});
}

async function login(email, password){
	let errormsg = document.getElementById("errorMsg");

	if (email == ""){
		errormsg.textContent = 'Email is required.';
		return;
	}

	if(!validateEmail(email)){
		errormsg.textContent = 'Invalid email.';
		return;
	}

	if(password == ""){
		errormsg.textContent = 'Password is required.';
		return;
	}

	let data = {
		"email": email,
		"password": password
	}
	try{
		const loginResponse = await fetch('/login_view', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify(data)
		});

		const loginData = await loginResponse.json();

		if (loginData.status === 'success'){
			try{
				changeURL('/profile', 'Profile page', {Profile: true});
			} catch (profileError){
				console.error("Error loading profile", profileError);
			}
		} else {
			errormsg.textContent = 'Invalid email or password.';
		}
	} catch (error){
		console.error("Error during login.", error);
	}
}

function changeURL(path, title, stateObject) {
	currentJS();
	history.pushState(stateObject, title, path);
	handleRouting();
}