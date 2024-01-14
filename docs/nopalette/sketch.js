let width = 900;
let height = 900;
let delay = 1;
let faderate = 0.02;
let paused = false;
let strokelevels = {
  'none': () => noStroke(),
  'black': () => stroke('black'),
  'gray': () => stroke('gray'),
  'white': () => stroke('white')
};
let monochrome = false;
let gui;
let frame;
let hash;

// things the gui manipulates have to be `var` not `let`
var strokelevel = 1;
var maxdepth = 8;
var continuous = true;
var strokeweight = 1
var strokes = ['black', 'gray', 'white', 'none'];
var userSeed = '';


let rectangles = [];

function Rectangle(x, y, w, h, depth, col, targetCol) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.depth = depth;
  this.col = col;
  this.targetCol = targetCol || col;

  this.draw = function() {
    if (this.col != this.targetCol) {
      this.col = lerpColor(this.col, this.targetCol, faderate);
    }
    fill(this.col);
    rect(this.x, this.y, this.w, this.h);
  }

  this.drawBorder = function() {
    noFill();
    rect(this.x+strokeweight/2, this.y+strokeweight/2, this.w-strokeweight, this.h-strokeweight);
  }
}

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 24bit positive integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
      let chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      // fold it to 24 bits
      hash = ((hash >> 8) ^ hash) & 0xffffff;
  }
  return hash;
}

function restart() {
  if (userSeed) {
    hash = hashCode(userSeed);
    continuous = false;
  } else {
    let now = 'colorgrid'+day()+month()+year()+hour()+minute()+second()+millis();
    hash = hashCode(now);
  }
  let elt = select('.seed');
  if (elt) {
    elt.html(hash);
  }

  randomSeed(hash);
  paused = false;
  width = windowWidth;
  height = windowHeight;
  rectangles = [];
  frame = new Rectangle(0, 0, width, height, 0, randomColor());
  rectangles.push(frame);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function saveImage() {
  saveCanvas(canvas, 'colorgrid_'+hash, 'png');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  gui = createGui("controls", this);
  gui.setPosition(windowWidth-300, 50);
  sliderRange(3, 15, 1);
  gui.addGlobals("maxdepth");
  gui.addGlobals("strokes", "continuous");
  sliderRange(1, 10, 1);
  gui.addGlobals("strokeweight");
  gui.addGlobals('userSeed');
  gui.addButton("restart", restart);
  gui.addButton("save", saveImage);

  restart();
}

function splitColor(col) {
  let which = int(random(3));
  let r = red(col);
  let g = green(col);
  let b = blue(col);
  change = random(0.4, 0.6);

  if (monochrome) {
    return [color(255, 255, 255), color(0, 0, 0)];
  }

  if (which == 0) {
    return [color(lerp(r, 255, change), g, b), color(lerp(r, 0, change), g, b)];
  } else if (which == 1) {
    return [color(r, lerp(g, 255, change), b), color(r, lerp(g, 0, change), b)];
  } else if (which == 2) {
    return [color(r, g, lerp(b, 255, change)), color(r, g, lerp(b, 0, change))];
  }
}

function randomColor() {
  if (monochrome) {
    return color(int(random(256)));
  }
  let r = int(random(256));
  let g = int(random(256));
  let b = int(random(256));
  return color(r, g, b);
}

function draw() {
  clear();
  background(0);
  strokeWeight(strokeweight);
  strokelevels[strokes]();

  if (kb.presses(' ')) {
    paused = !paused;
    if (continuous) {
      restart();
      return;
    }
  }

  if (kb.presses('c')) {
    restart();
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

  if (kb.presses('m')) {
    monochrome = !monochrome;
  }

  if (frameCount % delay == 0 && !paused) {
    tries = 0;
    let ix = int(random(rectangles.length));
    while (rectangles[ix].depth >= maxdepth) {
    // while (rectangles[ix].w < 20 || rectangles[ix].h < 20) {
      if (tries++ > 5) {
        if (!continuous) {
          paused = true;
          return;
        }
        restart();
        return;
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
      newRectangles.push(new Rectangle(x, y, w, newh, r.depth+1, r.col, c1));
      newRectangles.push(new Rectangle(x, y+newh, w, h-newh, r.depth+1, r.col, c2));
    } else {
      let neww = int(w*splitPos);
      newRectangles.push(new Rectangle(x, y, neww, h, r.depth+1, r.col, c1));
      newRectangles.push(new Rectangle(x+neww, y, w-neww, h, r.depth+1, r.col, c2));
    }

    rectangles.splice(ix, 1);
    rectangles = rectangles.concat(newRectangles);
  }

  for (let r of rectangles) {
    r.draw();
  }
  frame.drawBorder();

  if (kb.presses('!')) {
    saveImage();
  }
}