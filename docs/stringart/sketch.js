let spacings = [];
let numPoints = 37;
let palette = [];
let bgcolor = 0;
let stringWidth = 2;

// generate an ellipse given two focal points and a length d
// which must be at least the distance between the focal points
function generateEllipse(f1, f2, d) {
  let c = p5.Vector.add(f1, f2).div(2);
  let a = d / 2;
  let b = sqrt(d * d / 4 - (f1.x - f2.x) * (f1.x - f2.x) / 4);
  let angle = atan2(f2.y - f1.y, f2.x - f1.x);
  return { c: c, a: a, b: b, angle: angle, f1: f1, f2: f2 };
}

// draw an ellipse from the ellipse object
function drawEllipse(e) {
  ellipse(e.c.x, e.c.y, e.a * 2, e.b * 2);
}

// calculate the signed distance from a point p to a line defined by a point f and an angle
function pointLineDistance(p, f, angle) {
  let m = tan(angle);
  let b = f.y - m * f.x;
  let d = (m * p.x - p.y + b) / sqrt(m * m + 1);
  return d;
}

// binary search to find the value of t that makes pointOnEllipse(e, t) closest to
// the line defined by f and angle

// we need to find BOTH points on the ellipse that are closest to the line
// (which crosses the ellipse at 2 points) and use the one that is closest to
// the angle of the line
function findClosestSlice(e, f, angle) {
  // look at every 10 degrees and see if the point is contained within that slice
  let bestSlice = null;
  for (let t = 0; t < 360; t += 10) {
    let p1 = pointOnEllipse(e, t);
    let d1 = pointLineDistance(p1, f, angle);
    let p2 = pointOnEllipse(e, t+10);
    let d2 = pointLineDistance(p2, f, angle);
    if (d1 * d2 <= 0) {
      let slice = { t1: t, t2: t+10 };
      if (bestSlice == null || abs(t-angle) < abs(bestSlice.t1-angle)) {
        bestSlice = slice;
      }
    }
  }
  return bestSlice;
}


function findClosestPointOnEllipse(e, f, angle) {
  if (angle == 0) {
    return 0;
  }
  // find a pair of points on the ellipse that are on opposite sides of the line
  let bestSlice = findClosestSlice(e, f, angle);
  let t1 = bestSlice.t1;
  let t2 = bestSlice.t2;
  let epsilon = 0.1;
  let iterations = 0;
  while (Math.abs(t2 - t1) > epsilon) {
    let p1 = pointOnEllipse(e, t1);
    let d1 = pointLineDistance(p1, f, angle);
    let p2 = pointOnEllipse(e, t2);
    let d2 = pointLineDistance(p2, f, angle);
    if (abs(d1) < abs(d2)) {
      t2 = (t1 + t2) / 2;
    } else {
      t1 = (t1 + t2) / 2;
    }
    iterations++;
  }
  return (t1 + t2) / 2;
}

function pointOnEllipse(e, t) {
  return createVector(e.c.x + e.a * cos(t), e.c.y + e.b * sin(t));
}

function generateNailPositions(e, f, n) {
  let positions = [];
  for (let i = 0; i < n; i++) {
    let angle = i * 360 / n;
    let t = findClosestPointOnEllipse(e, f, angle);
    let p = pointOnEllipse(e, t);
    positions.push({p:p, angle:angle, t:t});
  }
  return positions;
}

function restart() {
  spacings = [13,15,23];
  palette = [color(255, 0, 0), color(255, 255, 0), color(0, 255, 0)];
  numPoints = 53;
  bgcolor = color(0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function keyTyped() {
  switch (key) {
    case '1':
      stringWidth = 1;
      break;
    case '2':
      stringWidth = 2;
      break;
    case 's':
      ns = random(2, 10);
      spacings = [];
      for (let i = 0; i < ns; i++) {
        spacings.push(int(random(2, numPoints-1)));
      }
      spacings.sort();
      break;
    case 'b':
      bgcolor = color(random(128), random(128), random(128));
      break;
    case 'n':
      numPoints = int(random(13, 101));
      if (numPoints % 2 == 0) {
        numPoints++;
      }
      break;
    case 'c':
      let nc = random(2, 10);
      palette = [];
      for (let i = 0; i < nc; i++) {
        let c = color(random(255), random(255), random(255));
        palette.push(c);
      }
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
  // noLoop();
}

function drawMandala(positions, offset) {
  for (let i = 0; i < positions.length; i++) {
    let p = positions[i].p;
    let p2 = positions[(i + offset) % positions.length].p;
    line(p.x, p.y, p2.x, p2.y);
  }
}

function drawFocusLines(e, positions) {
  for (let i = 0; i < positions.length; i++) {
    strokeWeight(8);
    point(positions[i].p.x, positions[i].p.y);
    // render the lines from the focal point to the points on the ellipse
    stroke(255, 0, 0);
    strokeWeight(2);
    line(e.f1.x, e.f1.y, positions[i].p.x, positions[i].p.y);
    // render the angle lines to the ellipse
    // stroke(0, 255, 0);
    // strokeWeight(1);
    // let a = positions[i].angle;
    // line(e.f1.x, e.f1.y, e.c.x + e.a * cos(a), e.c.y + e.b * sin(a));
  }
}

function draw() {
  clear();
  background(bgcolor);

  let f1 = createVector(width / 2 - 450, height / 2);
  let f2 = createVector(width / 2 + 450, height / 2);
  let d = 1200;
  let e = generateEllipse(f1, f2, d);

  stroke(255);
  noFill();
  strokeWeight(2);
  // drawEllipse(e);
  strokeWeight(8);
  // point(f1.x, f1.y);
  // point(f2.x, f2.y);

  let positions = generateNailPositions(e, e.f1, numPoints);

  push();
  strokeWeight(stringWidth);
  for (let i = 0; i < spacings.length; i++) {
    stroke(palette[i % palette.length]);
    drawMandala(positions, spacings[i]);
  }
  // drawFocusLines(e, positions);
  pop();

}