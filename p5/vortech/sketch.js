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
    // this.radius = random(15, 150);
    // this.angle = random(360);
    // this.vangular = random(-10, 10);
    if (col) {
      this.fillColor = col;
    } else {
      this.fillColor = color(random(128), random(128), random(128));
    }
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

class Vortech {
  constructor(w, h, pimg) {
    this.w = w || width;
    this.h = h || height;
    this.pimg = pimg;
    this.voronoi = new Voronoi();
    this.sites = [];
    this.dirty = true;
    this.diagram = null;
    this.edgeColor = color(192);
    this.edgeWeight = 2;
    this.fillColor = color(128, 128, 255);
    this.siteColor = color(0);
    this.siteWeight = 3;
  }

  addSite(x, y) {
    let px = int(x/this.w * this.pimg.xpixels);
    let py = int(y/this.h * this.pimg.ypixels);
    let box = 5;
    let c = this.pimg.getAveragePixel(px-box, py-box, px+box, py+box);
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
        yb: this.h
      };
      this.diagram = this.voronoi.compute(this.sites, bbox);
      this.dirty = false;
    }
  }

  draw() {
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

        if (cell.site.hasOwnProperty('fillColor')) {
          fill(cell.site.fillColor);
        } else if (this.fillColor !== false) {
          fill(this.fillColor);
        } else {
          fill(random(255), random(255), random(255));
        }

        beginShape();
        for (let halfedge of cell.halfedges) {
          let v = halfedge.getStartpoint();
          vertex(v.x, v.y);
        }
        endShape(CLOSE);

        if (this.siteColor !== false) {
          fill(this.siteColor);
          noStroke();
          circle(cell.site.x, cell.site.y, this.siteWeight);
        }
      }
    }
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
      this.ypixels = int(img.height / img.width * maxpixels);
    } else {
      this.ypixels = maxpixels;
      this.xpixels = int(img.width / img.height * maxpixels);
    }
    this.dx = int(this.img.width / this.xpixels);
    this.dy = int(this.img.height / this.ypixels);
  }

  // gets the average pixel in the rectangle defined by the corners (x1, y1) and (x2, y2)
  getAveragePixel(x1, y1, x2, y2) {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
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
    return color(r / n, g / n, b / n);
  }
}


function restart() {
  let pimg = new Pixelizer(images[imgix], 640);
  vortech = new Vortech(windowWidth, windowHeight, pimg);
  for (let i = 0; i < 100; i++) {
    vortech.addSite(random(windowWidth), random(windowHeight));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function keyTyped() {
  switch (key) {
    case 'p':
      paused = !paused;
      break;
    case 'r':
      restart();
      break;
    case 'P':
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
    loadImage('images/Artistic - 1 of 14.png'),
    loadImage('images/Artistic - 13 of 14.png'),
    loadImage('images/Artistic - 3 of 14.png'),
    loadImage('images/Artistic - 8 of 14.png')
  ];
  imgix = int(random(images.length));
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  restart();
}

function draw() {
  clear();
  background(120);

  if (!paused) {
    vortech.draw();
  }

}