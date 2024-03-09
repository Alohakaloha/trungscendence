export function init() {
	return new Promise((resolve, reject) => {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = 'game.css'; // replace with your CSS file path
		document.getElementsByTagName('head')[0].appendChild(link);
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