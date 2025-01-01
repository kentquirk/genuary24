let width = 900;
let height = 900;
let paused = false;
let img;
let images;
let pix;
let scale = 1;
let state;
let maxpixels = 50;
let pixelsPerFrame = 10;
let framecount = 0;
let force=3;

function preload() {
  images = [
    // loadImage('shinersmall.png'),
    // loadImage('sunset.png'),
    // loadImage('flower.png'),
    // loadImage('lighthouse.png'),
    loadImage('susans.png'),
  ];
  imgix = int(random(images.length));
}

function restart() {
  img = images[imgix];
  imgix = (imgix + 1) % images.length;
  pix = new Trianglify(img, 20, 50, 15, 2);
  pix.generate();
  // scale = int(min((windowWidth-200) / img.width, (windowHeight-200) / img.height));
  framecount = 0;
  state.transition("drawing");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function getHue(red, green, blue) {
  let minv = min(min(red, green), blue);
  let maxv = max(max(red, green), blue);

  if (minv == maxv) {
      return 0;
  }

  let hue = 0;
  if (maxv == red) {
      hue = (green - blue) / (maxv - minv);
  } else if (maxv == green) {
      hue = 2 + (blue - red) / (maxv - minv);
  } else {
      hue = 4 + (red - green) / (maxv - minv);
  }

  hue = hue * 60;
  if (hue < 0) hue = hue + 360;

  return int(hue);
}

function setup() {
  angleMode(RADIANS);

  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  state = new StateMachine();
  state.add("drawing", () => {
    push();
    image(img, 0, 0);
    pix.draw();
    pop();
  });


  restart();
}

class StateMachine {
  constructor() {
    this.states = {};
    this.current = '';
  }
  add(name, func) {
    this.states[name] = func;
  }
  run() {
    let state = this.states[this.current];
    if (state) {
      state();
    }
  }
  transition(state) {
    // console.log('transitioning from ' + this.current + ' to ' + state);
    this.current = state;
  }
}

class Bounds {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  contains(x, y) {
    return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
  }
}

class Triangle {
  constructor(x1, y1, x2, y2, x3, y3) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
    this.col = color(255);
  }

  setCol(col) {
    this.col = col;
  }

  draw() {
    fill(this.col);
    stroke(this.col);
    triangle(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3);
  }

  // test if point is inside triangle
  contains(px, py) {
    let b1, b2, b3;
    b1 = this.sign(px, py, this.x1, this.y1, this.x2, this.y2) < 0.0;
    b2 = this.sign(px, py, this.x2, this.y2, this.x3, this.y3) < 0.0;
    b3 = this.sign(px, py, this.x3, this.y3, this.x1, this.y1) < 0.0;
    return ((b1 == b2) && (b2 == b3));
  }

  sign(x1, y1, x2, y2, x3, y3) {
    return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  }

  // get rectangle bounding triangle
  getBounds() {
    let x = min(this.x1, this.x2, this.x3);
    let y = min(this.y1, this.y2, this.y3);
    let w = max(this.x1, this.x2, this.x3) - x;
    let h = max(this.y1, this.y2, this.y3) - y;
    return {x:x, y:y, w:w, h:h};
  }

  // get average pixel color of triangle
  getAveragePixel(img) {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    let bounds = this.getBounds();
    let imgrect = new Bounds(0, 0, img.width, img.height);
    for (let i = bounds.x; i < bounds.x + bounds.w; i++) {
      for (let j = bounds.y; j < bounds.y + bounds.h; j++) {
        if (this.contains(i, j) && imgrect.contains(i, j)) {
          let c = img.get(i, j);
          r += red(c);
          g += green(c);
          b += blue(c);
          n++;
        }
      }
    }
    if (n == 0) {
      return color(0);
    }
    return color(r / n, g / n, b / n, 155);
  }
}


class Trianglify {
  constructor(img, firstRadius, stepRadius, firstTri, stepTri) {
    this.img = img;
    this.firstRadius = firstRadius;
    this.stepRadius = stepRadius;
    this.firstTri = firstTri;
    this.stepTri = stepTri;
    this.triangles = [];
    this.radius = firstRadius;
    this.tri = firstTri;
    this.cx = img.width / 2;
    this.cy = img.height / 2;
  }

  createTri(x, y, r) {
    let angle = random(TWO_PI);
    let x1 = x + cos(angle) * r;
    let y1 = y + sin(angle) * r;
    let x2 = x + cos(angle + TWO_PI / 3) * r;
    let y2 = y + sin(angle + TWO_PI / 3) * r;
    let x3 = x + cos(angle + TWO_PI / 3 * 2) * r;
    let y3 = y + sin(angle + TWO_PI / 3 * 2) * r;
    let t = new Triangle(x1, y1, x2, y2, x3, y3);
    t.setCol(t.getAveragePixel(this.img));
    return t;
  }

  generateRing(radius, tri) {
    let triangles = [];
    let n = floor(radius * TWO_PI / tri);
    for (let i = 0; i < n; i++) {
      let angle = i * TWO_PI / n;
      let x1 = this.cx + cos(angle) * radius;
      let y1 = this.cy + sin(angle) * radius;
      let t = this.createTri(x1, y1, tri);
      triangles.push(t);
    }
    return triangles;
  }

  generate() {
    this.triangles = [];
    let maxR = sqrt(sq(this.img.width) + sq(this.img.height));
    for (let r = this.firstRadius; r < maxR/2; r += this.stepRadius) {
      this.triangles = this.triangles.concat(this.generateRing(r, this.tri));
      this.tri += this.stepTri;
    }
  }

  draw() {
    for (let t of this.triangles) {
      t.draw();
    }
  }
}

function draw() {
  clear();
  background(128);

  if (!paused) {
    state.run();
  }

  if (kb.presses(' ')) {
    paused = !paused;
  }

  if (kb.presses('r')) {
    restart();
  }


}