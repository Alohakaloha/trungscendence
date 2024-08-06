import { getCookie, validateEmail } from "./utils.js";

let form;

function submitFormClickHandler(event){
	event.preventDefault();
	let email = document.getElementById("email").value;
	forgotPassword(event, email);
}

export function init() {
	return new Promise((resolve, reject) => {
		form = document.getElementById('forgotPasswordForm');
		if (form) {
			form.addEventListener('submit', (event) => submitFormClickHandler(event));
			// Resolve the promise if everything is successful
			resolve();
		} else {;
			// Reject the promise if the submit button is not found
			reject(new Error("submit button not found"))
		}
	});
}

export function unload() {
	return new Promise((resolve, reject) => {
		if (form) {
			form.removeEventListener('submit', submitFormClickHandler);
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the submit button is not found
			reject(new Error("form not found"));
		}
		form = null;
	});
}

async function forgotPassword(event, email){
	// let errorMsg = document.getElementById('errorMsg');
	// let successMsg = document.getElementById('successMsg');

	// if (email == ""){
	// 	errorMsg.textContent = 'Email is required.';
	// 	return;
	// }

	// if (!validateEmail(email)){
	// 	errorMsg.textContent = 'Invalid email.';
	// }

	// let data = {
	// 	"email": email
	// }
	// try
	let formData = new FormData(event.target);
	try {
		const response = await fetch(event.target.action, {
			method: 'POST',
			body: formData,
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			}
		});
		if (response.ok) {
			changeURL('/password_reset_done', 'Password Reset Done');
		} else {
			console.error('Failed to send password reset email');
		}
	} catch (error) {
		console.error('Error submitting form: ', error);
	}
}