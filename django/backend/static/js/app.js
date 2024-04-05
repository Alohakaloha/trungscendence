// on refresh handle the routing
const content = document.getElementById('content');
let jsFile;


// let welcome = document.createElement('script');
// welcome.src = '% static js/settings.js %';
// document.body.appendChild(welcome);

// const routes = {
// 	'profile': () => {
// 		showPage("main/profile.html");
// 	},
// 	'/': () =>{
// 		jsFile = './welcome.js';
// 		showPage("main/welcome.html");
// 	},
// 	'games': () => {
// 		showPage("game/game.html");
// 	},
// 	'friends': () => {
// 		if (user.authenticated){
// 			showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 		}
// 		else{
// 			changeURL('/login', 'Login Page', {main : true});
// 		}
// 	},
// 	'chat': () => {
// 		jsFile = './chat.js';
// 		showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 	},
// 	'history': () => {
// 		showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 	},

// 	'about': () => {
// 		showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 	},
// 	'settings': () => {
// 		if (user.authenticated){
// 			jsFile='./settings.js';
// 			showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 		} 
// 		else{
// 			changeURL('/login', 'Login Page', {main : true});
// 		}
// 	},
// 	'register': () => {
// 		if (user.authenticated){
// 			changeURL('/', 'Main Page', {main : true});
// 		}
// 		jsFile = './register.js';
// 		showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 	},
// 	'login': () => {
// 		if (user.authenticated){
// 			changeURL('/', 'Main Page', {main : true});
// 		}
// 		jsFile = './login.js';
// 		showPage(`${page.slice(1)}/${page.slice(1)}.html`);
// 	}

// };


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
				// jsFile = './game/tmpGame.js';
				showPage(`game/gameSetup.html`);
				break;

			case '/pong':
				// jsFile = './game/pong.js';
				showPage(`game/pong.html`);

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
			if (gameSocket)
				gameSocket.close();
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


async function callSettings(path) {
	return await fetch("game/"+path+".html")
		.then(response => response.text())
		.then(data => {
			let contentElement = document.getElementById('game-options');
			if (contentElement)
				contentElement.innerHTML = data;
		})
		.catch(error => console.log(error));
}

async function startLocal() {
	return await fetch("localmatch")
		.then(response => response.text())
		.then(data => {
			let localSettings = {
				"settings": "change",
				"player1": document.getElementById('player1Name').value,
				"player2": document.getElementById('player2Name').value,
				"rounds": document.querySelector('input[name="roundsToWin"]:checked').value,
				"score": document.querySelector('input[name="score"]:checked').value,
				"mirror": document.getElementById('mirror').checked,
			};
			console.log(localSettings);
			initializeGame(localSettings);
		})
		.catch(error => console.log(error));
}


observer.observe(content, {childList: true});


// G A M I N G   S E C T I O N

let gameSocket;
let keysPressed = {};

function initializeGame(settings) {
		connectGame(settings);

}


function connectGame(settings){
	fetch('/game/pong.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('content').innerHTML = data;
		})
		.catch(error => console.log(error));
	gameSocket = new WebSocket('wss://' + window.location.host + '/ws/local/'); //wss only
	gameSocket.onopen = function(e){
		gameSocket.send(JSON.stringify(settings));
	}

	let checkInput = setInterval(() => {
		if (keysPressed['w']) {
			player1up();
		}
		if (keysPressed['s']) {
			player1down();
		}
		if (keysPressed['ArrowUp']) {
			player2up();
		}
		if (keysPressed['ArrowDown']) {
			player2down();
		}
	}, 20);

	document.addEventListener("keydown", e => {
		keysPressed[e.key] = true;
	});


	document.addEventListener("keyup", e => {
		keysPressed[e.key] = false;
	});


	gameSocket.onmessage = function(event){
		if (event.data === 'gameover'){
			gameSocket.close();
		}
		displayPong(event);
	}

	gameSocket.onclose = function(event){
		clearInterval(checkInput);
		if (event.code === 1000) {
			console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			console.log('Connection died');
		}
	}

	gameSocket.onerror = function(error) {
		console.log(`Error: ${error.message}`);
	};
}


function player1up() {
	gameSocket.send(JSON.stringify({ "movement": "up", "player": "player1" }));
}

function player1down() {
	gameSocket.send(JSON.stringify({ "movement": "down", "player": "player1" }));
}

function player2up() {
	gameSocket.send(JSON.stringify({ "movement": "up", "player": "player2" }));
}

function player2down() {
	gameSocket.send(JSON.stringify({ "movement": "down", "player": "player2" }));
}

// function playerMove1() {
// 	const players = [
// 		{ "movement": "", "player": "player1", "keys": { 'ArrowUp': 'up', 'ArrowDown': 'down' } },
// 		{ "movement": "", "player": "player2", "keys": { 'w': 'up', 's': 'down' } }
// 	];

// 	players.forEach(player => {
// 		Object.keys(player.keys).some(key => {
// 			if (keysPressed[key]) {
// 				player.movement = player.keys[key];
// 				return true;
// 			}
// 		});
// 	});

// 	// filter out player who have no movement
// 	const actions = players.filter(player => player.movement !== "");

// 	if (actions.length > 0) {
// 		console.log(actions);
// 		gameSocket.send(JSON.stringify(actions));
// 	}
// }


function displayPong(event)
{
	let data = JSON.parse(event.data);

	let player1x = data.x1;
	let player1y = data.y1;

	let player2x = data.x2;
	let player2y = data.y2;

	let ball = document.getElementById('ball');
	let game = document.getElementById('pongGame');
	let headerbar = document.getElementById('header-bar');
	if('player_1_name' in data){
		let name1 = document.getElementById('player1-name');
		let name2 = document.getElementById('player2-name');
		name1.innerHTML = data.player_1_name;
		name2.innerHTML = data.player_2_name;
	}
	if ('score1' in data){
		let p1score = document.getElementById('player1-score');
		let p2score = document.getElementById('player2-score');
		p1score.innerHTML = data.score1;
		p2score.innerHTML = data.score2;
		let matchRounds = document.getElementById('match-round');
		matchRounds.innerHTML = data.current_rounds;
	}
	game.style.height = (window.innerHeight - headerbar.clientHeight) + 'px';

	ball.style.position = 'absolute';
	ball.style.left = data.ballx + '%';
	ball.style.top = data.bally + '%';

	let player1 = document.getElementById('player1');
	let player2 = document.getElementById('player2');

	player1.style.position = 'absolute';
	player1.style.left = player1x - 1 +'%';
	player1.style.top = player1y + '%';

	player2.style.position = 'absolute';
	player2.style.left = player2x + '%';
	player2.style.top = player2y + '%';
}