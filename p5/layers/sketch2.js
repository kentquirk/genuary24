let images = [];
let theShader;

function restart() {
  // set the initial camera position
  // camera(x, y, z, center_x, center_y, center_z, up_x, up_y, up_z)
  camera(0, 0, 1400, 0, 0, 0, 0, 1, 0);
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function preload() {
  // load any assets (images, sounds etc.) here
  for (let i = 1; i <= 4; i++) {
    let img = loadImage('assets/layers.00' + i + '.png');
    images.push(img);
  }
  // theShader = loadShader('assets/sheet.vert', 'assets/sheet.frag');
  theShader = loadShader('assets/shader.vert', 'assets/shader.frag');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('sketch-holder');

  restart();
}

function draw() {
  clear();
  background(0);

  orbitControl(1, 1, 1);

  for (let i = 0; i < images.length; i++) {
    let img = images[i];
    let x = 0;
    let y = 0;
    let z = i * (100);
    let w = img.width;
    let h = img.height;
    let d = 100;
    let x1 = x - w / 2;
    let x2 = x + w / 2;
    let y1 = y - h / 2;
    let y2 = y + h / 2;
    let z1 = z - d / 2;
    let z2 = z + d / 2;

    push();
    translate(x, y, z);
    // texture(img);
    // theShader.setUniform('tex0', img);
    theShader.setUniform('u_resolution', [width, height]);
    shader(theShader);

    beginShape();
    vertex(x1, y1, z1, 0, 0);
    vertex(x2, y1, z1, w, 0);
    vertex(x2, y2, z1, w, h);
    vertex(x1, y2, z1, 0, h);
    endShape(CLOSE);
    pop();
  }

}