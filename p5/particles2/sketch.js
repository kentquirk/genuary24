let wall, flying, still;

let width = 900;
let height = 900;
let wallwid = 40;
let leftborder = 100;
let diam = 50;
var fallUntil = 0;
var lastStuck = 0;


function setup() {
	new Canvas(width, height);
	world.gravity.y = 20;

	wall = new Sprite(width-wallwid/2, height/2, wallwid, height, 'static');
  wall.color = 'gray';
  wall.name = 'wall';

  flying = new Group();
  flying.shape = 'circle';
  flying.x = 0;
  flying.y = () => random(150, height - 150);
  flying.velocity.x = () => 18 + random(-5, 10);
  flying.velocity.y = () => random(-20, 10);
  flying.diameter = diam;
  flying.color = () => color(random(128, 255), random(255), 0);
  flying.name = 'flying';
  flying.cull(1000);

  still = new Group();
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

function draw() {
  clear();
  background(0);

  if (frameCount % 10 == 0 && frameCount > fallUntil) {
    let sp = new flying.Sprite();
    if (still.collider == 'dynamic') {
      still.collider = 'static';
      wall.color = 'gray';
    }
  }

  if ((frameCount > fallUntil) && (frameCount - lastStuck) > 150) {
    wall.color = 'red';
    still.collider = 'dynamic';
    still.velocity.x = () => random(-4, 0);
    fallUntil = frameCount + 100;
  }

}