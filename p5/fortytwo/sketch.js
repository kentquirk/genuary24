let tfs, bgcolor = 0;
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  tfs = makeTFs();
}

function makeTFs() {
  tfs = [];
  for (let n = random(5, 15); n > 0; n--) {
    switch (int(random(3))) {
      case 0:
        let sc = random(0.9, 1.1);
        tfs.push((n) => scale(Math.pow(sc, n)));
        break;
      case 1:
        let rt = random(-20, 20);
        tfs.push((n) => rotate(rt*n));
        break;
      case 2:
        let tr = createVector(random(-40, 40), random(-40, 40));
        tfs.push((n) => translate(tr));
        break;
    }
  }
  return tfs;
}

function draw() {
  background(bgcolor);
  if (frameCount % (300) === 0) {
    bgcolor = color(random(255), random(255), random(255));
    tfs = makeTFs();
  }
  translate(width / 2, height / 2);
  fill(255); stroke(0); textSize(172);
  push();
  let n = 25 + (25 * sin(360 * frameCount / 100));
  for (let tf of tfs) { tf(n); }
  text("42", -110, 70);
  pop();
}