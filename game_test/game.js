const myCarouselElement = document.querySelector('#myCarousel')

const carousel = new bootstrap.Carousel(myCarouselElement, {
  interval: 2000,
  touch: false
})


// let game = document.getElementById('game');
// let gameOffset = document.getElementById('header-bar')
// let ctx;
// let gameText;
// let gameTextOffset;
// let strokeColor;

// game.width = gameOffset.offsetWidth;
// game.height = window.innerHeight - gameOffset.offsetHeight;

// window.addEventListener('resize', function() {
// 	game.width = gameOffset.offsetWidth;
// 	game.height = window.innerHeight - gameOffset.offsetHeight;
// 	ctx.font = '40px Times New Roman';
// 	ctx.fillStyle = 'black';
// 	ctx.textAlign = 'center';
// 	gameTextOffset = ctx.measureText(gameText).width;
// 	ctx.fillText(gameText, ((game.width - (gameTextOffset/2)) / 2),40);
// 	ctx.fillRect(10, 200, game.width / 3- 20, game.height / 2 - 20);
// 	console.log((game.width / 2) - (gameTextOffset/2));
// 	console.log("Game window" ,game.width , " offset", gameTextOffset);
// });



// ctx = game.getContext('2d');

// // styles
// gameText = "Ever heard of Pong?";
// ctx.font = '40px Times New Roman';
// ctx.fillStyle = 'black';
// ctx.textAlign = 'center';
// strokeColor = 'black';

// // coordinates
// gameTextOffset = ctx.measureText(gameText).width;
// boxwidth = game.width / 5 - 20;
// boxheight = 200;

// let gameButton = {
// 	x		: boxwidth,
// 	y		: boxheight,
// 	line	: 4,
// 	color	: strokeColor,
// }

// // Box 1
// ctx.strokeStyle = gameButton.color; // Set the border color
// ctx.lineWidth = gameButton.line;
// ctx.strokeRect(0, 0, gameButton.x, gameButton.y);
// // Box 2
// ctx.strokeStyle = gameButton.color;
// ctx.lineWidth = gameButton.line;
// ctx.strokeRect(boxwidth + 10 , 0, gameButton.x, gameButton.y);
// // Box 2
// ctx.strokeStyle = gameButton.color;
// ctx.lineWidth = gameButton.line;
// ctx.strokeRect(boxwidth * 2 + 20, 0, gameButton.x, gameButton.y);
// // Box 2
// ctx.strokeStyle = gameButton.color;
// ctx.lineWidth = gameButton.line;
// ctx.strokeRect(boxwidth * 3 + 30, 0, gameButton.x, gameButton.y);
// // Box 2
// ctx.strokeStyle = gameButton.color;
// ctx.lineWidth = gameButton.line;
// ctx.strokeRect(boxwidth * 4 + 40, 0, gameButton.x, gameButton.y);


// // startx , starty, sizex , sizey
// let width = 100; // Rectangle width
// let height = 50; // Rectangle height

// ctx.strokeStyle = 'black'; // Set the border color
// ctx.lineWidth = 4; // Set the border width