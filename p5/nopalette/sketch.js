let width = 900;
let height = 900;
let delay = 1;
let faderate = 0.02;
let paused = false;
let strokelevel = 1;
let strokelevels = [() => noStroke(), () => stroke('black'), () => stroke('gray'), () => stroke('white')];

let rectangles = [];

function Rectangle(x, y, w, h, col, targetCol) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.col = col;
  this.targetCol = targetCol || col;

  this.draw = function() {
    if (this.col != this.targetCol) {
      this.col = lerpColor(this.col, this.targetCol, faderate);
    }
    fill(this.col);
    rect(this.x, this.y, this.w, this.h);
  }
}

function restart() {
  rectangles = [];
  rectangles.push(new Rectangle(0, 0, width, height, randomColor()));
}

function setup() {
	new Canvas(width, height);
  restart();
}

function splitColor(col) {
  let which = int(random(3));
  let r = red(col);
  let g = green(col);
  let b = blue(col);
  change = random(0.4, 0.6);

  if (which == 0) {
    return [color(lerp(r, 255, change), g, b), color(lerp(r, 0, change), g, b)];
  } else if (which == 1) {
    return [color(r, lerp(g, 255, change), b), color(r, lerp(g, 0, change), b)];
  } else if (which == 2) {
    return [color(r, g, lerp(b, 255, change)), color(r, g, lerp(b, 0, change))];
  }
}

function randomColor() {
  let r = int(random(256));
  let g = int(random(256));
  let b = int(random(256));
  return color(r, g, b);
}

function draw() {
  clear();
  background(0);
  strokelevels[strokelevel % strokelevels.length]();

  if (kb.presses(' ')) {
    paused = !paused;
  }

  if (kb.presses('c')) {
    restart();
  }

  if (kb.presses('l')) {
    strokelevel++;
  }

  if (kb.presses('s')) {
    delay <<= 1;
    if (delay > 64) {
      delay = 64;
    }
  }

  if (kb.presses('f')) {
    delay >>= 1;
    if (delay == 0) {
      delay = 1;
    }
  }

  if (frameCount % delay == 0 && !paused) {
    tries = 0;
    let ix = int(random(rectangles.length));
    while (rectangles[ix].w < 20 || rectangles[ix].h < 20) {
      if (tries++ > 5) {
        restart();
      }
      ix = int(random(rectangles.length));
    }

    let r = rectangles[ix];
    let w = r.w;
    let h = r.h;
    let x = r.x;
    let y = r.y;

    let c1, c2;
    [c1, c2] = splitColor(r.col);

    let newRectangles = [];
    let splitPos = 0.5;// random(0.3, 0.7);
    let splith = random() < 0.5;
    if (h > 4*w) {
      splith = true;
    } else if (w > 4*h) {
      splith = false;
    }
    if (splith) {
      let newh = int(h*splitPos);
      newRectangles.push(new Rectangle(x, y, w, newh, r.col, c1));
      newRectangles.push(new Rectangle(x, y+newh, w, h-newh, r.col, c2));
    } else {
      let neww = int(w*splitPos);
      newRectangles.push(new Rectangle(x, y, neww, h, r.col, c1));
      newRectangles.push(new Rectangle(x+neww, y, w-neww, h, r.col, c2));
    }

    rectangles.splice(ix, 1);
    rectangles = rectangles.concat(newRectangles);
  }

  for (let r of rectangles) {
    r.draw();
  }
}