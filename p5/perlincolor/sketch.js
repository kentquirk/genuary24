let paused = false;
let noiseXOffset = 0.0;
let noiseYOffset = 0.0;
let noiseScale = 0.003;
let cellSize = 10;
let color1;
let color2;

let xix = 0;
let yix = 10;
let scix = 20;
let c1ix = 30;
let c2ix = 40;

function restart() {
  colorMode(HSB);
  color1 = color(0, 100, 100);
  color2 = color(150, 30, 40);
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

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function driftColor(c, ix) {
  let h = (hue(c) + map(noise(ix), 0, 1, -1, 1)) % 360;
  // let s = clamp(saturation(c) + map(noise(ix), 0, 1, -1, 1), 0, 100);
  // let b = clamp(brightness(c) + map(noise(ix), 0, 1, -1, 1), 0, 100);
  let s = saturation(c);
  let b = brightness(c);
  return color(h, s, b);
}

function draw() {
  clear();
  background(0);

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      let n = noise((x+noiseXOffset) * noiseScale, (y+noiseYOffset) * noiseScale);
      let c = lerpColor(color1, color2, n);
      fill(c);
      noStroke();
      rect(x, y, cellSize, cellSize);
    }
  }
  xix += 0.001;
  yix += 0.002;
  scix += 0.001;
  noiseXOffset = map(noise(xix), 0, 1, 0, width);
  noiseYOffset = map(noise(yix), 0, 1, 0, height);
  noiseScale = map(noise(scix), 0, 1, 0.001, 0.01);

  c1ix += 0.01;
  c2ix += 0.1;
  color1 = driftColor(color1, c1ix);
  color2 = driftColor(color2, c2ix);

  if (!paused) {
  }

}