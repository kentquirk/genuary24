let paused = false;

function restart() {
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function keyTyped() {
  switch (key) {
    case ' ':
      paused = !paused;
      break;
    case 'r':
      restart();
      break;
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  restart();
}

function draw() {
  clear();
  background(0);

  if (!paused) {
  }

}