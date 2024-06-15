// on refresh handle the routing
const content = document.getElementById('content');
const chat = document.getElementById('chat');

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

async function fetchUserFriends(){
	try {
		const response = await fetch('/friends_list');
		const data = await response.json();
		return data;
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
			if (chatSocket){
			}else{
				chatSocket = new WebSocket('wss://' + window.location.host + '/ws/chatting/');
			}	
			chatSocket.onopen = function(){
				console.log("Socket is open");
			}
		}
		else{
			if (chatSocket){
				chatSocket.close();
				chatSocket = null;
			}
		}
		switch (page) {
			case '/':
				jsFile = './welcome.js';
				showPage("main/welcome.html");
				break;

			case '/chat':
				showPage(`${page.slice(1)}/${page.slice(1)}.html`);
				break;

			case '/game':
				// jsFile = './game/tmpGame.js';
				if (gameSocket)
					gameSocket.close();
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

			case '/password_reset':
				showPage('password_reset')
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


//        | |         | |  
//     ___| |__   __ _| |_ 
//    / __| '_ \ / _` | __|
//   | (__| | | | (_| | |_ 
//    \___|_| |_|\__,_|\__|
	let chatSocket;
	let chatWrapper = document.getElementById('chat-wrapper');
	let chatMessage;
	let chatWindowWrapper;
	let chatText;
	let friendList;

	// {% for user in request.user.friends.all%}
	// <div class="user-details">
	// 	<span style="cursor: pointer; text-decoration: underline; color: blue;"> {{ user.username }} </span>
	// 	<a class="user_id" style="display: none" data-user-id="{{ user.user_id }}"></a>
	// 	{% if user.is_online %}
	// 	<img src="{% static 'images/online.png' %}" width="22"/>
	// 	<a>Online</a>
	// 	{% elif user.last_online %}
	// 	<img src="{% static 'images/last_online.png' %}" width="22"/>
	// 	<a>{{ user.get_online_info }} </a>
	// 	{% endif %}
	// 	<form class="unfriend" action="unfriend/{{ user.user_id }}" method="post">
	// 		{% csrf_token %}
	// 		<button type="submit" class="unfriend_button" data-user-id="{{ user.user_id }}" style="background-color: red; color: white; width: 100px; height: 30px">Unfriend</button> 
	// 	</form>
	// 	<span id="unfriend_msg" style="color: green;"></span>
	// 	<br>
	// 	<div class="user-info" style="display: none"></div>
	// </div>
	// <br>
	// {% endfor %}

	// user email and receiver userid are being send to the server
	function chatObject(user, receiver){
	let chatRoom = {
		"type": "chatroom",
		"sender": user,
		"receiver": receiver,
	};

	if (openWindow === true){
		let chatReceiver = document.getElementById('chat-receiver');
		chatReceiver.innerHTML = receiver;
	}
	if (chatSocket.readyState === WebSocket.OPEN) {
		console.log("chat socket for room is open")
		chatSocket.send(JSON.stringify(chatRoom));
		}
	else
		return;
	}

	function blockUser(user, receiver){
		let block = {
			"type": "block",
			"sender": user,
			"receiver": receiver,
		};

		if (chatSocket.readyState === WebSocket.OPEN) {
			chatSocket.send(JSON.stringify(block));
		}
		else
			return;
	}

	// creates the chat window with the friend list from userobject
	async function showFriends(){
		let user = await fetchUserData();
		if (user.authenticated){

			let list = await fetchUserFriends();
			let allChat = document.createElement('div');
			allChat.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg> All Chat`;
			
			allChat.onclick = function() {chatObject(user, "global")};
			friendList.appendChild(allChat);
			for (let friend of list.friends) {
				let friendDiv = document.createElement('div');
				friendDiv.className = 'friends-window';
				let friendPic = document.createElement('img');
				friendPic.src = friend.profile_picture;
				friendDiv.onclick = function() { chatObject(user.email, friend.username); };
				friendDiv.appendChild(friendPic);
				friendDiv.innerHTML += friend.username;
			
				// Create the dropdown button
				let menu = document.createElement('button');
				menu.style.borderRadius = '50%';
				menu.className = 'btn btn-dark dropdown-toggle';
				menu.setAttribute('type', 'button');
				menu.setAttribute('id', 'dropdownMenuButton' + friend.username); // Ensure unique ID for each friend
				menu.setAttribute('data-bs-toggle', 'dropdown'); // Note the 'bs' for Bootstrap 5
				menu.setAttribute('aria-expanded', 'false');
			
				// Create the dropdown menu
				let dropdownMenu = document.createElement('ul');
				dropdownMenu.className = 'dropdown-menu';
				dropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton' + friend.username); // Ensure it matches the button's ID
			
				// Create dropdown items
				let dropdownItem = document.createElement('li');
				let actionLink = document.createElement('a');
				actionLink.className = 'dropdown-item';
				actionLink.href = '#';
				actionLink.textContent = "block " + friend.username;
				actionLink.onclick = function() { blockUser(user.email, friend.username); };
				// Add any specific onclick functionality here
				dropdownItem.appendChild(actionLink);
				dropdownMenu.appendChild(dropdownItem);
			
				// Append the menu and dropdownMenu to friendDiv
				friendDiv.appendChild(menu);
				friendDiv.appendChild(dropdownMenu);
			
				// Append friendDiv to friendList
				friendList.appendChild(friendDiv);
			
			}
		}
		else
			console.log('Not logged in')
		
	}


	function openingChat(){
		if (!chatSocket)
		{
			alert("Please log in to use chat");
			return;
		}
		console.log("opening chat")
		openWindow = true;
		chat.style.height = 'auto';
		chat.style.width = 'auto';
		let closing = document.createElement("div");
		closing.id = 'close-chat';
		chat.innerHTML = '<div id="chat-receiver"></div><div id="chatWindow-Wrapper"><div id="chat-window"><div id="chat-text"></div></div></div><div id="chat-input"><input type="text" id="chat-message" ><button class="btn btn-dark" id="chat-button" onclick="sendChat()"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/></svg></button></div></div>';
		chat.removeEventListener('click', openingChat);
		chat.insertBefore(closing, chat.firstChild);
		closing.innerHTML = '<div><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg></div>';
		// chat.innerHTML = 'Please log in to use chat';
		closing.addEventListener('click', function(event) {
			event.stopPropagation();
			closingChat();
		});
		chat.style.transform = 'translate(0, 0)';
		friendList = document.createElement('div');
		friendList.id = 'friend-list';
		chatMessage = document.getElementById('chat-message');
		chatWindowWrapper = document.getElementById('chatWindow-Wrapper');
		chatWindowWrapper.insertBefore(friendList, chatWindowWrapper.firstChild);
		chatText = document.getElementById('chat-text');
		showFriends(chatText);
		chatMessage.addEventListener('keydown', function(event){
			if(event.key === "Enter" && document.activeElement === chatMessage){
				sendChat();
			}
		});
		updateChat();
	};
	
	chat.addEventListener('click', openingChat);

	function updateChat(){
		console.log("chat update on")
		chatSocket.onmessage = function(event) {
			console.log(`Data received from server: ${event.data}`);
			let message = document.createElement('div');
			message.className = 'user-message';
			chatText.appendChild(message)
			message.innerHTML = event.data;

			chatText.scrollTop = chatText.scrollHeight;
			
		};
		
		chatSocket.onclose = function(event){
			if (event.code === 1000) {
				console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
			} else {
				console.log('Connection died = ', event);
			}
		}
	}

	async function sendChat(){
		// TODO with user Authentication
		let text = chatMessage.value;
		let receiver = document.getElementById('chat-receiver').textContent;
		text = text.trim();
		
		if(text === "" || receiver === ""){
			return;
		}
		let user = await fetchUserData();
		let message = {
			"type"	: "message",
			"sender": user.username,
			"receiver": receiver,
			"message": text,
		};
		console.log(message);
		if (chatSocket.readyState === WebSocket.OPEN) {

		// console.log("message: " + message);
		chatSocket.send(JSON.stringify(message));	
		}
		chatMessage.value = "";
	}
		
		
		function closingChat(){
		
		console.log("closing chat")
		let closeChat;
		closeChat = document.getElementById('close-chat');
		closeChat.removeEventListener('click', closingChat);
		chat.removeChild(closeChat);
		openWindow = false;
		chatText = null;
		chatWindowWrapper = null;
		chat.style.height = '3vh';
		chat.style.width = '5vw';
		chat.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-chat" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/></svg>';
		chat.addEventListener('click', openingChat);
		chat.style.transform = 'translate(0, -100%)';
	};


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
		sounds = document.getElementById('localSound').checked;
		localColors = {
			"p1Color": document.querySelector('input[name="player1Color"]:checked').value,
			"p2Color": document.querySelector('input[name="player2Color"]:checked').value,
		}
	
		initializeGame(localSettings, localColors);
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
let sounds = false;
let requestUpdate;
let keysPressed = {};

function initializeGame(settings, colors) {
	fetch('/game/pong.html')
	.then(response => response.text())
	.then(data => {
		document.getElementById('content').innerHTML = data;
		connectGame(settings, colors);
	})
	.catch(error => console.log(error));
}

function playSound(sound){
	if (!sounds)
		return;
	let audio;
	if (sound === "player")
		audio = new Audio('/staticstuff/sounds/bounce.mp3');
	else if (sound === "wall")
		audio = new Audio('/staticstuff/sounds/wall.mp3');
	else if (sound === "ring")
		audio = new Audio('/staticstuff/sounds/score.mp3');
	else if (sound === "game_over")
		audio = new Audio('/staticstuff/sounds/winning.mp3');
	else
		return;
	audio.play();
}


function connectGame(settings, colors){
	gameSocket = new WebSocket('wss://' + window.location.host + '/ws/local/'); //wss only
	gameSocket.onopen = function(){
		gameSocket.send(JSON.stringify(settings));
		requestUpdate = setInterval(() => {
			gameSocket.send(JSON.stringify({ "update": "update"}))	}, 10);
			p1Color = document.getElementById("player1");
			p2Color = document.getElementById("player2");
			p1Color.style.boxShadow = "-5px 0px 3px "+ colors.p1Color;
			p2Color.style.boxShadow ="5px 0px 3px " + colors.p2Color;


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
			console.log("game over");
			gameSocket.close();
			playSound("game_over");
			return;
		}

		let page = window.location.pathname;
		if (page != '/game' && page != "game/localTournament")
			gameSocket.close();
		if ("sounds" in data){
			playSound(data.sounds);
		}
		else{
			displayPong(data);
		}
	}

	gameSocket.onclose = function(event){

		console.log(event);
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


function playerRounds(p1, p2){
	let p1rounds = document.getElementById('player1-rounds');
	let p2rounds = document.getElementById('player2-rounds');

	let svgTemplate = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>';
	
	let currentP1 = p1rounds.getElementsByTagName('svg').length;
	let currentP2 = p2rounds.getElementsByTagName('svg').length;

	let toAddP1 = p1 - currentP1;
	let toAddP2 = p2 - currentP2;

	for (let i = 0; i < toAddP1; i++){
		p1rounds.innerHTML += svgTemplate;
	}
	for (let i = 0; i < toAddP2; i++){
		p2rounds.innerHTML += svgTemplate;
	}
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
	if ('p1Rounds' in data){
		playSound("ring");
		playerRounds(data.p1Rounds, data.p2Rounds);
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

 tournamentSocket.onopen = function(){
	console.log(localSettings);
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
	let remaining = data['remaining'];
	for (let i = 0; i < participants.length; i++) {
		let ids = document.getElementById('p' + (i + 1));
		ids.innerHTML = participants[i];
	}
	for(let i = 0; i < remaining.length; i++){
		let ids = document.getElementById('r' + (i + 1));
		ids.innerHTML = remaining[i];
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
	sounds = document.getElementById('localSound').checked;
	let colors = {
		"p1Color": document.querySelector('input[name="player1Color"]:checked').value,
		"p2Color": document.querySelector('input[name="player2Color"]:checked').value,
	}
	fetch('/game/pong.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('content').innerHTML = data;
			
		})
		.catch(error => console.log(error));


	gameSocket = new WebSocket('wss://' + window.location.host + '/ws/tournament_match/'); //wss only
	gameSocket.onopen = function(){
		if(tournamentSocket){
			gameSocket.send(JSON.stringify(tournamentRules))
			p1Color = document.getElementById("player1");
			p2Color = document.getElementById("player2");
			p1Color.style.boxShadow = "-5px 0px 3px "+ colors.p1Color;
			p2Color.style.boxShadow ="5px 0px 3px " + colors.p2Color;
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
		if(data.type === 'rules'){
			gameSocket.send(JSON.stringify({ "update": "update"}));
			requestUpdate = setInterval(() => {
			gameSocket.send(JSON.stringify({ "update": "update"}))	}, 10);
			}

		if ('game_over' in data){
			console.log("result =", data)
			let winner = document.getElementById('winner');
			let winnerBtn = document.getElementById('winner-name');
			winner.style.display = 'block';
			winnerBtn.innerHTML = data.winner + " wins!";
			let backBtn = document.getElementById('game-back');
			backBtn.style.display = 'block';
			gameSocket.close();
			sounds = false;
			if (tournamentSocket === WebSocket.OPEN)
				tournamentSocket.send(JSON.stringify(data));
			return;
		}
		if ("sounds" in data)
			playSound(data.sounds);
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
