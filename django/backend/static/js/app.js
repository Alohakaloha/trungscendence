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

let debugMode = true; // Set to false to disable debug logs

	function logMessage(type, message) {
		const timestamp = new Date().toLocaleString('en-GB', { 
			day: '2-digit', 
			month: '2-digit', 
			year: 'numeric', 
			hour: '2-digit', 
			minute: '2-digit', 
			second: '2-digit' 
		}).replace(',', '');

		if (debugMode) {
			switch(type) {
				case 'info':
					console.info(`[INFO - ${timestamp}]: ${message}`);
					break;
				case 'warn':
					console.warn(`[WARN - ${timestamp}]: ${message}`);
					break;
				case 'error':
					console.error(`[ERROR - ${timestamp}]: ${message}`);
					break;
				default:
					console.log(`[LOG - ${timestamp}]: ${message}`);
					break;
			}
		}
	}

	function setDebugMode(mode) {
		debugMode = mode;
	}

const toastTrigger = document.getElementById('liveToastBtn')
const toastLiveExample = document.getElementById('liveToast')

if (toastTrigger) {
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
  toastTrigger.addEventListener('click', () => {
    toastBootstrap.show()
  })
}


	let chatSocket;
	let chatWrapper = document.getElementById('chat-wrapper');
	let chatMessage;
	let chatWindowWrapper;
	let chatText;
	let friendList;

	function chatObject(user, receiver) {
		let chatRoom = {
			"type": "chatroom",
			"sender": user,
			"receiver": receiver,
		};
	
		if (openWindow === true) {
			let chatReceiver = document.getElementById('chat-receiver');
			chatReceiver.innerHTML = receiver;
			logMessage('info', `Chat window updated with receiver: ${receiver}`);
		}
	
		if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
			logMessage('info', "Sending chat message:");
			logMessage('info', JSON.stringify(chatRoom));
			chatSocket.send(JSON.stringify(chatRoom));
		} else {
			logMessage('error', "Unable to send message: WebSocket not open or not initialized.");
			return;
		}
	}
	

	function updateChatWindow(receiver) {
		if (openWindow === true) {
			let chatReceiver = document.getElementById('chat-receiver');
			chatReceiver.innerHTML = receiver;
			logMessage('info', `Chat window updated with receiver: ${receiver}`);
		}
	}
	
	function handleSystemNotifications() {
		logMessage('info', "Fetching system notifications");
		
		// Clear the chat window
		let chatText = document.getElementById('chat-text');
		chatText.innerHTML = "";
	
		if (allToasts.length === 0) {
			displaySystemMessage("No previous notifications.");
			logMessage('info', "No previous notifications.");
		} else {
			allToasts.forEach(toast => {
				displaySystemMessage(`${toast.message}`);
			});
	
			logMessage('info', "System notifications displayed!");
		}
	}

	
	function blockUser(user, receiver) {
		let block = {
			"type": "block",
			"sender": user,
			"receiver": receiver,
		};
	
		if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
			logMessage('info', "Sending block request:");
			logMessage('info', JSON.stringify(block));
			chatSocket.send(JSON.stringify(block));
		} else {
			logMessage('error', "Unable to send block request: WebSocket not open or not initialized.");
			return;
		}
	}

	function unblockUser(user, receiver) {
		let unblock = {
			"type": "unblock",
			"sender": user,
			"receiver": receiver,
		};

		if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
			logMessage('info', "Sending unblock request:");
			logMessage('info', JSON.stringify(unblock));
			chatSocket.send(JSON.stringify(unblock));
		} else {
			logMessage('error', "Unable to send unblock request: WebSocket not open or not initialized.");
			return;
		}
	}


	function viewProfile(username) {
		logMessage('info', `Viewing profile of ${username}`);
		// Placeholder function for viewing profile
	}
	
	function gameInvite(username) {
		logMessage('info', `Inviting ${username} to a game`);
		// Placeholder function for inviting to a game
	}


	function displaySystemMessage(message) {
		let timestamp = new Date();
		
		let day = String(timestamp.getDate()).padStart(2, '0');
		let month = String(timestamp.getMonth() + 1).padStart(2, '0');
		let year = timestamp.getFullYear();
		let hours = String(timestamp.getHours()).padStart(2, '0');
		let minutes = String(timestamp.getMinutes()).padStart(2, '0');
	
		let formattedTimestamp = `${day}.${month}.${year} ${hours}:${minutes}`;
	
		let messageContainer = document.createElement('div');
		messageContainer.className = 'message-container system-message';
	
		let messageTimestamp = document.createElement('div');
		messageTimestamp.className = 'message-timestamp';
		messageTimestamp.textContent = formattedTimestamp;
	
		let messageContent = document.createElement('div');
		messageContent.className = 'message-content';
		messageContent.textContent = `${message}`;
	
		messageContainer.appendChild(messageTimestamp);
		messageContainer.appendChild(messageContent);
	
		document.getElementById('chat-text').appendChild(messageContainer);
		document.getElementById('chat-text').scrollTop = document.getElementById('chat-text').scrollHeight;
	}

// Array to store all received messages
let allToasts = [];

// Array to store the last 3 messages displayed in the toast
let lastToasts = [];

function displayToastMessage(message, type = 'info', style = {}) {

    let timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    allToasts.push({ timestamp, message, type, style });

    lastToasts.unshift({ timestamp, message, type, style });

    // Keep only the last 3 messages in the lastToasts array
    if (lastToasts.length > 3) {
        lastToasts.pop();
    }

    let toastContent = lastToasts.map(msg => {
        let styleStr = Object.keys(msg.style).map(key => `${key}: ${msg.style[key]};`).join(' ');
        return `<div class="toast-message ${msg.type}" style="${styleStr}">
                    <span class="timestamp">${msg.timestamp}</span> ${msg.message}
                </div>`;
    }).join('<br>');

    // Set the content of the toast body
    let toastBody = document.getElementById('notification');
    toastBody.innerHTML = toastContent;

    // Show the Bootstrap toast
    let toastElement = document.getElementById('liveToast');
    let toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Function to retrieve all stored messages
function getallToasts() {
    return allToasts;
}

/* // Example usage with custom styles
displayToastMessage("Success message!", "success", { fontWeight: 'bold' });
displayToastMessage("Error message!", "error", { fontStyle: 'italic' });
displayToastMessage("Info message!", "info");
displayToastMessage("Warning message!", "warning", { color: 'orange' }); */

async function showFriends() {
    try {
        let user = await fetchUserData();

        if (!user.authenticated) {
            logMessage('info', 'User is not authenticated');
            return;
        }

        let list = await fetchUserFriends();
        logMessage('info', 'User friends fetched successfully: ' + JSON.stringify(list.friends));

        // Main container for All Chat
        let allChat = document.createElement('div');
        allChat.classList.add('clickable-area');
        allChat.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-people clickable-text" viewBox="0 0 16 16">
                <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
            </svg> <span class="clickable-text">All Chat</span>`;

        allChat.onclick = function(event) {
            if (event.target.classList.contains('clickable-text')) {
                updateChatWindow("global");
                displaySystemMessage("You are now writing in All Chat");
                displayToastMessage("Writing in All Chat", "info");
            }
        };
        friendList.appendChild(allChat);

        // Container for system notifications
        let systemNotifications = document.createElement('div');
        systemNotifications.classList.add('clickable-area');
        systemNotifications.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-bell-fill clickable-text" viewBox="0 0 16 16">
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901"/>
            </svg> <span class="clickable-text">System Notifications</span>`;

        systemNotifications.onclick = function(event) {
            if (event.target.classList.contains('clickable-text')) {
                handleSystemNotifications();
            }
        };

        friendList.appendChild(systemNotifications);

        // Iterate over each friend and create a div for them
        for (let friend of list.friends) {
            let friendDiv = document.createElement('div');
            friendDiv.className = 'friends-window d-flex align-items-center justify-content-between';

            // Add friend's profile picture
            let friendPic = document.createElement('img');
            friendPic.src = friend.profile_picture;
            friendPic.classList.add('clickable-text');

            // Display friend's username
            let friendName = document.createElement('span');
            friendName.classList.add('clickable-text');
            friendName.textContent = friend.username;

            // Add picture and name to a wrapper
            let friendContent = document.createElement('div');
            friendContent.className = 'd-flex align-items-center clickable-area';
            friendContent.appendChild(friendPic);
            friendContent.appendChild(friendName);

            friendContent.onclick = function(event) {
                if (event.target.classList.contains('clickable-text')) {
                    chatObject(user.username, friend.username);
                    displaySystemMessage(`Conversation with "${friend.username}"`);
                    displayToastMessage(`Conversation with ${friend.username}`, "info");
                }
            };

            friendDiv.appendChild(friendContent);

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
            dropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton' + friend.username);

            // Create dropdown items
            let blockItem = document.createElement('li');
            let blockLink = document.createElement('a');
            blockLink.className = 'dropdown-item';
            blockLink.href = '#';
            blockLink.textContent = "Block " + friend.username;
            blockLink.onclick = function(event) {
                event.stopPropagation();
                blockUser(user.username, friend.username);
            };
            blockItem.appendChild(blockLink);

            let unblockItem = document.createElement('li');
            let unblockLink = document.createElement('a');
            unblockLink.className = 'dropdown-item';
            unblockLink.href = '#';
            unblockLink.textContent = "Unblock " + friend.username;
            unblockLink.onclick = function(event) {
                event.stopPropagation();
                unblockUser(user.username, friend.username);
            };
            unblockItem.appendChild(unblockLink);

            let viewProfileItem = document.createElement('li');
            let viewProfileLink = document.createElement('a');
            viewProfileLink.className = 'dropdown-item';
            viewProfileLink.href = '#';
            viewProfileLink.textContent = "View Profile";
            viewProfileLink.onclick = function(event) {
                event.stopPropagation();
                viewProfile(friend.username);
            };
            viewProfileItem.appendChild(viewProfileLink);

            let gameInviteItem = document.createElement('li');
            let gameInviteLink = document.createElement('a');
            gameInviteLink.className = 'dropdown-item';
            gameInviteLink.href = '#';
            gameInviteLink.textContent = "Invite to Game";
            gameInviteLink.onclick = function(event) {
                event.stopPropagation();
                gameInvite(friend.username);
            };
            gameInviteItem.appendChild(gameInviteLink);

			dropdownMenu.appendChild(viewProfileItem);
            dropdownMenu.appendChild(gameInviteItem);
            dropdownMenu.appendChild(blockItem);
            dropdownMenu.appendChild(unblockItem);


            // Append the menu and dropdownMenu to friendDiv
            friendDiv.appendChild(menu);
            friendDiv.appendChild(dropdownMenu);

            // Append friendDiv to friendList
            friendList.appendChild(friendDiv);
        }
    } catch (error) {
        logMessage('error', 'Error fetching user data or user friends: ' + error);
    }
}


	function openingChat() {
		if (!chatSocket) {
			logMessage('warning', 'Chat socket not available. Please log in to use chat.');
			alert("Please log in to use chat");
			return;
		}
	
		logMessage('info', 'Opening chat');
	
		openWindow = true;
		chat.style.height = 'auto';
		chat.style.width = 'auto';
	
		// Create the closing button
		let closing = document.createElement("div");
		closing.id = 'close-chat';
		chat.innerHTML = `
			<div id="chat-receiver"></div>
			<div id="chatWindow-Wrapper">
				<div id="chat-window">
					<div id="chat-text"></div>
				</div>
			</div>
			<div id="chat-input">
				<input type="text" id="chat-message">
				<button class="btn btn-dark" id="chat-button" onclick="sendChat()">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16">
						<path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
					</svg>
				</button>
			</div>`;
	
		// Remove event listener to prevent multiple openings
		chat.removeEventListener('click', openingChat);
		chat.insertBefore(closing, chat.firstChild);
	
		// Create the close button
		closing.innerHTML = `
			<div>
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
					<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
				</svg>
			</div>`;
	
		// Add event listener to close button
		closing.addEventListener('click', function(event) {
			event.stopPropagation();
			closingChat();
		});
	
		chat.style.transform = 'translate(0, 0)';
	
		// Initialize friend list and chat elements
		friendList = document.createElement('div');
		friendList.id = 'friend-list';
		chatMessage = document.getElementById('chat-message');
		chatWindowWrapper = document.getElementById('chatWindow-Wrapper');
		chatWindowWrapper.insertBefore(friendList, chatWindowWrapper.firstChild);
		chatText = document.getElementById('chat-text');
		showFriends(chatText);
	
		// Listen for Enter key to send chat
		chatMessage.addEventListener('keydown', function(event) {
			if (event.key === "Enter" && document.activeElement === chatMessage) {
				sendChat();
			}
		});
		updateChat();
	}
	
	chat.addEventListener('click', openingChat);	


	function receiveMessage(messageData) {
		logMessage('info', 'Received message');
		
		let timestamp = messageData.timestamp;
		let sender = messageData.sender;
		let message = messageData.message;
		let directMessage = messageData.direct_message || false;
	
		// Create a container div for the message
		let messageContainer = document.createElement('div');
		messageContainer.className = 'message-container';
	
		// Apply different class for system messages
		if (sender === "system") {
			messageContainer.classList.add('system-message');
		} else if (directMessage) {
			messageContainer.classList.add('direct-message');
		}
	
		// Create a div for the timestamp and sender
		let messageTimestamp = document.createElement('div');
		messageTimestamp.className = 'message-timestamp';
		messageTimestamp.textContent = timestamp;
	
		// Create a div for the message content
		let messageContent = document.createElement('div');
		messageContent.className = 'message-content';
		messageContent.textContent = `${sender}: ${message}`;
	
		// Append the timestamp and content to the container
		messageContainer.appendChild(messageTimestamp);
		messageContainer.appendChild(messageContent);
	
		// Append the message container to the chat text area
		document.getElementById('chat-text').appendChild(messageContainer);
	
		// Scroll to the bottom of the chat text area
		document.getElementById('chat-text').scrollTop = document.getElementById('chat-text').scrollHeight;
	}	

	function updateChat() {
		logMessage('info', 'Chat update started');
	
		chatSocket.onmessage = function (event) {
			let messageData = JSON.parse(event.data);
			logMessage('info', 'Message received:', messageData);
	
			switch (messageData["type"]) {
				case "history":
					logMessage('info', 'Processing chat history');
					let flush = document.getElementById("chat-text");
					flush.textContent = "";
					displaySystemMessage(`Last messages`);
					const conversation = messageData.conversation;
					conversation.forEach(message => {
						receiveMessage(message);
					});
					break;
				case "message":
					receiveMessage(messageData);
					break;
				default:
					logMessage('warning', `Unknown message type received: ${messageData["type"]}`);
					break;
			}
		};
	
		chatSocket.onclose = function (event) {
			if (event.code === 1000) {
				logMessage('info', `Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				logMessage('error', 'Connection closed unexpectedly:', event);
			}
		};
	}		

	
	async function sendChat() {
		let text = chatMessage.value;
		let receiver = document.getElementById('chat-receiver').textContent;
		text = text.trim();
	
		if (text === "" || receiver === "") {
			logMessage('error', "Cannot send empty message or receiver not selected.");
			displaySystemMessage("Cannot send empty message or receiver not selected.");
			displayToastMessage("Empty message or no receiver", "error");
			return;
		}
	
		let user = await fetchUserData();
		if (!user.authenticated) {
			logMessage('error', "User not authenticated. Cannot send message.");
			displaySystemMessage("User not authenticated. Cannot send message.");
			displayToastMessage("User not authenticated", "error");
			return;
		}
	
		// Prepare message object
		let message = {
			"type": "message",
			"sender": user.username,
			"receiver": receiver,
			"message": text,
		};
	
		logMessage('info', "Sending message:");
		logMessage('info', message);
	
		if (chatSocket.readyState === WebSocket.OPEN) {
			chatSocket.send(JSON.stringify(message));
		} else {
			logMessage('error', "WebSocket not open. Cannot send message.");
			displaySystemMessage("WebSocket not open. Cannot send message.");
			return;
		}
	
		// Clear chat message input after sending
		chatMessage.value = "";
	}


	function closingChat() {
		logMessage('info', "Closing chat");
	
		// Remove close button
		let closeChat = document.getElementById('close-chat');
		closeChat.removeEventListener('click', closingChat);
		chat.removeChild(closeChat);
	
		// Reset chat window state
		openWindow = false;
		chatText = null;
		chatWindowWrapper = null;
		chat.style.height = '3vh';
		chat.style.width = '5vw';
	
		// Update chat UI
		chat.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-chat" width="32" viewBox="0 0 16 16">
				<path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
			</svg>`;
	
		// Re-enable chat opening
		chat.addEventListener('click', openingChat);
	
		// Slide chat out of view
		chat.style.transform = 'translate(0, -100%)';
	}



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
		 console.log('tournament closed ', event);
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

		if (data.type === "match_result"){
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
				console.log(data);
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
		console.log("game ended");
	}

	gameSocket.onerror = function(error) {
		console.log(`Error: ${error.message}`);
	};
}
