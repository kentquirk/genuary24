let paused = false;
let particlesPerSecond = 30;
let particleLifetimeMs = 10000;
let vout = 0.5;
let fountain;

class Fountain {
  constructor(x, y, vout, spacing, lifetime) {
    this.x = x;
    this.y = y;
    this.vout = vout;
    this.spacing = spacing;
    this.lifetime = lifetime;
    this.particles = [];
    this.last = 0;
    this.angle = 0;
    this.dangle = PI/8;
    this.state = 0;
  }

  update() {
    let now = millis()
    if (now - this.last > this.spacing) {
      this.particles.push(new Particle(this.x, this.y, this.angle, this.state));
      this.state = (this.state + 1/8) % 1.0;
      this.last = now;
      this.angle += this.dangle;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.update();
      if (now - p.startTime > this.lifetime) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    for (let i=0; i < this.particles.length; i++) {
      this.particles[i].draw();
    }
  }
}

class Particle {
  constructor(x, y, angle, kind) {
    this.r = 0;
    this.cx = x;
    this.cy = y;
    this.x = x;
    this.y = y

    // kind is a value from 0 to 1
    this.vout = 1;
    this.angle = angle;
    this.dangle = (2*kind-1.0)*PI/180;
    // this.dangle = PI/180;
    this.color = color(Math.floor(255*kind));

    this.size = 40;
    this.startTime = millis();
  }

  update() {
    this.r += this.vout;
    this.angle = (this.angle + this.dangle) % (PI*2);
    this.x = this.cx + this.r * cos(this.angle);
    this.y = this.cy + this.r * sin(this.angle);
  }

  draw() {
    fill(this.color);
    // noStroke();
    stroke(255-this.color);
    // stroke(this.color);
    circle(this.x, this.y, this.size);
  }

}

function restart() {
  centerx = windowWidth/2;
  centery = windowHeight/2;
  fountain = new Fountain(centerx, centery, vout, 1000/particlesPerSecond, particleLifetimeMs);
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
  background(255, 128, 128);

  // if (kb.presses(' ')) {
  //   paused = !paused;
  // }

  // if (kb.presses('r')) {
  //   restart();
  // }

  if (!paused) {
    fountain.update();
    fountain.draw();
  }

}