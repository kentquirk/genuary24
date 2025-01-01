let paused = false;
let gridsize = 50;
let grid;
let renderGrid = false;
let renderVectors = false;
let renderNoise = true;


class GridItem {
  constructor() {
    this.angle = random(360);
    this.velocity = random(-1, 1);
  }

  update(x) {
    this.angle = this.angle + this.velocity*x % 360;
  }
}


// w and h are the number of intersections in the grid including the edges
// gridsize is the size of each cell in pixels (the gradient vector is always unit length)
// when we render we can fit this grid to our canvas
class Grid {
  constructor(nx, ny, cellSize) {
    this.grid = [];
    this.cellSize = cellSize;
    this.nx = nx;
    this.ny = ny;
    this._create();
    this.gridColor = color(0);
    this.vectorColor = color(255, 0, 0);
    this.gridbg = color(80);
    this.pluscolor = color(255, 0, 0);
    this.minuscolor = color(255, 255, 0);
    this.smoothness = 2;
  }

  _create() {
    for (let i = 0; i <= this.nx; i++) {
      this.grid.push([]);
      for (let j = 0; j <= this.ny; j++) {
        this.grid[i].push(new GridItem());
      }
    }
  }

  interpolate(a, b, t) {
    switch (this.smoothness) {
      case 0:
        return a + (b - a) * t;
        break;
      case 1:
        return a + (b - a) * t * t * (3 - 2 * t);
        break;
      case 2:
        return a + (b - a) * t * t * t * (t * (6 * t - 15) + 10);
        break;
    }
  }

  update(x) {
    for (let i = 0; i <= this.nx; i++) {
      for (let j = 0; j <= this.ny; j++) {
        this.grid[i][j].update(x);
      }
    }
  }

  // rotateAnglesBy(deg) {
  //   for (let i = 0; i <= this.nx; i++) {
  //     for (let j = 0; j <= this.ny; j++) {
  //       this.grid[i][j].angle = (this.grid[i][j].angle + deg) % 360;
  //     }
  //   }
  // }

  jiggleAnglesBy(deg) {
    for (let i = 0; i <= this.nx; i++) {
      for (let j = 0; j <= this.ny; j++) {
        let r = random(0, deg);
        this.grid[i][j].angle = (this.grid[i][j].angle + r) % 360;
      }
    }
  }

  // calculate the dot product of the gradient vector at a given point
  dotAt(x, y) {
    let i = floor(x / this.cellSize);
    let j = floor(y / this.cellSize);
    let dx = (x % this.cellSize) / this.cellSize;
    let dy = (y % this.cellSize) / this.cellSize;
    // get all the gradient vectors at the corners of the cell
    let v00 = createVector(cos(this.grid[i][j].angle), sin(this.grid[i][j].angle));
    let v10 = createVector(cos(this.grid[i + 1][j].angle), sin(this.grid[i + 1][j].angle));
    let v01 = createVector(cos(this.grid[i][j + 1].angle), sin(this.grid[i][j + 1].angle));
    let v11 = createVector(cos(this.grid[i + 1][j + 1].angle), sin(this.grid[i + 1][j + 1].angle));
    // calculate the dot product between the gradient vector and the vector from the corner to the point
    let dot00 = v00.dot(createVector(dx, dy));
    let dot10 = v10.dot(createVector(dx - 1, dy));
    let dot01 = v01.dot(createVector(dx, dy - 1));
    let dot11 = v11.dot(createVector(dx - 1, dy - 1));
    // interpolate the dot products
    let dot0 = this.interpolate(dot00, dot10, dx);
    let dot1 = this.interpolate(dot01, dot11, dx);
    return this.interpolate(dot0, dot1, dy);
  }

  renderBackground(width, height) {
    let offsetx = (width - this.nx * this.cellSize) / 2;
    let offsety = (height - this.ny * this.cellSize) / 2;
    fill(this.gridbg);
    noStroke();
    rect(offsetx, offsety, this.nx * this.cellSize, this.ny * this.cellSize);
  }

  // this renders the grid itself to the canvas
  // centered in width and height
  renderGrid(width, height) {
    let offsetx = (width - this.nx * this.cellSize) / 2;
    let offsety = (height - this.ny * this.cellSize) / 2;
    stroke(this.gridColor);
    strokeWeight(1);
    for (let gx = 0; gx <= grid.nx; gx++) {
      let x = gx * this.cellSize;
      line(offsetx + x, offsety, offsetx + x, offsety + this.ny * this.cellSize);
    }
    for (let gy = 0; gy <= grid.ny; gy++) {
      let y = gy * this.cellSize;
      line(offsetx, offsety + y, offsetx + this.nx * this.cellSize, offsety + y);
    }
  }

  // this renders the gradient vectors to the canvas
  renderVectors(width, height) {
    let offsetx = (width - this.nx * this.cellSize) / 2;
    let offsety = (height - this.ny * this.cellSize) / 2;
    for (let i = 0; i <= this.nx; i++) {
      for (let j = 0; j <= this.ny; j++) {
        let x = i * this.cellSize;
        let y = j * this.cellSize;
        let angle = this.grid[i][j].angle;
        let v = createVector(cos(angle), sin(angle));
        stroke(this.vectorColor);
        strokeWeight(2);
        line(x + offsetx, y + offsety, x + offsetx + v.x * this.cellSize / 2, y + offsety + v.y * this.cellSize / 2);
      }
    }
  }

  paletteLerp(palette, w) {
    let i = floor(w * (palette.length - 1));
    let j = ceil(w * (palette.length - 1));
    let a = palette[i];
    let b = palette[j];
    return lerpColor(a, b, w * (palette.length - 1) - i);
  }

  renderNoise(width, height, res) {
    let offsetx = (width - this.nx * this.cellSize) / 10;
    let offsety = (height - this.ny * this.cellSize) / 10;
    let xmax = this.nx * this.cellSize;
    let ymax = this.ny * this.cellSize;
    strokeWeight(res);
    for (let x = 0; x < xmax; x+=res) {
      for (let y = 0; y < ymax; y+=res) {
        let n = this.dotAt(x, y);
        let w = map(n, -1, 1, 0, 1);
        // stroke(lerpColor(this.minuscolor, this.pluscolor, w));
        // point(x + offsetx, y + offsety);
        let pal = [
          color('black'),
          color('red'),
          color('orange'),
          color('yellow'),
          color('white'),
          color('green'),
          color('blue'),
          color('indigo'),
          color('violet'),
          color('black')
        ];
        // pal = [this.minuscolor, color(0), this.pluscolor];
        fill(this.paletteLerp(pal, w));
        noStroke();
        rect(x + offsetx, y + offsety, res, res);
      }
    }
  }
}

function restart(w, h) {
  grid = new Grid(5, 5, 120);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart(windowWidth, windowHeight);
}

function keyTyped() {
  switch (key) {
    case 'p':
      paused = !paused;
      break;
    case 'r':
      restart(windowWidth, windowHeight);
      break;
    case 'g':
      renderGrid = !renderGrid;
      break;
    case 'v':
      renderVectors = !renderVectors;
      break;
    case 'n':
      renderNoise = !renderNoise;
      break;
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight*.7);
  canvas.parent('sketch-holder');
  restart(windowWidth, windowHeight);
}

function draw() {
  clear();
  background(128);
  // grid.renderBackground(windowWidth, windowHeight);
  if (renderNoise) grid.renderNoise(windowWidth, windowHeight, 10);
  if (renderGrid) grid.renderGrid(windowWidth, windowHeight);
  if (renderVectors) grid.renderVectors(windowWidth, windowHeight);

  if (!paused) {
    grid.update(5);
  }

}