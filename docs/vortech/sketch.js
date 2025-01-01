let paused = false;
let vortech;
let images, imgix;

class Site {
  constructor(x, y, col) {
    this.cx = x;
    this.cy = y;
    this.radius = 0;
    this.angle = 0;
    this.vangular = 0;
    // this.radius = 10;
    // this.vangular = 21.123342;
    // this.radius = random(15, 100);
    // this.angle = random(360);
    // this.vangular = random(-10, 10);
    // if (col) {
    //   this.fillColor = col;
    // } else {
    //   this.fillColor = color(random(128), random(128), random(128));
    // }
  }

  update() {
    this.angle += this.vangular % 360;
  }

  get x() {
    return this.cx + this.radius * cos(this.angle);
  }

  get y() {
    return this.cy + this.radius * sin(this.angle);
  }
}

// calculate the bounding box of a cell
function getBoundingBox(cell) {
  let xmin = width;
  let ymin = height;
  let xmax = 0;
  let ymax = 0;
  for (let halfedge of cell.halfedges) {
    let v = halfedge.getStartpoint();
    if (v.x < xmin) {
      xmin = v.x;
    }
    if (v.y < ymin) {
      ymin = v.y;
    }
    if (v.x > xmax) {
      xmax = v.x;
    }
    if (v.y > ymax) {
      ymax = v.y;
    }
  }
  return {
    x1: xmin,
    y1: ymin,
    x2: xmax,
    y2: ymax,
  };
}

class Filler {
  constructor(name, opts) {
    this.name = name;
    this.br = new BadRandom(4537937);
    this.opts = opts;
    this.functions = {
      hstripes: (cell, bbox, col) => {
        for (let y = bbox.y1; y < bbox.y2; y += this.opts?.hspacing || this.opts?.spacing || 5) {
          strokeWeight(this.opts?.hweight || this.opts?.weight || 2);
          line(bbox.x1, y, bbox.x2, y);
        }
      },
      vstripes: (cell, bbox, col) => {
        for (let x = bbox.x1; x < bbox.x2; x += this.opts?.vspacing || this.opts?.spacing || 10) {
          strokeWeight(this.opts?.vweight || this.opts?.weight || 2);
          line(x, bbox.y1, x, bbox.y2);
        }
      },
      stripes: (cell, bbox, col) => {
        let b = this.br.random(0, 100);
        if (b > (this.opts?.hpct || 50)) {
          this.functions.hstripes(cell, bbox, col);
        } else {
          this.functions.vstripes(cell, bbox, col);
        }
      },
      alphastripes: (cell, bbox, col) => {
        rect(bbox.x1, bbox.y1, bbox.x2 - bbox.x1, bbox.y2 - bbox.y1);
        let b = this.br.random(0, 100);
        if (b > (this.opts?.hpct || 50)) {
          stroke(color(0, 0, 0, 60));
          this.functions.hstripes(cell, bbox, col);
        } else {
          stroke(color(255, 255, 255, 50));
          this.functions.vstripes(cell, bbox, col);
        }
      },
      rstripes: (cell, bbox, col) => {
        let b = this.br.random(0, 100);
        if (b > (this.opts?.hpct || 50)) {
          let sp = this.br.random(5, 20);
          let wt = this.br.random(sp/2, sp-1);
          this.opts = {
            spacing: sp,
            weight: wt,
          };
          this.functions.hstripes(cell, bbox, col);
        } else {
          let sp = this.br.random(5, 20);
          let wt = this.br.random(sp/2, sp-1);
          this.opts = {
            spacing: sp,
            weight: wt,
          };
          this.functions.vstripes(cell, bbox, col);
        }
      },
      dots: (cell, bbox, col) => {
        for (let y = bbox.y1; y < bbox.y2; y += this.opts?.spacing || 10) {
          for (let x = bbox.x1; x < bbox.x2; x += this.opts?.spacing || 10) {
            strokeWeight(this.opts?.weight || 2);
            point(x, y);
          }
        }
      }
    };
  }

  reset() {
    this.br.reset();
  }

  fill(cell, bbox, col) {
    let func = this.functions[this.name];
    if (func) {
      func(cell, bbox, col);
    }
  }
}

class Vortech {
  constructor(w, h, pimg, filler, opts) {
    this.w = w || width;
    this.h = h || height;
    this.pimg = pimg;
    this.voronoi = new Voronoi();
    this.sites = [];
    this.dirty = true;
    this.diagram = null;
    this.edgeColor = color(192);
    this.edgeWeight = 2;
    this.fillColor = false; //color(128, 128, 255);
    this.siteColor = false; //color(0);
    this.siteWeight = 3;
    this.filler = new Filler(filler, opts);
  }

  addSite(x, y) {
    let px = int((x / this.w) * this.pimg.xpixels);
    let py = int((y / this.h) * this.pimg.ypixels);
    let box = 5;
    let c = this.pimg.getAveragePixel(px - box, py - box, px + box, py + box);
    this.sites.push(new Site(x, y, c));
    this.dirty = true;
  }

  perturbSites(amount) {
    for (let site of this.sites) {
      site.x += random(-amount, amount);
      site.y += random(-amount, amount);
    }
    this.dirty = true;
  }

  update() {
    if (this.dirty) {
      let bbox = {
        xl: 0,
        xr: this.w,
        yt: 0,
        yb: this.h,
      };
      this.diagram = this.voronoi.compute(this.sites, bbox);
      this.dirty = false;
    }
  }

  getColor(bbox) {
    let x1 = int((bbox.x1 / this.w) * this.pimg.xpixels);
    let y1 = int((bbox.y1 / this.h) * this.pimg.ypixels);
    let x2 = int((bbox.x2 / this.w) * this.pimg.xpixels);
    let y2 = int((bbox.y2 / this.h) * this.pimg.ypixels);
    let c = this.pimg.getAveragePixel(x1, y1, x2, y2);
    return c;
  }

  draw() {
    this.filler.reset();
    this.dirty = true;
    this.update();
    if (this.diagram) {
      for (let cell of this.diagram.cells) {
        cell.site.update();

        if (this.edgeColor !== false) {
          stroke(this.edgeColor);
          strokeWeight(this.edgeWeight);
        } else {
          noStroke();
        }

        let bbox = getBoundingBox(cell);
        if (cell.site.hasOwnProperty("fillColor")) {
          fill(cell.site.fillColor);
        } else if (this.fillColor !== false) {
          fill(this.fillColor);
        } else {
          let c = this.getColor(bbox);
          fill(c);
          // noFill();
          stroke(c);
          // fill(random(255), random(255), random(255));
        }

        if (false) {
          beginShape();
          for (let halfedge of cell.halfedges) {
            let v = halfedge.getStartpoint();
            vertex(v.x, v.y);
          }
          endShape(CLOSE);
        } else {
          push();
          let clipper = () => {
            beginShape();
            for (let halfedge of cell.halfedges) {
              let v = halfedge.getStartpoint();
              vertex(v.x, v.y);
            }
            endShape(CLOSE);
          };
          clip(clipper);
          this.filler.fill(cell, bbox, this.getColor(bbox));
          pop();
        }

        if (this.siteColor !== false) {
          fill(this.siteColor);
          noStroke();
          circle(cell.site.x, cell.site.y, this.siteWeight);
        }
      }
    }
  }
}

class BadRandom {
  constructor(seed) {
    this.originalSeed = seed;
    this.seed = seed;
    this.m = 2147483648;  // 2^31 but shift doesn't work for 2^31 in JS
    this.a = 1103515245;
    this.c = 12345;
    this.mask = 0x7fff;
  }

  reset() {
    this.seed = this.originalSeed;
  }

  random(x1, x2) {
    this.seed = (this.a * this.seed + this.c) % this.m;
    let r = (this.seed >> 16) & 0x7fff;
    return x1 + (r % (x2 - x1));
  }

  // returns a random value between 0 and len(weights) - 1
  // weighted by the values in weights.
  weightedChoice(weights) {
    let total = 0;
    for (let w of weights) {
      total += w;
    }
    let r = this.random(0, total);
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (r < sum) {
        return i;
      }
    }
    return weights.length - 1;
  }
}

class Pixelizer {
  constructor(img, maxpixels) {
    this.img = img;
    img.loadPixels();
    this.pixels = img.pixels;
    this.maxpixels = maxpixels;
    if (img.width > img.height) {
      this.xpixels = maxpixels;
      this.ypixels = int((img.height / img.width) * maxpixels);
    } else {
      this.ypixels = maxpixels;
      this.xpixels = int((img.width / img.height) * maxpixels);
    }
    this.dx = int(this.img.width / this.xpixels);
    this.dy = int(this.img.height / this.ypixels);
  }

  // gets the average pixel in the rectangle defined by the corners (x1, y1) and (x2, y2)
  // if the area of the box is bigger than 50 pixels, it will randomly sample 50 pixels.
  getAveragePixel(x1, y1, x2, y2) {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    let area = (x2 - x1) * (y2 - y1);
    if (area > 50) {
      // set a seed from the bounding box so we get the same set of samples for each box.
      let rand = new BadRandom(x1 * y1 * x2 * y2);
      for (let i = 0; i < 50; i++) {
        let rowix = int(rand.random(y1, y2)) * this.img.width;
        let ix = (int(rand.random(x1, x2)) + rowix) * 4;
        r += this.pixels[ix];
        g += this.pixels[ix + 1];
        b += this.pixels[ix + 2];
      }
      n = 50;
    } else {
      for (let j = y1; j <= y2; j++) {
        let rowix = j * this.img.width;
        for (let i = x1; i <= x2; i++) {
          let ix = (i + rowix) * 4;
          r += this.pixels[ix];
          g += this.pixels[ix + 1];
          b += this.pixels[ix + 2];
          n++;
        }
      }
    }
    return color(r / n, g / n, b / n);
  }
}

function restart() {
  let pimg = new Pixelizer(images[imgix], 640);
  let hs = random(5, 20);
  let vs = random(5, 20);
  let hw = random(hs/2, hs-1);
  let vw = random(hs/2, vs-1);
  let choices = ["hstripes", "vstripes", "stripes", "alphastripes", "dots", "rstripes"];
  let choice = choices[int(random(choices.length))];
  vortech = new Vortech(windowWidth, windowHeight, pimg, choice, {
    hspacing: hs,
    vspacing: vs,
    spacing: max(hs, vs),
    hweight: hw,
    vweight: vw,
    weight: max(hw, vw),
  });
  for (let i = 0; i < 1000; i++) {
    vortech.addSite(random(windowWidth), random(windowHeight));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function keyTyped() {
  switch (key) {
    case "p":
      paused = !paused;
      break;
    case "i":
      imgix = (imgix + 1) % images.length;
      restart();
      break;
    case "r":
      restart();
      break;
    case "P":
      vortech.perturbSites(10);
      break;
  }
}

function mouseClicked() {
  // print('clicked');
  vortech.addSite(mouseX, mouseY);
}

function preload() {
  images = [
    loadImage("images/annuals.png"),
    loadImage("images/aurora.png"),
    loadImage("images/crows.png"),
    loadImage("images/daisies.png"),
    loadImage("images/kiliSunrise.png"),
    loadImage("images/lilies.png"),
    loadImage("images/mesa.png"),
    loadImage("images/moonring.png"),
    loadImage("images/mountainPond.png"),
    loadImage("images/orangeFlower.png"),
    loadImage("images/rekyavikLight.png"),
    loadImage("images/sunset1.png"),
    loadImage("images/sunset2.png"),
    loadImage("images/tulip.png")
  ];
  imgix = int(random(images.length));
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  // willReadFrequently
  canvas.parent("sketch-holder");
  restart();
}

function draw() {
  clear();
  background(0);

  if (!paused) {
    vortech.draw();
  }
}
