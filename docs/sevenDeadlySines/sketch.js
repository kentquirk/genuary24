let paused = false;
let bgcolor;
let rowspacing;
let colspacing;
let x1, y1, x2, y2;

class SinGenerator {
  constructor(freq, amp, phase, gen) {
    this.freq = freq;
    this.amp = amp;
    this.phase = phase;
    this.generator = gen;
  }

  get(t) {
    return this.amp * sin(this.freq * t + this.phase);
  }

  gen(t) {
    return this.generator(this.get(t));
  }
}

function bgColorFromHue(hue) {
  return color(hue+50, 100, 20);
}

function fgColorFromHue(hue) {
  return color(hue+50, 100, 100);
}

function restart() {
  bgcolor = new SinGenerator(5, 50, 0, bgColorFromHue);
  xfreq = new SinGenerator(7, 15, 0, (y) => { return y+10; });
  yfreq = new SinGenerator(5, 15, 0, (y) => { return y+10; });
  x1 = new SinGenerator(10, windowWidth/4, 0, (x) => { return windowWidth / 2 + x; });
  y1 = new SinGenerator(15, windowWidth/4, 0, (y) => { return windowHeight / 2 + y; });
  let sz = windowWidth/100;
  circlesize = new SinGenerator(5, sz, 0, (y) => { return y+sz+2  ; });
  circlecolor = new SinGenerator(1.5, 50, 0, fgColorFromHue);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  colorMode(HSB, 100);
  frameRate(30);
  restart();
}

function draw() {
  clear();
  let t = millis() / 1000;
  background(bgcolor.gen(t));

  x1.freq = xfreq.gen(t);
  y1.freq = yfreq.gen(t);

  for (let i = 0; i < 150; i++) {
    fill(circlecolor.gen(t+i/2));
    let x = x1.gen(t + i / 2);
    let y = y1.gen(t + i / 2);
    circle(x, y, circlesize.gen(t + i / 2));
  }

}