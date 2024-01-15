let nrepeats = 3;

let attrs = [
  { color:'red', mass: .1},
  { color:'orange', mass: .5},
  { color:'yellow', mass: 1},
  // { color:'green', mass: 5},
  // { color:'blue', mass: 10},
  // { color:'purple', mass: 50}
];

let field;

// vars are the things the gui manipulates
var showField = false;
var rotateNodes = true;
var fieldtype = ['circular', 'random'];
var rotationSpeed = .1;
var npoints = 40;

let lastFieldtype;

function frac(x) {
  return x - floor(x);
}

class FlowNode {
  constructor(heading, mag) {
    this._heading = heading % 360;
    this._mag = mag;
  }

  get x() {
    return this.mag * cos(this.heading);
  }

  get y() {
    return this.mag * sin(this.heading);
  }

  get heading() {
    return this._heading;
  }

  get magnitude() {
    return this._mag;
  }

  rotate(degrees) {
    this._heading += degrees;
    this._heading %= 360;
  }
}

class FlowField {
  constructor(fieldType) {
    this.field = [];
    this.resolution = 20;
    this.cols = width / this.resolution;
    this.rows = height / this.resolution;
    switch (fieldType) {
      case 'circular':
        this.initCircular();
        break;
      default:
        this.initNoise();
        break;
    }
  }

  initNoise() {
    noiseSeed(random(10000));
    for (let i = 0; i < this.cols; i++) {
      let xoff = frac(nrepeats * i/this.cols);
      this.field[i] = [];
      for (let j = 0; j < this.rows; j++) {
        let yoff = frac(nrepeats * j/this.rows);
        let theta = map(noise(xoff, yoff), 0, 1, 0, 1000);
        this.field[i][j] = new FlowNode(theta, 1);
      }
    }
  }

  initCircular() {
    let center = createVector(width/2, height/2);
    for (let i = 0; i < this.cols; i++) {
      let xoff = frac(nrepeats * i/this.cols);
      this.field[i] = [];
      for (let j = 0; j < this.rows; j++) {
        let yoff = frac(nrepeats * j/this.rows);

        let pos = createVector(i * this.resolution, j * this.resolution);
        let theta = p5.Vector.sub(pos, center).heading()+90;
        // the magnitude of the vector is related to the distance from the center;
        // we don't want it to be zero at the center.
        let mag = map(dist(pos.x, pos.y, center.x, center.y), 0, dist(0, 0, width, height), 0.5, 1.5);
        this.field[i][j] = new FlowNode(theta, mag);
      }
    }
  }

  lookup(lookup) {
    let column = floor(constrain(lookup.x / this.resolution, 0, this.cols - 1));
    let row = floor(constrain(lookup.y / this.resolution, 0, this.rows - 1));
    return this.field[column][row];
  }

  display() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let fld = this.field[i][j];
        push();
        translate(i * this.resolution, j * this.resolution);
        // this is a cute way to color the field by heading
        // noStroke();
        // colorMode(HSB);
        // fill(fld.heading, 100, 100);
        // rect(0, 0, 100, 100);
        rotate(fld.heading);
        stroke(192, 50);
        line(0, 0, this.resolution, 0);
        // fill(0, 100);
        // circle(0, 0, 3);
        pop();
      }
    }
  }

  rotate(degrees) {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.field[i][j].rotate(degrees);
      }
    }
  }
}

class Points {
  constructor() {
    this.points = new Group();
    this.points.x = () => random(width);
    this.points.y = () => random(height);
    this.points.shape = 'circle';
    this.points.diameter = 15;
  }

  get length() {
    return this.points.length;
  }

  create() {
    let pt = new this.points.Sprite();
    let a = random(attrs);
    pt.color = a.color;
    pt.mass = a.mass;
  }

  applyForces(field) {
    this.points.cull(1);

    for (let point of this.points) {
      let force = field.lookup(point.position);
      let theta = force.heading;
      let mag = force.magnitude * 40;
      point.bearing = theta;
      point.applyForceScaled(mag);
    }
  }
}

function restart() {
  field = new FlowField(fieldtype);
  points = new Points;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  gui = createGui("controls", this);
  gui.setPosition(10, 50);
  gui.addGlobals("rotateNodes", "showField", "fieldtype");
  sliderRange(0, 1, .1);
  gui.addGlobals("rotationSpeed");
  sliderRange(10, 100, 5);
  gui.addGlobals("npoints");
  gui.addButton("restart", restart);

  lastFieldtype = fieldtype;

  restart();
}

function draw() {
  // clear();
  background(0, 0, 80, 16);

  if (showField) {
    field.display();
  }

  if (points.length < npoints) {
    points.create();
  }

  points.applyForces(field);
  if (rotateNodes) {
    field.rotate(rotationSpeed);
  }

  if (lastFieldtype != fieldtype) {
    lastFieldtype = fieldtype;
    restart();
  }


  if (kb.presses('f')) {
    showField = !showField;
  }

  if (kb.presses('c')) {
    fieldtype = 'circular';
    restart();
  }

  if (kb.presses('r')) {
    fieldtype = 'random';
    restart();
  }

  if (kb.presses(' ')) {
    rotateNodes = !rotateNodes;
  }

}