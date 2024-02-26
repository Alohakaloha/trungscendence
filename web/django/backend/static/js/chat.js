let chatWindow;
let chatMessage;
let sendBtn;
let chatSocket;

init();

function init() {
	return new Promise((resolve, reject) => {
		chatWindow = document.getElementById('chat-window');
		if (chatWindow) {
			chatMessage = document.getElementById('chat-message');
			chatMessage.addEventListener('keydown', function(event){
				if(event.key === "Enter"){
					sendMsg();
				}
			});
			sendBtn = document.getElementById('chat-button');
			sendBtn.addEventListener('click', sendMsg);
			console.log("chat initialized");
			connectChat();
		} else {
			// Reject the promise if the chat window is not found
			console.log("chat window not found");
			// reject(new Error("Chat window not found"));
		}
	});
}
function unload() {
	return new Promise((resolve, reject) => {
		if (chatWindow) {
			chatWIndow = null;
			chatMessage = null;
			sendBtn = null;

			console.log("chat unloaded");
			// Resolve the promise if everything is successful
			resolve();
		} else {
			// Reject the promise if the login button is not found
			reject(new Error("chat not found"));
		}
	});
}


function connectChat(){
	chatSocket = new WebSocket('wss://' + window.location.host + '/ws/chatting/'); //wss only
	chatSocket.onopen = function(e){
		console.log("chat connected");
	}
}

chatSocket.onmessage = function(event) {
    console.log(`Data received from server: ${event.data}`);
};

chatSocket.onclose = function(event){
	if (event.code === 1000) {
		console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	} else {
		console.log('Connection died');
	}
}


chatSocket.onerror = function(error) {
	console.log(`Error: ${error.message}`);
};

function sendMsg(){
	let message = chatMessage.value;
	message = message.trim();
	if(message === ""){
		return;
	}
	console.log("message: " + message);
	chatMessage.value = "";
}

function startChat(){
	console.log("start chat");
}