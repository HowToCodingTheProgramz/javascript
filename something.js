var can = null;
var ctx = null;
var inner_width = 320;
var inner_height = 240;

var score = 0;
var lives = 3;

var debugging = false; // set this to true to get faster win state.

const states = {
	START : 0,
	PLAYING: 1,
	PAUSE: 2,
	DIED: 3,
	WON: 4
};
var strings = [
	"Click anywhwere to start.",
	"Click anywhere to toggle pause.",
	"Click anywhere to resume playing.",
	"Sorry you've died, please try again.",
	"Congratulations, you've won!"
];
var currentState = states.START;

Rekt = function(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

Rekt.prototype.draw = function() {
	ctx.fillRect(this.x, this.y, this.w, this.h);
}

// the next function will return which edge intersects
// 0 = top
// 1 = right
// 2 = bottom
// 3 = left
Rekt.prototype.pointInRect = function(ox, oy) {
	return (ox >= this.x && ox <= (this.x + this.w) && oy >= this.y && oy <= (this.y + this.h));
}

PlayingField = function(w, h, num_rekt_x, num_rekt_y) {
	this.num_rect_x = num_rekt_x;
	this.num_rect_y = num_rekt_y;
	var rw =  ((w - this.num_rect_x) / this.num_rect_x);
	var rh =  ((h - this.num_rect_y) / this.num_rect_y);

	this.rekts = [];

	for (var j = 0; j < this.num_rect_y; j++) {
		for (var k = 0; k < this.num_rect_x; k++) {
			var rkt = new Rekt((k * rw) + k, (j * rh) + j, rw, rh);
			rkt.visible = true;
			this.rekts.push(rkt);
		}
	}

	if (debugging) {
		for (var i = 0; i < this.rekts.length; i++) {
			this.rekts[i].visible = false;
		}
		this.rekts[this.rekts.length - 4].visible = true;
	}
}
PlayingField.prototype.reset = function() {
	for (var i = 0; i < this.rekts.length; i++) {
		this.rekts[i].visible = true;
	}
}
PlayingField.prototype.isCleared = function() {
	for (var i = 0; i < this.rekts.length; i++) {
		if (this.rekts[i].visible) return false;
	}
	return true;
}
PlayingField.prototype.findIntersectingEdgeOf = function(other) {
	for (var i = 0; i < this.rekts.length; i++) {
		if (!this.rekts[i].visible) continue;
		var right = (other.x >= this.rekts[i].x) ? other.x : this.rekts[i].x;
		var rwidth = (other.x >= this.rekts[i].x) ? this.rekts[i].w : other.w;
		var left = (other.x < this.rekts[i].x) ? other.x : this.rekts[i].x;
		var top = (other.y < this.rekts[i].y) ? other.y : this.rekts[i].y;
		var bottom = (other.y >= this.rekts[i].y) ? other.y : this.rekts[i].y;
		var rheight = (other.y >= this.rekts[i].y) ? this.rekts[i].h : other.h;

		var dist_x = Math.abs(right - left);
		if (dist_x <= rwidth) {
			// it's somewhere in the x-axis region.
			var dist_y = Math.abs(bottom - top);
			if (dist_y <= rheight) {
				// definitely intersecting.
				this.rekts[i].visible = false;
				if (this.rekts[i].pointInRect(this.rekts[i].x + (this.rekts[i].w >> 1), other.y - 1)) return 0; // top of ball
				if (this.rekts[i].pointInRect(this.rekts[i].x + (this.rekts[i].w >> 1), other.y + other.h + 1)) return 2; // bottom of ball
				if (this.rekts[i].pointInRect(other.x - 1, this.rekts[i].y + (this.rekts[i].h >> 1))) return 3; // left of ball
				if (this.rekts[i].pointInRect(other.x + other.w + 1, this.rekts[i].y + (this.rekts[i].h >> 1))) return 1; // right of ball
			}
		}
	}
}
PlayingField.prototype.draw = function() {
	var h, l; // hsl?
	for (var i = 0; i < this.rekts.length; i++) {
		if (!this.rekts[i].visible) continue; // jump over.
		h = this.rekts[i].x;
		l = 25 + (((i / this.num_rect_y) * 10) / 2);
		ctx.fillStyle = `hsl(${h}, 50%, ${l}%)`;
		ctx.fillRect(this.rekts[i].x, this.rekts[i].y, this.rekts[i].w, this.rekts[i].h);
	}
}

var player = new Rekt((inner_width >> 1) - 20, inner_height - 20, 40, 4); //get rekt!!
var ball = new Rekt((inner_width >> 1) - 5, (inner_height >> 1) - 5, 6, 6); // get rekt!!!!!!!!!
var playingField = new PlayingField(inner_width, (inner_height / 3), 14, 10); 

ball.dx = 1; // mangle these properties into this object.
ball.dy = 1;

function handlemousemoved(e) {
	e.preventDefault();
	e.stopPropagation();

	var docw = document.body.clientWidth;
	var scale = inner_width / docw;
	var w = (player.w >> 1);
	var x = (e.clientX * scale);
	if (x > w && x < (inner_width - w)) {
		player.x = x - w;
	}
}

function handlemouseup(e) {
	e.preventDefault();
	e.stopPropagation();

	switch (currentState) {
		case states.START:
			currentState = states.PLAYING;
		break;
		case states.PLAYING:
			currentState = states.PAUSE;
		break;
		case states.PAUSE:
			currentState = states.PLAYING;
			break;
		case states.DIED:
		case states.WON:
			score = 0;
			lives = 3;
			resetBall();
			playingField.reset();
			currentState = states.PLAYING;
		break;
	}
	paused = !paused;
}

function init() {
	can = document.getElementById('howtocanvas');
	ctx = can.getContext('2d');

	can.width = inner_width;
	can.height = inner_height;
	can.style.width = "100vw";
	can.style.height = "100vh";

	can.onmousemove = handlemousemoved;
	can.onmouseup = handlemouseup;

	ctx.fillStyle = 'rgb(255, 0, 0)';
	ctx.font = "10px Courier";

	window.requestAnimationFrame(gameLoop);
}

function resetBall() {
	ball.x = (inner_width >> 1) - 5;
	ball.y = (inner_height >> 1) - 5;
	ball.dx = 1;
	ball.dy = 1;
}

function updateBall() {
	ball.x += ball.dx;
	ball.y += ball.dy;

	if (((ball.y + ball.h) > player.y) && (ball.y < (player.y + player.h))) {
		if ((ball.x >= player.x) && ((ball.x + ball.w) <= (player.x + player.w))) {
			ball.dy = -1;
			ball.y += ball.dy;
			score += 10;
			return;
		}
	}
	if ((ball.x + ball.w) > inner_width) {
		ball.dx = -1;
		ball.x += ball.dx;
		return;
	}
	if ((ball.y + ball.h) > inner_height) {
		ball.dy = -1;
		ball.y += ball.dy;
		// you missed the ball . . . do something.
		// end screen or something?
		--lives;
		resetBall();
		if (lives < 0) {
			currentState = states.DIED;
		}
		return;
	}
	if ((ball.x) < 0) {
		ball.dx = 1;
		ball.x += ball.dx;
		return;
	}
	if ((ball.y) < 0) {
		ball.dy = 1;
		ball.y += ball.dy;
		return;
	}

	var intersectingEdge = playingField.findIntersectingEdgeOf(ball);
	if (intersectingEdge > -1) {
		// change direction based on the intersection
		score += 100;
		switch (intersectingEdge) {
			case 0:
				ball.dy = 1;
				ball.y += ball.dy;
			break;
			case 1:
				ball.dx = -1;
				ball.x += ball.dx;
			break;
			case 2:
				ball.dy = -1;
				ball.y += ball.dy;
			break;
			case 3:
				ball.dx = 1;
				ball.x += ball.dx;
			break;
			default:
			break;
		}
	}
}

function displayScore() {
	ctx.fillStyle = 'rgb(255, 64, 96)';
	ctx.font = "10px Courier";
	ctx.fillText("SCORE: " + score, 4, inner_height - 4);
	ctx.fillText("LIVES: " + lives, 268, inner_height - 4);
}

function displayStateText() {
	ctx.fillStyle = 'rgb(255, 64, 96)';
	ctx.font = "14px Courier";

	switch (currentState) {
		case states.START:
			ctx.fillText(strings[0], (inner_width >> 1) - (ctx.measureText(strings[0]).width >> 1), (inner_height >> 1) - 20);
			ctx.fillText(strings[1], (inner_width >> 1) - (ctx.measureText(strings[1]).width >> 1), (inner_height >> 1) + 20);
			break;
		case states.PAUSE:
			ctx.fillText(strings[2], (inner_width >> 1) - (ctx.measureText(strings[2]).width >> 1), (inner_height >> 1) + 20);
			break;
		case states.DIED:
			ctx.fillText(strings[3], (inner_width >> 1) - (ctx.measureText(strings[3]).width >> 1), (inner_height >> 1) - 20);
			ctx.fillText(strings[0], (inner_width >> 1) - (ctx.measureText(strings[0]).width >> 1), (inner_height >> 1) + 20);
			ctx.fillText(strings[1], (inner_width >> 1) - (ctx.measureText(strings[1]).width >> 1), (inner_height >> 1) + 40);
			break;
		case states.WON:
			ctx.fillText(strings[4], (inner_width >> 1) - (ctx.measureText(strings[4]).width >> 1), (inner_height >> 1) - 20);
			ctx.fillText(strings[0], (inner_width >> 1) - (ctx.measureText(strings[0]).width >> 1), (inner_height >> 1) + 20);
			ctx.fillText(strings[1], (inner_width >> 1) - (ctx.measureText(strings[1]).width >> 1), (inner_height >> 1) + 40);
			break;
	}
}

function update() {
	if (ctx == null) return;
	if (currentState == states.PLAYING) {
		updateBall();
		if (playingField.isCleared()) {
			resetBall();
			currentState = states.WON;
		}
	}
}

function draw() {
	if (ctx == null) return;

	ctx.clearRect(0, 0, inner_width, inner_height);
	ctx.save();
	playingField.draw();

	displayScore();
	displayStateText();
	ctx.restore();

	player.draw();
	ball.draw();
}

function gameLoop() {
	update();
	draw();
	window.requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', (event) => {
	init();
});
