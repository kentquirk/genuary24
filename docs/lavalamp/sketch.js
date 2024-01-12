let paused = false;

var nPoints = 60;
let k = 10;  // >3 and < nPoints
const radius = 5;
var initialVelocity = 0;
var minAttractDistance = 150;
var maxRepelDistance = 50;
var repelForce = 0.4;
var attractForce = 0.7;
var drawMesh = false;
var drawForces = true;
var drawHull = false;
var drawPoints = true;
let lava;
let gui;
let canvas;

// monkeypatch arrays so we can search them
Array.prototype.containsArray = function (val) {
  var hash = {};
  for (var i = 0; i < this.length; i++) {
    hash[this[i]] = i;
  }
  return hash.hasOwnProperty(val);
}

class Lava {
  constructor(n, x, y, w, h) {
    let beads = new Group();
    beads.x = () => int(random(x, x + w));
    beads.y = () => int(random(y, y + h));
    beads.velocity.x = () => random(-initialVelocity, initialVelocity);
    beads.velocity.y = () => random(-initialVelocity, initialVelocity);
    beads.shape = 'circle';
    beads.diameter = radius * 2;
    beads.color = 'white';
    beads.mass = 1;
    beads.autoDraw = false;
    for (let i = 0; i < n; i++) {
      new beads.Sprite();
    }
    this.beads = beads;
  }

  draw() {
    this.beads.draw();
  }

  removeAll() {
    this.beads.removeAll();
  }

  getPoints() {
    let points = [];
    for (let i = 0; i < this.beads.length; i++) {
      points.push([this.beads[i].x, this.beads[i].y]);
    }
    return points;
  }

  getBeads() {
    return this.beads;
  }

  applyForces() {
    for (let i = 0; i < this.beads.length; i++) {
      dist = this.beads[i].position.dist(createVector(mouseX, mouseY));
      this.beads[i].attractTo(mouseX, mouseY, 10 / dist);
    }
  }

  getHull() {
    let points = this.getPoints();
    return concaveHull.calculate(points, k);
  }

}

function restart() {
  if (lava) {
    lava.removeAll();
  }
  lava = new Lava(nPoints, windowWidth / 4, windowHeight / 4, windowWidth / 2, windowHeight / 2)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  gui = createGui("controls", this);
  gui.setPosition(windowWidth-300, 50);
  gui.addGlobals('drawForces', 'drawMesh', 'drawHull', 'drawPoints');
  sliderRange(100, 500, 10);
  gui.addGlobals('minAttractDistance');
  sliderRange(10, 100, 10);
  gui.addGlobals('maxRepelDistance');
  sliderRange(0, 3, 0.1);
  gui.addGlobals('repelForce', 'attractForce');
  sliderRange(10, 100, 10);
  gui.addGlobals('nPoints');
  gui.addButton("restart", restart);

  restart();
}

function pointForces(p1, p2) {
  let dist = p1.position.dist(p2.position);
  if (dist > minAttractDistance) {
    p1.attractTo(p2, attractForce);
    p2.attractTo(p1, attractForce);
    return "attract"
  } else if (dist < maxRepelDistance) {
    p1.attractTo(p2, -repelForce);
    p2.attractTo(p1, -repelForce);
    return "repel"
  }
  return "none"
}

function draw() {
  // frameRate(10);
  clear();
  background(0);

  let points = lava.getBeads();
  // let triangles = Delaunator.from(points).triangles;
  let triangles = Delaunator.from(points, (point) => point.x, (point) => point.y).triangles;


  // Draw the triangles
  for (let i = 0; i < triangles.length; i += 3) {
    stroke(255);
    strokeWeight(1);
    // fill(0, 255, 0, 100);
    noFill();
    if (drawMesh) {
      triangle(
        points[triangles[i]].x, points[triangles[i]].y,
        points[triangles[i + 1]].x, points[triangles[i + 1]].y,
        points[triangles[i + 2]].x, points[triangles[i + 2]].y
      );
    }
    for (j = 1; j <= 2; j++) {
      r = pointForces(points[triangles[i]], points[triangles[i + j]]);
      switch (r) {
        case "attract":
          stroke(255, 255, 0, 120);
          break;
        case "repel":
          stroke(0, 255, 0, 120);
          break;
        default:
          stroke(0, 0);
      }
      strokeWeight(5);
      if (drawForces) {
        line(
          points[triangles[i]].x, points[triangles[i]].y,
          points[triangles[i + j]].x, points[triangles[i + j]].y,
        );
      }
    }
    strokeWeight(1);
    stroke(0, 0, 255);
  }

  // // Draw the hull
  if (drawHull) {
    let hull = lava.getHull();
    stroke(255, 0, 0);
    strokeWeight(10);
    strokeJoin(ROUND);
    fill(255, 0, 0, 80);
    beginShape();
    for (let i = 0; i < hull.length; i++) {
      vertex(hull[i][0], hull[i][1]);
    }
    endShape(CLOSE);
  }
  noStroke();

  // Draw the points
  if (drawPoints) {
    lava.draw();
  }

  if (kb.presses('m')) {
    drawMesh = !drawMesh;
  }

  if (kb.presses('f')) {
    drawForces = !drawForces;
  }

  if (kb.presses('h')) {
    drawHull = !drawHull;
  }

  if (kb.presses(' ')) {
    paused = !paused;
  }

  if (kb.presses('r')) {
    restart();
  }

  if (!paused) {
  }

}