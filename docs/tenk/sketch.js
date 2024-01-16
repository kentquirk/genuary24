let nPerSide = 22;

function restart() {
  // set the initial camera position
  camera(460, -280, 400, 0, 0, 0, 0, 1, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('sketch-holder');
  restart();
}

function draw() {
  clear();
  background(128);

  orbitControl(1, 1, 1);

  let halfSide = nPerSide / 2;

  randomSeed(0);
  let ncubes = 0;
  for (let x = 0; x < nPerSide; x++) {
    let r = map(x, 0, nPerSide, 0, 255);
    for (let y = 0; y < nPerSide; y++) {
      let g = map(y, 0, nPerSide, 0, 255);
      for (let z = 0; z < nPerSide; z++) {
        let b = map(z, 0, nPerSide, 0, 255);
        if (ncubes >= 10000 || (random() > 10000 / (nPerSide * nPerSide * nPerSide))) {
          continue;
        }
        ncubes++;
        push();
        translate((x-halfSide) * 20, (y-halfSide) * 20, (z-halfSide) * 20);
        fill(r, g, b);
        noStroke();
        sphere(map(noise(x, y, z), 0, 1, 2, 8));
        pop();
      }
    }
  }
}