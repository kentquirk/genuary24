let box;
let funnel;
let dividers;
let balls;

let width = 600;
let height = 800;
let ballcount = 200;
let ballsize = 12;
let pinsize = 3;
let pinmax = 35;
let pinrows = 17;
let pinstart = pinmax - pinrows - 1;
let pintop = 200;
let wallthick = 10;
let ndividers = 35;
let divheight = 300;
let divthick = 3;

function equalSpacing(n, divwid) {
  let positions = [];
  let ngaps = n + 1;
  let gapsize = (width - wallthick*2 - divwid*n) / ngaps;
  let divstep = gapsize + divwid;

  let x = wallthick + gapsize;
  for (let d=0; d<n; d++) {
    positions.push(x);
    x += divstep;
  }
  return positions;
}

function setup() {
	new Canvas(width, height);
  world.gravity.y = 8;

  funnel = new Group();
  funnel.color = 'light blue';
  funnel.collider = 'static';

  let lf = new funnel.Sprite(width/4-8, height/8, width/2, wallthick);
  lf.rotation = 20;
  let rf = new funnel.Sprite(3*width/4+8, height/8, width/2, wallthick);
  rf.rotation = -20;

  box = new Group();
  box.color = 'blue';
  box.collider = 'static';
  box.bounciness = 0.0;

  new box.Sprite(wallthick/2, height/2, wallthick, height);
  new box.Sprite(width-wallthick/2, height/2, wallthick, height);
  new box.Sprite(width/2, height-wallthick/2, width, wallthick);

  dividers = new Group();
  dividers.color = 'pink';
  dividers.collider = 'static';
  dividers.width = divthick;
  dividers.height = divheight;
  dividers.bounciness = 0.0;

  positions = equalSpacing(ndividers, divthick);
  positions.forEach((x) => {
    new dividers.Sprite(x, height-wallthick-divheight/2);
  });

  pinpos = equalSpacing(pinmax-1, pinsize);
  let pinxsep = pinpos[1] - pinpos[0];
  let pinysep = pinxsep * Math.sqrt(3)/2;

  pins = new Group();
  pins.color = 'yellow';
  pins.diameter = pinsize;
  pins.collider = 'static';
  pins.bounciness = 0.05;
  let y = pintop;
  for (let r=pinstart; r <= pinrows+pinstart; r++) {
    y += pinysep;
    for (let p=0; p<r; p++) {
      let w = (r-1)*pinxsep;
      let x = pinxsep*p + width/2 - w/2;
      new pins.Sprite(x, y);
    }
  }

  balls = new Group();
  balls.diameter = ballsize;
  balls.color = 'green';
  balls.x = width/2;
  balls.y = height/11;
  balls.mass = 3;
  balls.velocity.y = () => random(-2, -4);
  balls.velocity.x = () => random(-1.5, 1.5);
  balls.bounciness = 0.4;

  balls.collides(pins, hitpin);
}

function hitpin(ball, pin) {
  pin.color = 'red';
}

function collect(player, gem) {
	gem.remove();
}

function draw() {
	clear();
  if (frameCount % 3 == 0 && balls.size() < ballcount) {
    new balls.Sprite();
  }

  // if balls get stuck up high, give them a little push
  balls.forEach((ball) => {
    if (ball.y < (height - divheight - wallthick) && ball.velocity.y == 0) {
      ball.velocity.y = random(0.1, 0.3);
    }
  });

}