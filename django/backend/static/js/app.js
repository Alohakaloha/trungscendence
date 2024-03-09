// on refresh handle the routing
const content = document.getElementById('content');
let jsFile;
let welcome = document.createElement('script');
welcome.src = '% static js/settings.js %';
document.body.appendChild(welcome);


window.onpopstate = function(event) {
	handleRouting();
};

window.onload = function() {
	handleRouting();
};

async function fetchUserData(){
	try {
		const response = await fetch('/getUserData');
		const data = await response.json();
		return data.user;
	} catch (error){
		console.error('Error fetching user data', error);
		return null;
	}
}

function changeURL(path, title, stateObject) {
	currentJS();
	history.pushState(stateObject, title, path);
	handleRouting();
}

function unloadEvents(str) {
	import(str)
		.then((module) => {
			if (module.unload){
				module.unload().then(() => {
					console.log("All good");
				}).catch((error) => {
					console.error("Unloading failed:", error);
				});
			}
		})
		.catch((err) => {
			// Handle the error
			console.log(str);
			console.error('=Failed to unload module', err);
		});
}


function loadModule(str) {
	import(str)
	.then((module) => {
		if (module.init){
			module.init();
			console.log("Initialization successful");
		}
	})
	.catch((err) => {
		// Handle the error
		console.error('Failed to load module', err);
	});
}
// changing the path and content
async function handleRouting() {
	let page = window.location.pathname;
	try{
		const user = await fetchUserData();
		
		if (user.authenticated){
			document.getElementById('profile_picture').src = user.profile_picture;
		}

		switch (page) {
			case '/':
				jsFile = './welcome.js';
				showPage("main/welcome.html");
				break;
			case '/chat':
				jsFile = './chat.js';
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			case '/game':
				jsFile = './game/tmpGame.js';
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			case '/profile':
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			case '/history':
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			case '/about':
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			case '/settings':
				if (user.authenticated){
					jsFile='./settings.js';
					showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				} 
				else{
					changeURL('/login', 'Login Page', {main : true});
					break;
				}
				break;
			case '/friends':
				if (user.authenticated){
					jsFile='./friend_request.js';
					showPage(`${page.slice(1)}/${page.slice(1)}.html`);
					break;
				}
				else{
					changeURL('/login', 'Login Page', {main : true});
					break;
				}
			case '/register':
				jsFile = './register.js';
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			case '/login':
				if (user.authenticated){
					changeURL('/', 'Main Page', {main : true});
					break;
				}
				jsFile = './login.js';
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;
			default:
				console.log('Page not found');
				console.log(window.location.pathname);
				break;
			}
	} catch (error) {
		console.error('Error handling routing: ', error);
	}
}

async function currentJS() {
	let page = window.location.pathname;
	const user = await fetchUserData();
	switch (page) {
		case '/':
			unloadEvents('./welcome.js');
			break;
		case '/game':
			break;
		case '/profile':
			break;
		case '/chat':
			unloadEvents('./chat.js');
			break;
		case '/history':
			break;
		case '/about':
			break;
		case '/settings':
			break;
		case '/friends':
			if (user.authenticated)
			unloadEvents('./friend_request.js');
			break;
		case '/register':
			unloadEvents('./register.js');
			break;
		case '/login':
			if (!user.authenticated)
			unloadEvents('./login.js');
			break;
		default:
			break;
	}
}


async function showPage(path) {
	return await fetch(path)
		.then(response => response.text())
		.then(data => {
			document.getElementById('content').innerHTML = data;
		})
		.catch(error => console.log(error));
}

// part for background change in settings
let background = ["none", "/staticstuff/images/background.jpg", "/staticstuff/images/black.jpg" ];
let i = 0;

function changeBg() {
	i = (i + 1) % background.length; 
	if (background[i] === "none") {
	document.body.style.backgroundImage = background[i];
	} else {
	document.body.style.backgroundImage = `url(${background[i]})`;
	}
	console.log(document.body.style.backgroundImage);
}


const observer = new MutationObserver(() => {
	if (jsFile) {
		loadModule(jsFile);
		jsFile = null;
	}
});


observer.observe(content, {childList: true});
