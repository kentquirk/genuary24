let paused = false;
let n = 20;
let shapes = [];
let bgcolor;
let allblack = false;

class Shape {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.rho = random(0, 2 * PI/10);
    this.size = random(10, 100);
    if (allblack) {
      this.color = color(random(10, 30));
    } else {
      this.color = color(random(255), random(255), random(255));
    }
    this.shape = random(['circle', 'square', 'triangle']);
    this.angle = random(0, 2 * PI);
    this.speed = random(-5, 5);
    this.alive = true;
  }

  update() {
    this.x += this.speed * cos(this.angle);
    this.y += this.speed * sin(this.angle);
    this.angle += this.rho;

    if (this.x > width + this.size || this.x < -this.size || this.y > height + this.size || this.y < -this.size) {
      this.alive = false;
    }
  }

  display() {
    if (!this.alive) {
      return false;
    }
    fill(this.color);
    push();
    translate(this.x, this.y);
    rotate(this.angle * 2);
    switch (this.shape) {
      case 'circle':
        ellipse(0, 0, this.size, this.size);
        break;
      case 'square':
        rect(0, 0, this.size, this.size);
        break;
      case 'triangle':
        triangle(0, 0, this.size, 0, this.size / 2, this.size);
        break;
    }
    pop();
    return true;
  }
}

function restart() {
  allblack = (random(0, 5) < 1);
  if (allblack) {
    bgcolor = color(0, 5);
    background(0);
  } else {
    let r = random(255);
    let g = random(255);
    let b = random(255);
    bgcolor = color(r, g, b, 5);
    clear();
    background(bgcolor);
  }
  shapes = [];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function mouseClicked() {
  restart();
}

function keyTyped() {
  // this only works for single character keys
  switch (key) {
    case 'b':
      allblack = !allblack;
      restart();
      break;
    case 'p':
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
  // Draw a black background with a low alpha to create a trail effect
  background(bgcolor);

  if (!paused) {
    // create a random shape every n frames
    if (frameCount % n == 0) {
      shapes.push(new Shape());
    }
    if (shapes.length > 50) {
      restart();
    }
    for (let i = shapes.length - 1; i >= 0; i--) {
      shapes[i].update();
      if (!shapes[i].display()) {
        shapes.splice(i, 1);
      }
    }
  }

}