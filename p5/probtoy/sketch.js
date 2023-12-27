let box;
let funnel;
let dividers;
let balls;

let width = 500;
let height = 700;
let pinsize = 5;
let pinrows = 8;
let pinxsep = 61;
let pinysep = 40;
let pintop = 180;
let wallthick = 10;
let ndividers = 8;
let divheight = 120;
let divthick = 4;

function setup() {
	new Canvas(width, height);
  world.gravity.y = 5;

  funnel = new Group();
  funnel.color = 'light blue';
  funnel.collider = 'static';

  let lf = new funnel.Sprite(width/4-10, height/8, width/2, wallthick);
  lf.rotation = 20;
  let rf = new funnel.Sprite(3*width/4+10, height/8, width/2, wallthick);
  rf.rotation = -20;

  box = new Group();
  box.color = 'blue';
  box.collider = 'static';

  new box.Sprite(wallthick/2, height/2, wallthick, height);
  new box.Sprite(width-wallthick/2, height/2, wallthick, height);
  new box.Sprite(width/2, height-wallthick/2, width, wallthick);

  dividers = new Group();
  dividers.color = 'pink';
  dividers.collider = 'static';
  dividers.width = divthick;
  dividers.height = divheight;

  let ngaps = ndividers + 1;
  let gapsize = (width - wallthick*2 - divthick*ndividers) / ngaps;
  let divstep = gapsize + divthick;

  let x = wallthick + gapsize;
  for (let d=0; d<ndividers; d++) {
    let y = height-wallthick-divheight/2;
    new dividers.Sprite(x, y);
    x += divstep;
  }

  pins = new Group();
  pins.color = 'red';
  pins.diameter = pinsize;
  pins.collider = 'static';
  for (let r=1; r <= pinrows; r++) {
    let y = pintop + r * pinysep;
    for (let p=0; p<r; p++) {
      let w = (r-1)*pinxsep;
      let x = pinxsep*p + width/2 - w/2;
      new pins.Sprite(x, y);
    }
  }

  balls = new Group();
  balls.diameter = 11;
  balls.color = 'green';
  balls.x = width/2;
  balls.y = height/12;
  balls.mass = 3;
  balls.velocity.y = () => random(-2, -4);
  balls.velocity.x = () => random(-1.5, 1.5);

	// gems = new Group();
	// gems.diameter = 10;
	// gems.x = () => random(0, canvas.w);
	// gems.y = () => random(0, canvas.h);
	// gems.amount = 80;

	// player = new Sprite();

	// player.overlaps(gems, collect);
}

function collect(player, gem) {
	gem.remove();
}

function draw() {
	clear();
  if (frameCount % 3 == 0 && balls.size() < 200) {
    new balls.Sprite();
  }

  balls.forEach((ball) => {
    if (ball.y < (height - divheight - wallthick) && ball.velocity.y == 0) {
      ball.velocity.y = random(0.1, 0.3);
    }
  });

}