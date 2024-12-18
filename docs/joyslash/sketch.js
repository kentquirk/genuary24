let paused = false;

let nlines = 20;
// needs to be 3N+1
let npoints = 20;
let layerrange = 2.0;
let border = 20;

let layers = [];

let bgcolor;
let strokecolor;
let color1;
let color2;
let strokeindex = 0;
let strokecolors;

let drawStroke = true;
let randomLayers = true;

class Layer {
  constructor(y) {
    this.y = y;
    this.genPoints();
  }

  genPoints() {
    let points = [];
    for (let i = 0; i < npoints; i++) {
      let x = 1.0 * i / (npoints - 1);
      let y = random(-layerrange, 0);
      points.push(createVector(x, y));
    }
    this.points = points;
  }

  buildFrom(other) {
    console.log('building from', other);
    let points = [];
    for (let i = 0; i < npoints; i++) {
      let x = other.points[i].x + random(-.0/npoints, .2/npoints);
      let y = other.points[i].y + random(-layerrange/4, layerrange/4);
      points.push(createVector(x, y));
    }
    this.points = points;
  }

  px(ix) {
    return border + this.points[ix].x * (windowWidth-(2*border));
  }

  py(ix) {
    return border+this.y + this.points[ix].y * (windowHeight-(2*border)) / nlines;
  }

draw() {
    function cv(x, y) {
      curveVertex(x, y);
    }
    beginShape();
    let w = windowWidth;
    let lineSpacing = windowHeight / nlines;
    vertex(windowWidth-border, windowHeight-border);
    vertex(windowWidth-border, windowHeight-border);
    vertex(border, windowHeight-border);
    vertex(border, windowHeight-border);
    // vertex(border, this.py(0));
    cv(this.px(0), this.py(0));
    for (let i = 1; i < this.points.length; i++) {
      cv(this.px(i), this.py(i));
    }
    vertex(this.px(npoints-1), this.py(npoints-1));
    endShape();
  }
}

function restart(w, h) {
  let lineSpacing = h / nlines;
  layers = [];
  let base = new Layer(0);
  layers.push(base);
  for (let pos = 0; pos < h-lineSpacing; pos += lineSpacing) {
    let l = new Layer(pos);
    if (!randomLayers) {
      l.buildFrom(layers[layers.length-1])
    }
    layers.push(l);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart(windowWidth, windowHeight);
}

function setup() {
  colorMode(HSB, 100);
  bgcolor = color(0, 0, 0);
  strokecolor = color(0, 0, 50);
  color1 = color(20, 100, 20);
  color2 = color(40, 70, 90);
  strokecolors = [color(0, 0, 0), color(0, 0, 50), color(0, 0, 100)];

  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  restart(windowWidth, windowHeight);
  // noLoop();
}

function keyPressed() {
  switch (key) {
    case 'r':
      restart(windowWidth, windowHeight);
      break;
    case '1':
      color1 = color(random(100), random(100), 100);
      break;
    case '2':
      color2 = color(random(100), random(100), 100);
      break;
    case 'l':
      nlines += 1;
      restart(windowWidth, windowHeight);
      break;
    case 'L':
      nlines -= 1;
      restart(windowWidth, windowHeight);
      break;
    case 's':
      drawStroke = !drawStroke;
      break;
    case 'S':
      strokecolor = color(random(100), random(100), 100);
      break;
    case 'h':
      layerrange *= 1.1;
      restart(windowWidth, windowHeight);
      break;
    case 'H':
      layerrange *= 0.9;
      restart(windowWidth, windowHeight);
      break;
    case 'z':
      randomLayers = !randomLayers;
      restart(windowWidth, windowHeight);
      break;
    case 'g':
      color1 = color(0, 0, 0);
      color2 = color(0, 0, 90);
      break;
    case 'G':
      strokecolor = strokecolors[strokeindex];
      strokeindex = (strokeindex + 1) % strokecolors.length;
      break;
  }
}

function draw() {
  clear();

  background(bgcolor);

  stroke(strokecolor);
  strokeWeight(2);
  noFill();
  for (let i = 0; i < layers.length; i++) {
    let l = layers[i];
    let fc = lerpColor(color1, color2, i / nlines);
    fill(fc);
    if (!drawStroke) {
      stroke(fc);
    }
    l.draw();
  }

  if (!paused) {
  }

}