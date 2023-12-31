let width = 900;
let height = 900;
let paused = false;

function restart() {
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  restart();
}

function draw() {
  clear();
  background(0);

  if (kb.presses(' ')) {
    paused = !paused;
  }

  if (kb.presses('r')) {
    restart();
  }

  if (!paused) {
  }

}