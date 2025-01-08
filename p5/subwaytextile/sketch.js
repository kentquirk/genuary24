let paused = false;
let cover;

class Separations {
  constructor(wavelength, amplitude, c1, c2) {
    this.wavelength = wavelength;
    this.amplitude = amplitude;
    this.c1 = c1;
    this.c2 = c2;
  }

  getSin(x) {
    return this.amplitude * sin(360 * x / this.wavelength);
  }

  getSeparation(x) {
    return int(this.amplitude - Math.abs(this.getSin(x))) + 4;
  }

  getColor(x) {
    return (this.getSin(x) < 0) ? this.c2 : this.c1;
  }
}

function restart() {
  cover = new SeatCover();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function touchStarted() {
    paused = !paused;
}

function keyTyped() {
  switch (key) {
    case 'p':
      paused = !paused;
      break;
    case 'c':
      cover.change();
      cover.recolor();
      break;
    case 'r':
      restart();
      break;
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  frameRate(20);
  restart();
}

class SeatCover {
  constructor() {
    this.hwavelength = height / 2;
    this.hamplitude = 8;
    this.vwavelength = width / 3;
    this.vamplitude = 6;
    // this.hcolor1 = color(200, 0, 0);
    // this.hcolor2 = color(222, 122, 0);
    // this.vcolor1 = color(50, 50, 220);
    // this.vcolor2 = color(120, 120, 120);
    this.hcolor1 = color(200, 0, 0, 200);
    this.hcolor2 = color(222, 50, 50, 182);
    this.vcolor1 = color(50, 50, 220, 208);
    this.vcolor2 = color(120, 120, 120, 228);
  }

  change() {
    this.hwavelength = random([height / 2, height / 3, height / 4, height / 5]);
    this.hamplitude = int(random(12)) + 3;
    this.vwavelength = random([width / 2, width / 3, width / 4, width / 5]);
    this.vamplitude = int(random(12)) + 3;
  }

  recolor() {
    this.hcolor1 = color(random(255), random(255), random(255), 200);
    this.hcolor2 = color(random(255), random(255), random(255), 200);
    this.vcolor1 = color(random(255), random(255), random(255), 200);
    this.vcolor2 = color(random(255), random(255), random(255), 200);
  }

  draw() {
    let seph = new Separations(
      this.hwavelength,
      this.hamplitude,
      this.hcolor1,
      this.hcolor2
    );
    let sepv = new Separations(
      this.vwavelength,
      this.vamplitude,
      this.vcolor1,
      this.vcolor2
    );

    let x = sepv.getSeparation(0);
    let y = seph.getSeparation(0);
    strokeWeight(2);
    while (x < width) {
      stroke(sepv.getColor(x));
      line(x, 0, x, height);
      x += sepv.getSeparation(x);
    }
    while (y < height) {
      stroke(seph.getColor(y));
      line(0, y, width, y);
      y += seph.getSeparation(y);
    }
  }
}

function draw() {
  clear();
  background(200);

  cover.draw();
  if (!paused && frameCount % 50 == 0) {
    cover.change();
    cover.recolor();
  }
}