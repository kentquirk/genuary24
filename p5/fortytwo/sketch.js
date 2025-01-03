let tf, bgcolor = 0;
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  tf = makeTF();
}

function makeTF() {
  let sc = random(0.9, 1.1);
  let rt = random(-10, 10);
  let trX = random(-20, 20);
  let trY = random(-20, 20);
  let tf = {
    scale: (n) => { scale(Math.pow(sc, n)); },
    rotate: (n) => { rotate(rt*n); },
    translate: (n) => { translate(trX*n, trY*n); }
  };
  return tf;
}

function draw() {
  background(bgcolor);
  let maxN = 50;
  let maxT = 100;
  if (frameCount % (maxT*3) === 0) {
    bgcolor = color(random(255), random(255), random(255));
    tf = makeTF();
  }
  translate(width / 2, height / 2);
  fill(255);
  stroke(0);
  textSize(172);
  push();
  let n = maxN/2 + (maxN/2 * sin(360 * frameCount / maxT));
  for (let typ of ["rotate", "translate", "scale"]) {  // have to do these in order
    if (tf[typ]) {
        tf[typ](n);
    }
  }
  text("42", -110, 70);
  pop();
}