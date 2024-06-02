import { getCookie, validatePassword } from "./utils.js";

let form;
let uidb64;
let token;



export function init(){
	return new Promise((resolve, reject) => {
		form = document.getElementById('passwordForm');
		if (form) {
			console.log("password form loaded");
			form.addEventListener('submit', (event) => submitFormHandler(event));
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the submit button is not found
			reject(new Error("submit button not found"))
		}
	});
}

export function unload() {
	return new Promise((resolve, reject) => {
		if (form) {
			form.removeEventListener('submit', submitFormHandler);
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the submit button is not found
			reject(new Error("form not found"));
		}
		form = null;
	});
}

async function resetPassword(event, new_password1, new_password2){
	// let errorMsg = document.getElementById('errorMsg');
	// let successMsg = document.getElementById('successMsg');
	let resetData = document.getElementById('reset-data');
	let uidb64 = resetData.getAttribute('data-uidb64').value;
	let token = resetData.getAttribute('data-token').value;
	
	let data = {
		"new_password1": new_password1,
		"new_password2": new_password2,
		"uidb64": uidb64,
		"token" : token
	};
	// formData.append('new_password1', new_password1);
	// formData.append('new_password2', new_password2);
	console.log(data);
	try{
		const response = await fetch(`/password_reset_confirm/password_reset_confirm.html/${uidb64}/${token}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify(data),
		});
		const responseData = await response.json();
		if (responseData.success){
			changeURL ('/login', 'Login', {main:true});
		} else {
			alert(responseData.error);
		}
	} catch (error){
		console.error('Error setting the new password: ', error);
	}
}