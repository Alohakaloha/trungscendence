import { getCookie, validateEmail, validatePassword } from "./utils.js";

let submitButton;

function submitButtonHandler(event){
	event.preventDefault();
	let email = document.getElementById("email").value;
	let username = document.getElementById("username").value;
	
	let profile_picture_input = document.getElementById("selected_picture");
	let profile_picture = profile_picture_input && profile_picture_input.files && profile_picture_input.files[0];

	let password = document.getElementById("password").value;
	let confirm_password = document.getElementById("confirm_password").value;

	settings(email, username, profile_picture, password, confirm_password);
}

export function init() {
	return new Promise((resolve, reject) => {
		submitButton = document.getElementById('submitButton');
		if (submitButton){
			submitButton.addEventListener('click', (event) => submitButtonHandler(event));
			resolve();
		}else{
			reject(new Error("Submit button not found"));
		}
	});
};

export function unload(){
	return new Promise((resolve, reject) => {

		successMsg = null;
		successSentMsg = null;
		alreadySentMsg = null;
		declineMsg = null;

		if (acceptButtons) {
			acceptButtons.forEach(function(button){
				button.removeEventListener('click', handleSubmit);
			})};
		if (declineButtons){
			declineButtons.forEach(function(button){
				button.removeEventListener('click', handleSubmit);
			})};
		if (addFriendButtons){
			addFriendButtons.forEach(function(button){
				button.removeEventListener('click', handleSubmit);
			});
		
		} else {
			resolve();
			// Reject the promise if the login button is not found
			reject(new Error("accept button not found"));
		}
		acceptButtons = null;
		declineButtons = null;
		addFriendButtons = null;
		console.log("settings unload");
	})};

async function settings(email, username, profile_picture, password, confirm_password) {
	let csrf_token = getCookie("csrftoken");
	let successMsg = document.getElementById("successMsg");
	let errorMsg = document.getElementById("errorMsg");
	let data = {};

	if (email !== "") {
	  if (!validateEmail(email)) {
		errorMsg.textContent = 'Invalid email.';
		return;
	  }
	  data.email = email;
	}
	
	if (username !== "") {
	  if (username.length < 5) {
		errorMsg.textContent = '';
		errorMsg.textContent = 'Username must be at least 5 characters long.';
		return;
	  } else {
		data.username = username;
	  }
	}

	if (password !== "") {
		if (!validatePassword(password)) {
			errorMsg.textContent = 'Password must be 8 characters long and have at least 1 capital letter and 1 special character.';
			return;
		}
		if (password !== confirm_password) {
			errorMsg.textContent = 'Passwords do not match.';
			return;
		}
		data.password = password;
	}
	
	if (profile_picture) {
		const validImageExtensions = ['jpg', 'jpeg', 'png', 'bmp'];
		const extension = profile_picture.name.split('.').pop().toLowerCase();
		if (!validImageExtensions.includes(extension)) {
			errorMsg.textContent = 'Invalid profile picture format. Allowed formats are jpg, jpeg, png, gif, bmp.';
			return;
		}
		try{
			const base64 = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = function(e) {
					resolve(e.target.result.split(',')[1]);
				};
				reader.onerror = reject;
				reader.readAsDataURL(profile_picture);
				});
			data.profile_picture = base64;
		}catch (error){
			errorMsg.textContent = 'Error reading file: ' + error;
			return;
		}
	};
	try {
		const response = await fetch('/settings/settings.html', {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrf_token
		  },
		  body: JSON.stringify(data)
		});
		const responseData = await response.json();
		if (responseData.status === "success") {
			errorMsg.textContent = '';
			successMsg.textContent = responseData.message;
		} else {
			errorMsg.textContent = responseData.message;
		}
	} catch (error) {
		errorMsg.textContent = 'Error updating settings: ' + error;
	}

}