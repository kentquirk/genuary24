let paused = false;
let continuous = true;

let nrows = 25;
let ncols = 25;

const dirt = 0;
const grass = 1;
const rabbit = 2;
const wolf = 3;

// --- probabilities ---
const dirtToGrass = 0.2;
const grassToRabbit = 0.01;
const successfulMating = 0.5;
const rabbitClusterAttractsWolf = 0.5;
const rabbitClusterSize = 3;
const wolfHungerMax = 16;

let biosphere;

class Graph {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.colors = {}
    this.data = {};
  }

  track(name, color) {
    this.colors[name] = color;
    this.data[name] = [];
  }

  ymax() {
    let ymax = 0;
    for (let name in this.data) {
      let values = this.data[name];
      let m = max(values);
      if (m > ymax) {
        ymax = m;
      }
    }
    return ymax;
  }

  addDataPoint(name, value) {
    if (!this.data[name]) {
      console.log('unknown name', name);
      this.data[name] = [];
    }
    this.data[name].push(value);
    if (this.data[name].length > this.width) {
      this.data[name].shift();
    }
  }

  draw() {
    fill(0, 128, 0);
    rect(this.x, this.y, this.width, this.height);
    let ymax = this.ymax();
    for (let name in this.data) {
      let values = this.data[name];
      let color = this.colors[name];
      stroke(color);
      let y = this.y + this.height;
      let lastx = this.x;
      let lasty = y;
      for (let i = 0; i < this.width && i < values.length; i++) {
        let x = this.x + i;
        let value = values[i];
        let y1 = y - value * this.height / ymax;
        line(lastx, lasty, x, y1);
        lastx = x;
        lasty = y1;
      }
    }
  }

}

class Animal {
  constructor(typ, x, y, attrs = {}) {
    this.typ = typ;
    this.x = x;
    this.y = y;
    this.attrs = attrs;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(cellWidth, cellHeight, diameter) {
    // console.log('drawing', this.typ, this.x, this.y, this.attrs);
    fill(this.attrs.color);
    circle(this.x * cellWidth+cellWidth/2, this.y * cellHeight+cellHeight/2, diameter);
  }

  at(x, y) {
    return this.x == x && this.y == y;
  }
}

class Species {
  constructor(typ, attrs) {
    this.typ = typ;
    this.members = [];
    this.attrs = attrs;
  }

  cloneEmpty() {
    let newSpecies = new Species(this.typ, this.attrs);
    return newSpecies;
  }

  spawn(px, py, attrs) {
    let x = px;
    let y = py;
    // we should have checked this before calling spawn but let's be safe
    if (this.at(x, y)) {
      return false;
    }
    // console.log('spawning', this.typ, x, y, "a", attrs, "t", this.attrs);
    if (!attrs || attrs.length == 0) {
      // console.log('using default attrs', this.attrs);
      attrs = this.attrs;
    }
    this.members.push(new Animal(this.typ, x, y, attrs));
    return true;
  }

  iterate(f) {
    this.members.forEach((animal) => {
      f(animal);
    });
  }

  // returns the first animal of this species at x,y or null
  at(x, y) {
    for (let animal of this.members) {
      if (animal.at(x, y)) {
        return animal;
      }
    }
    return null;
  }

  // indicates whether any animal of this species is at x,y
  occupiedAt(x, y) {
    for (let animal of this.members) {
      if (animal.at(x, y)) {
        return true;
      }
    }
    return false;
  }

  // returns a list of pairs that contain an animal of this species anywhere in the list of x,y pairs
  existsIn(list) {
    return list.filter(elt => {
      let [x, y] = elt;
      return this.occupiedAt(x, y);
    });
  }

  // if there is an animal of this species at x,y, remove it and return true
  // otherwise return false
  kill(x, y) {
    let index = this.members.findIndex((animal) => {
      return animal.at(x, y);
    });
    if (index > -1) {
      this.members.splice(index, 1);
      return true;
    }
    return false;
  }

  draw(cellWidth, cellHeight, diameter) {
    this.members.forEach((animal) => {
      animal.draw(cellWidth, cellHeight, diameter);
    });
  }
}

class Biosphere {
  constructor(gw, gh) {
    this.gridwidth = gw;
    this.gridheight = gh;
    this.grid = [];
    this.rabbits = new Species(rabbit, {color: 'white'});
    this.wolves = new Species(wolf, {color: 'black', hunger: 0});
    this.generationCount = 0;

    this.colors = ['#804000', 'green', 'white', 'black'];
    this.landGenerators = [
      // () => { return dirt },
      // () => { return grass },
      () => { return random([dirt, dirt, dirt, grass, grass]) },
      // () => { return random([empty, empty, empty, empty, grass, rabbit]) },
      // () => { return random([empty, empty, empty, empty, grass, grass, grass, rabbit, rabbit, wolf]) }
    ];
    this.animalGenerators = [
      // () => { return {rabbit: 0, wolf: 0} },
      // () => { return {rabbit: 0.05, wolf: 0} },
      () => { return {rabbit: 0.05, wolf: 0.01} },
      // () => { return {rabbit: 0.1, wolf: 0.01} },
    ];
  }

  init() {
    this.graph = new Graph(windowWidth/2+20, 20, 200, 200);
    this.graph.track('rabbits', this.colors[rabbit]);
    this.graph.track('wolves', this.colors[wolf]);

    this.rabbits = new Species(rabbit, {color: this.colors[rabbit]});
    this.wolves = new Species(wolf, {color: this.colors[wolf], hunger: 0});
    this.grid = this.makeEmptyGrid();

    let lgen = random(this.landGenerators);
    let animals = random(this.animalGenerators)();

    this.iterateGrid(this.grid, (i, j) => {
        if (random() < animals.rabbit) {
          this.rabbits.spawn(i, j);
          // console.log('init rabbit', i, j);
          // console.log(this.rabbits.members);
        } else if (random() < animals.wolf) {
          this.wolves.spawn(i, j);
          // console.log('init wolf', i, j);
        }
        return lgen();
      });
    this.generationCount = 0;
  }

  animal(i, j) {
    let r = this.rabbits.at(i, j);
    if (r) {
      // console.log('found rabbit at', i, j);
      return r;
    }
    let w = this.wolves.at(i, j);
    if (w) {
      // console.log('found wolf at', i, j);
      return w;
    }
    return null;
  }

  draw() {
    background(80);
    let cellWidth = int(windowWidth / this.gridwidth / 2);
    let cellHeight = int(windowHeight / this.gridheight / 2);
    let diameter = min(cellWidth, cellHeight) - 2;

    for (let i = 0; i < this.gridwidth; i++) {
      for (let j = 0; j < this.gridheight; j++) {
        let cell = this.grid[i][j];
        fill(this.colors[cell]);
        rect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
      }
    }
    // console.log('rabbits', this.rabbits.members.length, 'wolves', this.wolves.members.length);
    // console.log('rabbits', this.rabbits.members);
    this.wolves.draw(cellWidth, cellHeight, 2*diameter/3);
    this.rabbits.draw(cellWidth, cellHeight, diameter/2);

    this.graph.draw();
  }

  neighbors(x, y) {
    let neighbors = [];
    for (let i = -1; i <= 1; i++) {
      let xi = x + i;
      if (xi < 0 || xi >= this.gridwidth) {
        continue;
      }
      for (let j = -1; j <= 1; j++) {
        let yj = y + j;
        if (yj < 0 || yj >= this.gridheight) {
          continue;
        }
        if (i == 0 && j == 0) {
          continue;
        }
        neighbors.push([xi, yj]);
      }
    }
    return neighbors;
  }

  // returns an array of counts of each type of cell
  // in the 8 cells surrounding x,y (not including x,y)
  // any animals in the 8 cells are counted as well
  // indepenently of the land state of the cells
  // so the total may be more than 8
  counts(x, y) {
    let counts = [0, 0, 0, 0];
    this.neighbors(x, y).forEach(([xi, yj]) => {
      let cell = this.grid[xi][yj];
      let animal = this.animal(xi, yj);
      if (animal) {
        counts[animal.typ]++;
      }
      counts[cell]++;
    });
    return counts;
  }

  chooseLike(x, y, state) {
    let choices = [];
    this.neighbors(x, y).forEach(([xi, yj]) => {
      if (this.grid[xi][yj] == state) {
        choices.push([xi, yj]);
      }
    });
    if (choices.length == 0) {
      return [null, null];
    }
    return random(choices);
  }

  makeEmptyGrid() {
    let grid = [];
    for (let i = 0; i < this.gridwidth; i++) {
      grid.push([]);
      for (let j = 0; j < this.gridheight; j++) {
        grid[i].push(dirt);
      }
    }
    return grid;
  }

  iterateGrid(g, f) {
    for (let i = 0; i < this.gridwidth; i++) {
      for (let j = 0; j < this.gridheight; j++) {
        let nextcell = f(i, j);
        if (nextcell != null) {
          g[i][j] = nextcell;
        }
      }
    }
  }

  generation() {
    // track data for the graph
    this.graph.addDataPoint('rabbits', this.rabbits.members.length);
    this.graph.addDataPoint('wolves', this.wolves.members.length);

    let newGrid = this.makeEmptyGrid();
    let newRabbits = this.rabbits.cloneEmpty();
    let newWolves = this.wolves.cloneEmpty();

    // grow things
    this.iterateGrid(newGrid, (i, j) => {
      let cell = this.grid[i][j];
      let animal = this.animal(i, j);
      let counts = this.counts(i, j);
      let nextcell = cell;
      if (animal?.typ == rabbit) {
        // rabbits eat the grass they are on
        nextcell = dirt;
      }
      switch (cell) {
        case dirt:
          if (random() < dirtToGrass) {
            nextcell = grass;
          }
          break;
        case grass:
          if ((counts[grass] == 8) && !animal) {
            if (random() < grassToRabbit) {
              // console.log('grass spawned rabbit at', i, j);
              newRabbits.spawn(i, j);
            }
          } else if ((counts[rabbit] == 2) && !animal) {
            if (random() < successfulMating) {
              // console.log('rabbits mated at', i, j);
              newRabbits.spawn(i, j);
            }
          }
          break;
      }
      // console.log('checking for rabbit cluster at', i, j, counts);
      // if rabbits are clustered, try to spawn a wolf at a corner
      if (animal?.typ == rabbit && counts[rabbit] > rabbitClusterSize && random() < rabbitClusterAttractsWolf) {
        let x = random([0, this.gridwidth - 1]);
        let y = random([0, this.gridheight - 1]);
        if (!newWolves.at(x, y) && !newRabbits.at(x, y)) {
          // console.log('spawning wolf at', x, y, 'due to rabbit cluster at', i, j);
          newWolves.spawn(x, y);
        }
      }
      return nextcell;
    });

    this.wolves.iterate((wolf) => {
      let x = wolf.x;
      let y = wolf.y;
      let nbrs = this.neighbors(x, y);
      let rabbits = this.rabbits.existsIn(nbrs);
      if (rabbits.length > 0) {
        let [xi, yj] = random(rabbits);
        // kill the wabbit in this world so it doesn't move
        this.rabbits.kill(xi, yj);
        let attrs = wolf.attrs;
        attrs.hunger = 0;
        newWolves.spawn(xi, yj, attrs);
        // console.log('wolf ate rabbit at', xi, yj);
        return;
      }
      // if it didn't eat and its hunger is more than 4, it dies
      if (wolf.attrs.hunger > wolfHungerMax) {
        // console.log('wolf died of hunger at', x, y);
        return;
      }

      // try to move randomly a couple of times
      for (let i = 0; i < 3; i++) {
        let [xi, yj] = random(nbrs);
        if (!newRabbits.at(xi, yj) && !newWolves.at(xi, yj)) {
          let attrs = wolf.attrs;
          attrs.hunger++;
          newWolves.spawn(xi, yj, attrs);
          return;
        }
      }
      // if we get here, the wolf is stuck
      // so kill it off
      // console.log('wolf got stuck and died at', x, y);
      return;
    });

    this.rabbits.iterate((rabbit) => {
      let x = rabbit.x;
      let y = rabbit.y;
      // if a rabbit is sitting on grass, it stays there to eat it
      if (this.grid[x][y] == grass) {
        newRabbits.spawn(x, y, rabbit.attrs);
        return;
      }
      // try to move a few times
      for (let i = 0; i < 5; i++) {
        let [xi, yj] = this.chooseLike(x, y, grass);
        if (xi == null) {
          // there's nowhere to go, so rabbit dies
          // console.log('rabbit died on dirt at', x, y);
          return;
        }
        if (!newRabbits.at(xi, yj) && !newWolves.at(xi, yj)) {
          // console.log('rabbit moved from', x, y, 'to', xi, yj);
          newRabbits.spawn(xi, yj, rabbit.attrs);
          return;
        }
        // console.log('rabbit stuck at', x, y, "tried", xi, yj);
      }
    });

    this.grid = newGrid;
    this.rabbits = newRabbits;
    this.wolves = newWolves;

    // console.log('generation', this.generationCount, 'rabbits', this.rabbits.members.length, 'wolves', this.wolves.members.length);

    this.generationCount++;
  }
}

function restart() {
  biosphere.init();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  biosphere = new Biosphere(nrows, ncols);
  restart();
}

function draw() {
  clear();
  background(0);
  frameRate(10);
  translate(20, 10);

  biosphere.draw();

  if (kb.presses(' ')) {
    paused = !paused;
  }

  if (kb.presses('r')) {
    restart();
  }

  if (kb.presses('c')) {
    continuous = !continuous;
  }

  if (kb.presses('g') || continuous) {
    biosphere.generation();
  }

  if (!paused) {
  }

}