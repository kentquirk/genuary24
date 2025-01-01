// a shader variable
let theShader;
let images = [];
let noisetex;
let painttex;

let texSize = 400;
let noiseprob = 0.490;
let paintfloor = 12;

function preload(){
  // load the shader
  theShader = loadShader('assets/shader.vert', 'assets/shader.frag');

  // load the images
  for (let i = 1; i <= 4; i++) {
    let img = loadImage('assets/layers.00' + i + '.png');
    images.push(img);
  }

}

function setup() {
  // disables scaling for retina screens which can create inconsistent scaling between displays
  pixelDensity(1);

  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight, WEBGL);


    // draw the noise texture
    noisetex = createGraphics(texSize, texSize);
    noisetex.background(255, 0);
    noisetex.strokeWeight(1);
    noisetex.stroke(0);
    for (let i = 0; i < texSize*texSize*noiseprob; i++) {
        noisetex.point(random(texSize), random(texSize));
    }

    // draw the paint texture
    painttex = createGraphics(texSize, texSize);
    painttex.background(0);
    strokeWeight(1);
    for (let x = 0; x < texSize; x++) {
        let y1 = random(texSize);
        let y2 = y1 + random(texSize-y1);

        painttex.stroke(paintfloor+random(255-paintfloor));
        painttex.line(x, 0, x, y1);
        painttex.stroke(paintfloor+random(255-paintfloor));
        painttex.line(x, y1, x, y2);
        painttex.stroke(paintfloor+random(255-paintfloor));
        painttex.line(x, y2, x, texSize);
    }

}

function draw() {
  clear();
  // draw the image we want to pass into the shader
  let img = createGraphics(width, height);
  img.background(255, 255);
  img.stroke(0);
  img.strokeWeight(10);
  img.fill(255, 255, 0);
  img.quad(100, 1100, 400, 1300, 220, 300, 80, 400);
  img.strokeWeight(50);
  img.line(240, 80, 500, height);
  img.strokeWeight(90);
  img.line(0, 780, width, 580);
  img.strokeWeight(20);
  img.fill(255, 0, 0);
  img.rect(280, 550, 250, 280);
  img.strokeWeight(15);
  img.fill(0, 255, 0);
  img.circle(660, 1000, 300);
  img.strokeWeight(25);
  img.fill(0, 0, 255);
  img.triangle(600, 900, 400, 300, 900, 230);

  // send resolution of sketch into shader
  theShader.setUniform('u_resolution', [width, height]);
  theShader.setUniform('noisetex', noisetex);
  theShader.setUniform('painttex', painttex);
  theShader.setUniform('tex0', img);
  let m = millis() / 10000.0;
  // let m = 1.99;
  theShader.setUniform('t', m);

  // shader() sets the active shader with our shader
  shader(theShader);

  // now draw some shapes
  rect(1, 1, 1.5, .5);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}