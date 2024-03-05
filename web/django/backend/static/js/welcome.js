let content;
let matrix;
let header;
let fontSize;
let ctx;
let welcome;
let drop
let interval;
let setDrop;



export function init() {
	return new Promise((resolve, reject) => {
		content = document.getElementById('content');
		matrix = document.createElement('canvas');
		header = document.getElementById('header-bar');
		matrix.id = 'matrix';
		matrix.width = window.innerWidth - 20;
		matrix.height = window.innerHeight - header.offsetHeight - 100;
		fontSize = window.innerWidth * 0.05;
		content.appendChild(matrix);
		ctx = matrix.getContext('2d');
		ctx.font = fontSize + 'px arial';
		window.addEventListener('resize', function() {
			matrix.width = window.innerWidth - 20;
			matrix.height = window.innerHeight - header.offsetHeight - 100;
			fontSize = window.innerWidth * 0.05;
			ctx.font = fontSize + 'px arial';
			ctx.fillStyle = '#FF0000';
		});
		welcome = ['Bienvenue', 'Willkommen', 'Chào mừng', 'Witaj', 'Добро пожаловать', 'Welcome', '환영합니다', '欢迎', 'Vítejte', 'Laipni lūdzam', 'Benvenuto', 'Bienvenido', 'Bem-vindo', 'Velkommen', 'Tervetuloa', 'Καλώς ήρθες', 'Hoş geldiniz', 'ยินดีต้อนรับ', 'Selamat datang', 'ようこそ', 'Välkommen'];
		drop = {
			x: Math.random() * matrix.width,
			y: Math.random() * matrix.height,
			text: welcome[Math.floor(Math.random() * welcome.length)]
		};
		function draw() {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
			ctx.fillRect(0, 0, matrix.width, matrix.height);
			
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(drop.text, drop.x, drop.y * (fontSize + 10));
		}
		draw();
		function moveDrop() {
			drop.y++;
			if(drop.y * (fontSize + 10) > matrix.height) {
				drop.y = 0;
				drop.x = matrix.width / 2 - drop.text.length * (fontSize + 10) / 2;
				drop.text = welcome[Math.floor(Math.random() * welcome.length)];
			}
		}

		setDrop = setInterval(moveDrop, 100);
		interval = setInterval(draw,50);
		console.log('welcome.js loaded');
		resolve();
	}
	);

};



export function unload(){
	clearInterval(interval);
	clearInterval(setDrop);
	let matrixCanvas = document.getElementById('matrix');
	if (matrixCanvas){
		matrixCanvas.remove();
	}
	content = null;
	matrix = null;
	header = null;
	fontSize = null;
	ctx = null;
	welcome = null;
	drop  = null;
	interval = null;
	setDrop = null;

	console.log('welcome.js unloaded');

}
// let information = document.createElement('div');
// information.id = 'information';
// information.textContent = 'hello world';


// document.body.appendChild(information)

// export function draw() {
//     ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
//     ctx.fillRect(0, 0, matrix.width, matrix.height);

//     ctx.fillStyle = '#FFFFFF';
//     ctx.fillText(drop.text, drop.x, drop.y * (fontSize + 10));
// }

// export function moveDrop() {
//     drop.y++;
//     if(drop.y * (fontSize + 10) > matrix.height) {
//         drop.y = 0;
//         drop.x = matrix.width / 2 - drop.text.length * (fontSize + 10) / 2;
//         drop.text = welcome[Math.floor(Math.random() * welcome.length)];
//     }
// }
