let paused = false;
let scene;

class Cuboid3d {
  constructor(pos, siz, col) {
    this.pos = pos;
    this.siz = siz;
    this.color = col;
    this.points = [];
    this.edges = [];
    this.faces = [];
    this.colorChanges = [null, color(255), color(0)];
    this.create(pos, siz);
  }

  create(pos, siz) {
    let x = pos[0];
    let y = pos[1];
    let z = pos[2];
    let dx = siz[0];
    let dy = siz[1];
    let dz = siz[2];
    this.points = [
      [x, y, z],
      [x - dx, y, z],
      [x - dx, y + dy, z],
      [x, y + dy, z],
      [x, y, z - dz],
      [x - dx, y, z - dz],
      [x - dx, y + dy, z - dz],
      [x, y + dy, z - dz]
    ];
    this.edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7]
    ];
    // only draw the front-facing faces
    this.faces = [
      [0, 1, 2, 3],
      // [4, 5, 6, 7],
      // [0, 1, 5, 4],
      [2, 3, 7, 6],
      [0, 3, 7, 4],
      // [1, 2, 6, 5]
    ];
  }

  move(newpos) {
    this.create(newpos, this.siz);
  }

  depth(camera) {
    // we can calculate depth from only the first point
    let pt = this.points[0];
    return (camera[0] - pt[0]) ** 2 + (camera[1] - pt[1]) ** 2 + (camera[2] - pt[2]) ** 2;
  }

  draw(projector) {
    let points2d = this.points.map(p => projector(p));
    stroke(128);
    for (let edge of this.edges) {
      let p1 = points2d[edge[0]];
      let p2 = points2d[edge[1]];
      line(p1.x, p1.y, p2.x, p2.y);
    }
    for (let f = 0; f < this.faces.length; f++) {
      let c = this.color;
      if (this.colorChanges[f] !== null) {
        c = lerpColor(c, this.colorChanges[f], 0.3);
      }
      fill(c);
      stroke(255);
      let face = this.faces[f];
      beginShape();
      for (let ix of face) {
        let p = points2d[ix];
        vertex(p.x, p.y);
      }
      endShape(CLOSE);
    }
  }
}

class GridObject {
  constructor(gx, gz, h, col, cellsize) {
    this.pos = {x: gx, z: gz};
    this.path = [];
    this.cellsize = cellsize;
    let pos = [-gx * cellsize, 0, -gz * cellsize];
    let siz = [cellsize, h*cellsize, cellsize];
    this.cuboid = new Cuboid3d(pos, siz, col);
  }

  depth(camera) {
    return this.cuboid.depth(camera);
  }

  draw(terp, projector) {
    if (this.path.length > 0) {
      let p1 = [-this.pos.x * this.cellsize, 0, -this.pos.z * this.cellsize];
      let p2 = [-this.path[0].x * this.cellsize, 0, -this.path[0].y * this.cellsize];
      let pos = [lerp(p1[0], p2[0], terp), 0, lerp(p1[2], p2[2], terp)];
      this.cuboid.move(pos);
    }
    this.cuboid.draw(projector);
    if (terp >= 1 && this.path.length > 0) {
      this.pos = {x: this.path[0].x, z: this.path[0].y};
      this.path.shift();
    }
    return this.path.length > 0;  // we still have work to do
  }
}

class IsoScene {
  constructor(cellsize, gridsize) {
    this.cellsize = cellsize || 100;
    this.gridsize = gridsize || 10;
    this.objects = [];
    this.floor = {x: 0, y: 0, z: 0, dx: -this.cellsize*this.gridsize, dz: -this.cellsize*this.gridsize};
    this.floorgrid = -this.cellsize;
    // Isometric projection matrix; y is up, right-handed coordinate system.
    // The camera is out along the line from the origin to [1000, 1000, 1000].
    let m = new Matrix([3,3]);
    let root2 = Math.sqrt(2);
    let root3 = Math.sqrt(3);
    let root6 = Math.sqrt(6);
    m.setRow(0, Vec.fromList([-root3, 0, root3]));
    m.setRow(1, Vec.fromList([1, -2, 1]));
    m.setRow(2, Vec.fromList([root2, -root2, root2]));
    m.mulNum(1 / root6);
    m.transpose();
    this.projectionMatrix = m;
  }

  addCuboid(gx, gz, h, col) {
    let obj = new GridObject(gx, gz, h, col, this.cellsize);
    this.objects.push(obj);
  }

  projectPoint = (p) => {
    let point = new Matrix([3,1]);
    point.setRow(0, Vec.fromList(p));
    return point.mulMat(this.projectionMatrix).getRow(0);
  }

  randomEmptyCell() {
    let gx = int(random(this.gridsize));
    let gz = int(random(this.gridsize));
    for (let obj of this.objects) {
      if (obj.pos.x == gx && obj.pos.z == gz) {
        return this.randomEmptyCell();
      }
    }
    return {x: gx, y: gz};
  }

  startObjectMoving() {
    // create a graph of an empty grid (1 means empty)
    let cells = [];
    for (let r = 0; r < this.gridsize; r++) {
      cells.push(Array(this.gridsize).fill(1));
    }
    // block off the objects on the grid
    for (let obj of this.objects) {
      cells[obj.pos.x][obj.pos.z] = 0;
    }
    let graph = new Graph(cells);
    // now choose a random object to move
    let obj = random(this.objects);
    let start = graph.grid[obj.pos.x][obj.pos.z];;
    let endpos = this.randomEmptyCell();
    let end = graph.grid[endpos.x][endpos.y];

    obj.path = astar.search(graph, start, end);
    // console.log("Path:");
    // let pnode = (node) => {
    //   console.log("   ", node.x, node.y);
    // };
    // pnode(start);
    // for (let node of obj.path) {
    //   pnode(node);
    // }
    // pnode(end);
  }


  draw(terp) {
    // first, draw the floor
    fill(50, 20, 10);
    stroke(64);
    let floor = this.floor;
    beginShape();
    let p1 = this.projectPoint([floor.x, 0, floor.z]);
    let p2 = this.projectPoint([floor.x + floor.dx, 0, floor.z]);
    let p3 = this.projectPoint([floor.x + floor.dx, 0, floor.z + floor.dz]);
    let p4 = this.projectPoint([floor.x, 0, floor.z + floor.dz]);
    vertex(p1.x, p1.y);
    vertex(p2.x, p2.y);
    vertex(p3.x, p3.y);
    vertex(p4.x, p4.y);
    endShape(CLOSE);

    // draw the grid
    stroke(64);
    // the floor is in negative space, so we draw the grid in the negative direction
    for (let x = floor.x; x >= floor.x + floor.dx; x += this.floorgrid) {
      let p1 = this.projectPoint([x, 0, floor.z]);
      let p2 = this.projectPoint([x, 0, floor.z + floor.dz]);
      line(p1.x, p1.y, p2.x, p2.y);
    }
    for (let z = floor.z; z >= floor.z + floor.dz; z += this.floorgrid) {
      let p1 = this.projectPoint([floor.x, 0, z]);
      let p2 = this.projectPoint([floor.x + floor.dx, 0, z]);
      line(p1.x, p1.y, p2.x, p2.y);
    }

    // sort by distance from camera
    let camera = [this.cellsize * 100, this.cellsize * 100, this.cellsize * 100];
    this.objects.sort((a, b) => {
      return b.depth(camera) - a.depth(camera);
    });

    let objectInMotion = false;
    for (let obj of this.objects) {
      objectInMotion |= obj.draw(terp, this.projectPoint);
    }
    if (!objectInMotion) {
      this.startObjectMoving();
    }
  }
}

function restart() {
  palette = ["f18f01","048ba8","2e4057","99c24d","df2d2e"].map(c => color("#" + c));

  let gridsize = 12;
  scene = new IsoScene(width/20, gridsize);

  for (let i = 0; i < 20; i++) {
    let x = int(random(gridsize));
    let z = int(random(gridsize));
    let h = int(random(1, 5));
    let col = random(palette);
    scene.addCuboid(x, z, h, col);
  }
  console.log(scene);
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
    case 'm':
      scene.startObjectMoving();
      break;
    case 'r':
      restart();
      break;
    }
  }

  function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('sketch-holder');
    // frameRate(50);
    restart();
  }

  function draw() {
    clear();
    background(0);
    let movesteps = 20;

    if (!paused) {
      translate(width / 2, height);
      stroke(255);
      strokeWeight(2);
      // line(0, 0, 100, 0);
      // generate all the numbers from 0 to and including movesteps
      scene.draw(((frameCount % (movesteps+1))) / movesteps);
    }

}