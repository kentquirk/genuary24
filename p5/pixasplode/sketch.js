let width = 900;
let height = 900;
let paused = false;
let img;
let images;
let pix;
let pixels;
let scale = 1;
let state;
let maxpixels = 50;
let pixelsPerFrame = 10;
let framecount = 0;

function preload() {
  images = [
    loadImage('shinersmall.png'),
    loadImage('sunset.png'),
    loadImage('flower.png'),
    loadImage('lighthouse.png')
  ];
  imgix = int(random(images.length));
}

function restart() {
  img = images[imgix];
  imgix = (imgix + 1) % images.length;
  pix = new Pixelizer(img, maxpixels);
  scale = int(min((windowWidth-200) / img.width, (windowHeight-200) / img.height));
  framecount = 0;

  if (!pixels) {
    pixels = new Group();
  }
  pixels.removeAll();
  pixels.shape = 'circle';
  pixels.diameter = scale*min(pix.dx, pix.dy);
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
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  state = new StateMachine();
  state.add("moving", () => {
    framecount++;
    if (framecount > 500) {
      restart();
    }
  });

  state.add("drawing", () => {
    for (let i = 0; i < pixelsPerFrame; i++) {
      p = pix.nextPosition();
      if (p == null) {
        state.transition("delay");
        return;
      }
      let c = pix.getAveragePixel(p.x, p.y, 3, 3);
      let px = new pixels.Sprite()
      px.position = {x:p.x*scale+100, y:p.y*scale+100};
      px.shape = 'circle';
      px.color = c;
      px.strokeWeight = 0;
    }
  });

  state.add("delay", () => {
    framecount++;
    if (framecount > 100) {
      framecount = 0;
      state.transition("shove");
    }
  });

  state.add("shove", () => {
    for (let i = 0; i < pixels.length/2; i++) {
      let p = pixels[i];
      let h = getHue(p.color.levels[0], p.color.levels[1], p.color.levels[2]);

      p.velocity.x = cos(h);
      p.velocity.y = sin(h);
    }
    state.transition("moving");
  });

  console.log("red", getHue(255, 0,0));
  console.log("grn", getHue(0, 255, 0));
  console.log("blu", getHue(0, 0, 255));
  console.log("org", getHue(255, 128, 0));
  console.log(sin(45));
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

class Pixelizer {
  constructor(img, maxpixels) {
    this.img = img;
    this.maxpixels = maxpixels;
    if (img.width > img.height) {
      this.xpixels = maxpixels;
      this.ypixels = int(img.height / img.width * maxpixels);
    } else {
      this.ypixels = maxpixels;
      this.xpixels = int(img.width / img.height * maxpixels);
    }
    this.dx = int(this.img.width / this.xpixels);
    this.dy = int(this.img.height / this.ypixels);
    this.positions = [];
    for (let i = 0; i < this.xpixels; i++) {
      for (let j = 0; j < this.ypixels; j++) {
        this.positions.push({x:int(img.width * i / this.xpixels), y:int(img.height * j / this.ypixels)});
      }
    }
    this.shufflePositions();
    this.count = 0;
  }

  shufflePositions() {
    this.positions = shuffle(this.positions);
    this.count = 0;
  }

  nextPosition() {
    if (this.count >= this.positions.length) {
      return null;
    }
    let p = this.positions[this.count];
    this.count++;
    return p;
  }

  resetCount() {
    this.count = 0;
  }

  getAveragePixel(x, y, w, h) {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = x; i < x + w; i++) {
      for (let j = y; j < y + h; j++) {
        let c = this.img.get(i, j);
        r += red(c);
        g += green(c);
        b += blue(c);
        n++;
      }
    }
    return color(r / n, g / n, b / n);
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