// on refresh handle the routing
const content = document.getElementById('content');
let jsFile;

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
				if (tournamentSocket)
					changeURL('/game/localTournament', 'Tournament Page', {main : true});
				else
					showPage(`game/setupGameMode.html`);
				break;

			case '/game/localTournament':
				if(tournamentSocket){
					showPage(`/game/localTournament.html`);
					break;
				}else{
					changeURL('/game', 'Game Page', {main : true});
					break;
					}
			case '/pong':
				// jsFile = './game/pong.js';
				showPage(`game/pong.html`);
				break;

			case '/profile':
				if(user.authenticated)
					showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				else
					changeURL('/login', 'Login Page', {main : true});
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

// TODO check security concerns
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
		initializeGame(localSettings);
	})
	.catch(error => console.log(error));
}

async function enterLocalTournament(){
	return fetch("game/enterLocalTournament.html")
	.then(response => response.text())
	.then(data => {
		let localSettings = {
			"rounds": document.querySelector('input[name="roundsToWin"]:checked').value,
			"score": document.querySelector('input[name="score"]:checked').value,
		}
		let contentElement = document.getElementById('game-options');
		if (contentElement)
			contentElement.innerHTML = data;
		document.getElementById('lt-score').innerHTML = localSettings.score;
		document.getElementById('lt-rounds').innerHTML = localSettings.rounds;
})
.catch(error => console.log(error));

}

function checkDups(arr){
	return new Set(arr).size !== arr.length;
}

async function startLocalTournament(){
	let players = [];
	for (let i = 1; i <= 6; i++) {
		let player = document.getElementById(`player${i}Name`).value.trim();
		if(player.length > 15){
			document.getElementById('localError').innerHTML =`Player ${i} name is too long!`;
			return;
		}
		if (player !== '' && player.length <= 14) {
			players.push(player);
		}
	}
	if(players.length < 2){
		document.getElementById('localError').innerHTML =`Not enough players!`;
		return;
	}

	if(checkDups(players) === true){
		document.getElementById('localError').innerHTML =`No duplicate player names allowed!`;
		return;
	}
	
	let localSettings = {
		"type": "settings",
		"rounds": parseInt(document.getElementById('lt-rounds').innerHTML),
		"score": parseInt(document.getElementById('lt-score').innerHTML),
		"players": players,
	}
	bind_local_Tournament(localSettings);
	changeURL('/game/localTournament', 'Tournament Page', {main : true});
}


function cancelTH(){
	if(tournamentSocket)
		tournamentSocket.close();
	changeURL('/game', 'Game Page', {main : true});
}

function removeOptions(){
	let contentElement = document.getElementById('game-options');
	if (contentElement)
	contentElement.innerHTML = '';
}

observer.observe(content, {childList: true});

//  '██████'''█████''███''''███'██'███''''█'█'██████'''''█████████'█████'███████'████████'██''██████'███''''██'
//  ██'''''''██'''██'████''████'██'████'''█'█'██''''''''''██'''''''█'''''██'''''''''██''''██'██''''██████'''██'
//  ██'''███'███████'██'████'██'██'██'██''█'█'██'''███''''████████'████''██'''''''''██''''██'██''''████'██''██'
//  ██''''██'██'''██'██''██''██'██'██''██'█'█'██''''██'''''''''███'█'''''██'''''''''██''''██'██''''████''██'██'
//  '██████''██'''██'██''''''██'██'██'''███'█''██████'''''████████'█████'███████''''██''''██''██████'██'''████'
//  ''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

let gameSocket;
let requestUpdate;
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
		requestUpdate = setInterval(() => {
			gameSocket.send(JSON.stringify({ "update": "update"}))	}, 10);
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
		if(keysPressed['p']){
			gameSocket.send(JSON.stringify({"pause": true}));
			let pause = document.getElementById('pause-screen');
			pause.innerHTML = 'Game Paused';
			pause.style.display = 'block';
			
		}
		if(keysPressed['k']){
			let pause = document.getElementById('pause-screen');
			pause.innerHTML = '';
			pause.style.display = 'none';
			gameSocket.send(JSON.stringify({"resume": true}));
		}
	}, 30);

	document.addEventListener("keydown", e => {
		keysPressed[e.key] = true;
	});


	document.addEventListener("keyup", e => {
		keysPressed[e.key] = false;
	});


	gameSocket.onmessage = function(event){
		let data = JSON.parse(event.data);
		if ('game_over' in data){
			let winner = document.getElementById('winner');
			let winnerBtn = document.getElementById('winner-name');
			winner.style.display = 'block';
			winnerBtn.innerHTML = data.winner + " wins!";
			let backBtn = document.getElementById('game-back');
			backBtn.style.display = 'block';
			gameSocket.close();
			return;
		}

		let page = window.location.pathname;
		if (page != '/game')
			gameSocket.close();
		displayPong(data);
	}

	gameSocket.onclose = function(event){
		clearInterval(checkInput);
		clearInterval(requestUpdate);
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




function displayPong(data)
{

	let ball = document.getElementById('ball');
	let game = document.getElementById('pongGame');
	let headerbar = document.getElementById('header-bar');
	let name1 = document.getElementById('player1-name');
	let name2 = document.getElementById('player2-name');
	let p1score = document.getElementById('player1-score');
	let p2score = document.getElementById('player2-score');
	let player1 = document.getElementById('player1');
	let player2 = document.getElementById('player2');
	
	if('player_1_name' in data){
		name1.innerHTML = data.player_1_name;
		name2.innerHTML = data.player_2_name;
	}
	if ('score1' in data){
		p1score.innerHTML = data.score1;
		p2score.innerHTML = data.score2;
	}
	game.style.height = (window.innerHeight - headerbar.clientHeight) + 'px';

	ball.style.position = 'absolute';
	ball.style.left = data.ballx + '%';
	ball.style.top = data.bally + '%';


	player1.style.position = 'absolute';
	player1.style.left = data.x1 - 1 +'%';
	player1.style.top = data.y1 + '%';
	player1.style.transition = 'left 0.025s linear, top 0.025s linear';

	player2.style.position = 'absolute';
	player2.style.left = data.x2 + '%';
	player2.style.top = data.y2 + '%';
	player2.style.transition = 'left 0.025s linear, top 0.025s linear';
}


/*
 _                 _   _                                                    _   
| |               | | | |                                                  | |  
| | ___   ___ __ _| | | |_ ___  _   _ _ __ _ __   __ _ _ __ ___   ___ _ __ | |_ 
| |/ _ \ / __/ _` | | | __/ _ \| | | | '__| '_ \ / _` | '_ ` _ \ / _ \ '_ \| __|
| | (_) | (_| (_| | | | || (_) | |_| | |  | | | | (_| | | | | | |  __/ | | | |_ 
|_|\___/ \___\__,_|_|  \__\___/ \__,_|_|  |_| |_|\__,_|_| |_| |_|\___|_| |_|\__|
*/

let tournamentSocket;
let tournamentRules;

function bind_local_Tournament(localSettings){
 tournamentSocket = new WebSocket('wss://' + window.location.host + '/ws/localTournament/'); //wss only

 tournamentSocket.onopen = function(e){
	tournamentSocket.send(JSON.stringify(localSettings));
 }

 tournamentSocket.onmessage = function(event){
	 let data = JSON.parse(event.data);
	 if(data.type === 'rules'){
		 tournamentRules = data;
	 }
	 if ('status' in data)
		updateTournament(data);
 }

 tournamentSocket.onclose = function(event){
	 if (event.code === 1000) {
		 console.log(`Connection of LocalTournament closed cleanly, code=${event.code} reason=${event.reason}`);
	 } else {
		 console.log('Connection died');
	 }
	tournamentSocket = null;
 }

}

function tournamentStatus(){
	tournamentSocket.send(JSON.stringify({"type": "status"}));
}


function updateTournament(data){
	let participants = data['participants']
	for (let i = 0; i < participants.length; i++) {
		let ids = document.getElementById('p' + (i + 1));
		ids.innerHTML = participants[i];
	}
	document.getElementById('nextFirst').innerHTML = data['nextUp'][0];
	document.getElementById('nextSecond').innerHTML = data['nextUp'][1];
}

function localTournament(){
	document.getElementById('stage').style.display = 'block';
	document.getElementById('th-begin').style.display = 'none';
	document.getElementById('th-cancel').style.display = 'none';
	tournamentStatus();
}

function tournamentMatch(){
	fetch('/game/pong.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('content').innerHTML = data;
		})
		.catch(error => console.log(error));
	gameSocket = new WebSocket('wss://' + window.location.host + '/ws/tournament_match/'); //wss only
	gameSocket.onopen = function(){
		if(tournamentSocket){
			console.log(tournamentRules)
			gameSocket.send(JSON.stringify(tournamentRules))
		}
		else{
			gameSocket.close();
			tournamentRules = {};
			changeURL("/game", 'game page', {main:true})
		}
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
		if(keysPressed['p']){
			gameSocket.send(JSON.stringify({"pause": true}));
			let pause = document.getElementById('pause-screen');
			pause.innerHTML = 'Game Paused';
			pause.style.display = 'block';
			
		}
		if(keysPressed['k']){
			let pause = document.getElementById('pause-screen');
			pause.innerHTML = '';
			pause.style.display = 'none';
			gameSocket.send(JSON.stringify({"resume": true}));
		}
	}, 30);

	document.addEventListener("keydown", e => {
		keysPressed[e.key] = true;
	});


	document.addEventListener("keyup", e => {
		keysPressed[e.key] = false;
	});

	

	gameSocket.onmessage = function(event){
		let data = JSON.parse(event.data);
		console.log(data);
		if("Rules" in data){
			gameSocket.send(JSON.stringify({ "update": "update"}));
			requestUpdate = setInterval(() => {
			gameSocket.send(JSON.stringify({ "update": "update"}))	}, 10);
			}

		if ('game_over' in data){
			let winner = document.getElementById('winner');
			let winnerBtn = document.getElementById('winner-name');
			winner.style.display = 'block';
			winnerBtn.innerHTML = data.winner + " wins!";
			let backBtn = document.getElementById('game-back');
			backBtn.style.display = 'block';
			gameSocket.close();
			return;
		}

		if (window.location.pathname != '/game')
			gameSocket.close();
		else
			displayPong(data);
	}

	gameSocket.onclose = function(event){
		clearInterval(checkInput);
		clearInterval(requestUpdate);
		tournamentRules = {};
		if (event.code === 1000) {
			console.log(`Connection localMatch closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			console.log('Connection died');
		}
	}

	gameSocket.onerror = function(error) {
		console.log(`Error: ${error.message}`);
	};
}
