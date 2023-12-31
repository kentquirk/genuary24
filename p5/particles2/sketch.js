let wall, flying, still;

let width;
let height;
let wallwid;
let leftborder;
let diam;
var fallUntil;
var lastStuck;

function calcWidth(sz) {
  if (sz < 600) {
    return sz;
  } else if (sz < 800) {
    return 600;
  } else if (sz < 1000) {
    return 800;
  } else if (sz < 1200) {
    return 1000;
  } else {
    return 1200;
  }
}

function windowResized() {
  w = calcWidth(min(windowWidth, windowHeight));
  if (w == width) {
    return;
  }
  resizeCanvas(w, w);
  init(w);
}

function setupWindow() {
  w = calcWidth(min(windowWidth, windowHeight));
  let canvas = createCanvas(w, w);
  canvas.parent('sketch-holder');
  init(w);
}

function init(sz) {
  width = sz;
  height = sz;
  wallwid = sz/20;
  leftborder = sz/10;
  diam = sz/20;
  fallUntil = 0;
  lastStuck = frameCount;

  world.gravity.y = sz/50;

  if (wall) {
    wall.remove();
  }
  wall = new Sprite(width-wallwid/2, height/2, wallwid, height, 'static');

  if (!flying) {
    flying = new Group();
  }
  flying.removeAll();

  if (!still) {
    still = new Group();
  }
  still.removeAll();

  wall.color = 'gray';
  wall.name = 'wall';

  flying.shape = 'circle';
  flying.x = 0;
  flying.y = () => random(150, height - 150);
  flying.velocity.x = () => 18 + random(-5, 10);
  flying.velocity.y = () => random(-20, 10);
  flying.diameter = diam;
  flying.color = () => color(random(128, 255), random(255), 0);
  flying.name = 'flying';
  flying.cull(500);

  still.diameter = diam;
  still.shape = 'circle';
  still.velocity.x = 0;
  still.velocity.y = 0;
  still.collider = 'static';
  still.color = 'blue';
  still.name = 'still';

  wall.collides(flying, collide);
  still.collides(flying, collide);
}

function collide(moving, fixed) {
  if (fixed.name == 'flying') {
    [fixed, moving] = [moving, fixed];
  }
  if ((fixed.name == 'flying') || (moving.name != 'flying')) {
    console.log('f1');
    return; // don't collide anything but one flying, one fixed..
  }

  if (moving.x < leftborder || fixed.x < leftborder) {
    console.log('f2');
    // console.log(moving.name, moving, fixed.name, fixed);
    return;
  }

  lastStuck = frameCount;
  var b = new still.Sprite(moving.x, moving.y);
  let red = moving.color.levels[0];
  let green = moving.color.levels[1];
  b.color = color(0, green, red);
  moving.remove();
}

function setup() {
  setupWindow();
}

function draw() {
  clear();
  background(0);

  // Throw a ball every 10 frames
  if (frameCount % 10 == 0 && frameCount > fallUntil) {
    let sp = new flying.Sprite();
    if (still.collider == 'dynamic') {
      still.collider = 'static';
      wall.color = 'gray';
    }
  }

  // If we've been stuck for a while, make the still balls fall
  if ((frameCount > fallUntil) && (frameCount - lastStuck) > 150) {
    wall.color = 'red';
    still.collider = 'dynamic';
    still.velocity.x = () => random(-4, 0);
    fallUntil = frameCount + 100;
    init(width);
  }

}