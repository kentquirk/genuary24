let box;
let funnel;
let dividers;
let balls;

let width = 600;
let height = 780;
let ballcount = 360;
let ballsize = 8;
let ballcolors = ['#ff0000', '#ffff00', '#00ff00'];
let ballcolorindex = 0;
let pinsize = 3;
let pinmax = 35;
let pinrows = 17;
let pinstart = pinmax - pinrows - 1;
let pintop = 160;
let wallthick = 10;
let ndividers = pinmax;
let divheight = 320;
let divthick = 7;

function equalSpacing(n, divwid) {
  let positions = [];
  let ngaps = n + 1;
  let gapsize = (width - wallthick*2 - divwid*n) / ngaps;
  let divstep = gapsize + divwid;

  let x = wallthick + gapsize + divwid/2;
  for (let d=0; d<n; d++) {
    positions.push(x);
    x += divstep;
  }
  return positions;
}

function setup() {
	new Canvas(width, height);
  world.gravity.y = 9;

  funnel = new Group();
  funnel.color = 'black';
  funnel.collider = 'static';

  let lf = new funnel.Sprite(width/4-5, height/8, width/2, wallthick*2);
  lf.rotation = 20;
  let rf = new funnel.Sprite(3*width/4+5, height/8, width/2, wallthick*2);
  rf.rotation = -20;

  box = new Group();
  box.color = 'black';
  box.collider = 'static';
  box.bounciness = 0.0;

  new box.Sprite(wallthick/2, height/2, wallthick, height);
  new box.Sprite(width-wallthick/2, height/2, wallthick, height);
  new box.Sprite(width/2, height-wallthick/2, width, wallthick);

  dividers = new Group();
  dividers.color = '#000000';
  dividers.stroke = '#000000';
  dividers.collider = 'static';
  dividers.width = divthick;
  dividers.height = divheight;
  dividers.bounciness = 0.0;

  positions = equalSpacing(ndividers, divthick);
  positions.forEach((x) => {
    new dividers.Sprite(x, height-wallthick-divheight/2);
    new dividers.Sprite(x, height-wallthick-divheight-divthick/2, divthick, 'triangle');
  });

  pinpos = equalSpacing(pinmax, pinsize);
  let pinxsep = pinpos[1] - pinpos[0];
  let pinysep = pinxsep * Math.sqrt(3)/2;

  pins = new Group();
  pins.stroke = 'black';
  pins.color = 'black';
  pins.diameter = pinsize;
  pins.collider = 'static';
  pins.bounciness = 0.15;
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
  balls.color = () => ballcolors[ballcolorindex % ballcolors.length];
  balls.stroke = () => ballcolors[ballcolorindex % ballcolors.length];
  balls.x = width/2;
  balls.y = height/10;
  balls.mass = 3;
  balls.velocity.y = () => random(-4, -6);
  balls.velocity.x = () => random(-.5, .5);
  balls.bounciness = 0.2;

  balls.collides(pins, hitpin);
}

function hitpin(ball, pin) {
  pin.stroke = 'white';
  pin.color = 'white';
}

function collect(player, gem) {
	gem.remove();
}

function draw() {
	clear();
  background('#444444');
  if (balls.size() < ballcount && frameCount % 3 == 0) {
      new balls.Sprite();
      if (balls.size() % 120 == 0) {
        ballcolorindex++;
      }
    }

  // if balls get stuck up high, give them a little push
  balls.forEach((ball) => {
    if (ball.y < (height - divheight - wallthick) && ball.velocity.y == 0) {
      ball.velocity.y = random(0.9, 1.3);
      // ball.velocity.x = random(-0.3, 0.3);
    }
  });

  if (kb.presses(' ')) {
    ballcolorindex = int(random(0, ballcolors.length));
    balls.removeAll();
    pins.color = 'black';
    pins.stroke = 'black';
  }
}