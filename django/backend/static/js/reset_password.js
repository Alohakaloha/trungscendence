import { getCookie, validatePassword } from "./utils.js";

let form;
let uidb64;
let token;

function submitFormHandler(event){
	event.preventDefault();
	let new_password1 = document.getElementById('new_password1').value;
	let new_password2 = document.getElementById('new_password2').value;
	resetPassword(event, new_password1, new_password2);
}

export function init(){
	return new Promise((resolve, reject) => {
		form = document.getElementById('passwordForm');
		if (form) {
			form.addEventListener('submit', (event) => submitFormHandler(event));
			resolve();
		} else {
			reject(new Error("submit button not found"))
		}
	});
}

export function unload() {
	return new Promise((resolve, reject) => {
		if (form) {
			form.removeEventListener('submit', submitFormHandler);
			resolve();
		} else {
			reject(new Error("form not found"));
		}
		form = null;
	});
}

async function resetPassword(event, new_password1, new_password2){
	if (!validatePassword(new_password1) || !validatePassword(new_password2)) {
		document.getElementById('errorMsg').innerHTML = "Passwords must be at least 8 characters long, <br>contain at least one uppercase letter, <br>one lowercase letter, one number, <br>and one special character";
		return;
	}
	if (new_password1 !== new_password2) {
		document.getElementById('errorMsg').innerHTML = "Passwords do not match";
		return;
	}

	let resetData = await getUidb_token();
	uidb64 = resetData['uidb64'];
	token = resetData['token'];
	
	let data = {
		"new_password": new_password1,
		"uidb64": uidb64,
		"token" : token
	};
	try{
		const response = await fetch(`/password_reset_confirm/password_reset_confirm.html/${uidb64}/${token}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify(data),
		});
		const responseData = await response.json();
		if (responseData.status == 'success') {
			changeURL ('/password_reset_complete', 'Password Reset', {main:true});
		} else {
			alert(responseData.error);
		}
	} catch (error){
		console.error('Error setting the new password: ', error);
	}
}

async function getUidb_token(){
	try{
		let response = await fetch('/get_reset_data')
		data = await response.json();
			if (data.hasOwnProperty('uidb64') && data.hasOwnProperty('token')){
				return data;
			}
			else
				return null;
		} catch(error){
		console.error("Error with the authentication token: ", error);
		return null
	}
}