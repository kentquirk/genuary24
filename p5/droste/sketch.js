let currentColor;
let size;
let microbes;
let maxMicrobes;
let target;
let zoomframes;
let zoomcount;
let translation = {x: 0, y: 0};
let scaleFactor = 1;
let border = 0.8;

function restart(sz) {
  size = sz;

  if (!microbes) {
    microbes = new Group();
  }
  microbes.removeAll();

  microbes.shape = 'circle';
  microbes.diameter = () => random(10, 20);
  microbes.stroke = () => randomColor();
  microbes.strokeWeight = 4;
  microbes.color = color(0);
  microbes.cull(100);
  microbes.drag = 1;

  maxMicrobes = random(20, 40);
  zoomframes = 50;
  statemachine.transition('grow');
  scaleFactor = 1;
  translation = {x: 0, y: 0};
}

let statemachine = {
  states: {},
  add: function(name, func) {
    this.states[name] = func;
  },
  run: function() {
    let state = this.states[this.current];
    if (state) {
      state();
    }
  },
  current: '',
  transition: function(state) {
    // console.log('transitioning from ' + this.current + ' to ' + state);
    this.current = state;
  }
}

function randomColor() {
  let r = int(random(256));
  let g = int(random(256));
  let b = int(random(256));
  return color(r, g, b);
}

function calcSize(sz) {
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

function edge(n) {
  if (n == 0) { // left
    return {x: 0, y: random(size)};
  } else if (n == 1) { // right
    return {x: size, y: random(size)};
  } else if (n == 2) { // top
    return {x: random(size), y: 0};
  } else {  // bottom
    return {x: random(size), y: size};
  }
}

function vel(n) {
  let minv = 5;
  let maxv = 10;
  if (n == 0) {
    return {x: random(minv, maxv), y: random(minv/10, maxv/10)};
  } else if (n == 1) {
    return {x: -random(minv, maxv), y: random(minv/10, maxv/10)};
  } else if (n == 2) {
    return {x: random(minv/10, maxv/10), y: random(minv, maxv)};
  } else {
    return {x: random(minv/10, maxv/10), y: -random(minv, maxv)};
  }
}

function windowResized() {
  w = calcSize(min(windowWidth, windowHeight));
  if (w == width) {
    return;
  }
  resizeCanvas(w, w);
  restart(w);
}

function setup() {
  let w = calcSize(min(windowWidth, windowHeight));
  let canvas = createCanvas(w, w);
  canvas.parent('sketch-holder');
  currentColor = randomColor();

  // throw a bunch of microbes at the screen
  statemachine.add('grow', () => {
    if (frameCount % 10 == 0) {
      makeMicrobe();
    }
    if (microbes.length > maxMicrobes) {
      statemachine.transition('drift');
    }
  });

  // wait for the microbes to mostly stop moving
  statemachine.add('drift', () => {
    let vavg = microbes.reduce((acc, m) => {
      acc.x += abs(m.velocity.x);
      acc.y += abs(m.velocity.y);
      return acc;
    });
    vavg.x /= microbes.length;
    vavg.y /= microbes.length;
    if (vavg.x < 0.1 && vavg.y < 0.1) {
      let targets = microbes.filter(m => m.x > size/4 && m.x < size*3/4 && m.y > size/4 && m.y < size*3/4);
      target = random(targets);
      zoomcount = 0;
      statemachine.transition('center');
    }
  });

  // move the target microbe to the center
  statemachine.add('center', () => {
    target.velocity.x = 0;
    target.velocity.y = 0;
    let dx = size/2-target.x;
    let dy = size/2-target.y;
    let x = lerp(0, dx, zoomcount/zoomframes);
    let y = lerp(0, dy, zoomcount/zoomframes);
    translation = {x, y};
    if (zoomcount++ > zoomframes) {
      zoomcount = 0;
      translation = {x: dx, y: dy};
      statemachine.transition('zoom');
    }
  });

  // zoom in on the target microbe
  statemachine.add('zoom', () => {
    let targetscale = (size) / target.diameter;
    zoomscale = zoomcount/zoomframes;
    let s = lerp(1, targetscale, zoomscale*zoomscale);
    scaleFactor = s;
    if (zoomcount++ > zoomframes) {
      zoomcount = 0;
      statemachine.transition('restart');
    }
  });

  // restart the whole process
  statemachine.add('restart', () => {
    currentColor = target.stroke;
    console.log("restart", currentColor.levels);
    restart(size);
    statemachine.transition('grow');
  });

  restart(w);
}

function makeMicrobe() {
  let m = new microbes.Sprite();
  corner = int(random(4));
  m.x = edge(corner).x;
  m.y = edge(corner).y;
  m.velocity.x = vel(corner).x;
  m.velocity.y = vel(corner).y;
  // m.stroke = m.color;
}

function draw() {
  clear();

  // draw the lens
  stroke(currentColor);
  fill(0);
  strokeWeight(55);
  circle(size/2, size/2, size*border);

  // now clip our drawing to the lens
  push();
  beginClip();
  fill(0);
  strokeWeight(0);
  circle(size/2, size/2, size * border);
  endClip();

  // draw the lens again inside the clip
  fill(0);
  circle(size/2, size/2, size * border);

  // scaling needs to happen around 0, so translate, scale, and untranslate
  translate(size/2, size/2);
  scale(scaleFactor);
  translate(-size/2, -size/2);
  // then we can do the translation of the microbes
  translate(translation.x, translation.y);

  // do whatever state we're in
  statemachine.run();

  microbes.draw();
  pop();

}