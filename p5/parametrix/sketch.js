let paused = false;

let ww = 1400;
let wh = 1000;
let blocksize = 100;
let currentFunctionBlock = null;
let animate = false;
let frame = 0;
let animationFrameTimeMs = 2000;
let totalAnimationTimeMs = 0;
let bounce = true;
let lastDrawMs = 0;
let canvas;

let sketch;

let helpers = {
  linear: (k = 1) => {
    return (t, v1, v2) => {
      if (typeof v1 !== "undefined" && typeof v2 !== "undefined") {
        return lerp(v1, v2, t);
      } else {
        return t * k;
      }
    };
  },
  quadratic: (t, v1, v2) => {
    if (typeof v1 !== "undefined" && typeof v2 !== "undefined") {
      return v1 + t * t * (v2 - v1);
    } else {
      return t * t;
    }
  },
  cubic: (t, v1, v2) => {
    if (typeof v1 !== "undefined" && typeof v2 !== "undefined") {
      return v1 + t * t * t * (v2 - v1);
    } else {
      return t * t * t;
    }
  },
  cubicBezier: (t, v1, v2) => {
    // B(t) = p1 + (1-t)^3(p0-p1) + 3(1-t)^2t(p2-p1) + t^3(p3-p2)
    // so B(t) = v1 + (1-t)^3(0-v1) + 3(1-t)^2t(v3-v1) + t^3(1-v3)
    let p1 = 0;
    let p2 = 1;
    if (typeof v1 !== "undefined" && typeof v2 !== "undefined") {
      p1 = v1;
      p2 = v2;
    }
    return p1 - p1*(1-t)*(1-t)*(1-t) + 3*(1-t)*(1-t)*t*(p2-p1) + t*t*t*(1-p2);
  },
  constant: (k = 1) => {
    return (t, v1, v2) => {
      if (v1 !== undefined) {
        return v1;
      }
      return k;
    };
  },
  passthrough: (t) => t,
};

let functionTable = [
  {name: "sin", f: () => makeSinFunctor(Math.floor(random(1,6)), 1.0)},
  {name: "cos", f: () => makeCosFunctor(Math.floor(random(1,6)), 1.0)},
  {name: "linear", f: (k) => helpers.linear(k)},
  {name: "constant", f: (k) => helpers.constant(k)},
  {name: "quadratic", f: () => helpers.quadratic},
  {name: "cubic", f: () => helpers.cubic},
  {name: "Bezier", f: () => helpers.cubicBezier},
];

function lookupFunction(name) {
  for (let i = 0; i < functionTable.length; i++) {
    if (functionTable[i].name === name) {
      return i;
    }
  }
  return 0;
}

function compose(a, b) {
  return (t) => a(b(t));
}

function adjustedComposition(a, b) {
  let f = compose(a, b);
  let ymin = -100000000;
  let ymax = 100000000;
  for (let i = 0; i <= 1; i += 0.01) {
    let y = f(i);
    ymin = Math.min(y, ymin);
    ymax = Math.max(y, ymax);
  }
  return (t) => (f(t) - ymin) / (ymax - ymin);
}

function makeSinFunctor(amplitude=1.0, frequency=1.0) {
  return (t, v1, v2) => {
    if (typeof v1 !== 'undefined' && typeof v2 !== 'undefined') {
      amplitude = v1;
      frequency = (Math.floor(24 * v2) + 1)/2 - 6;
    }
    return 0.5 + 0.5*amplitude * sin(frequency * t * 360);
  }
}

function makeCosFunctor(amplitude=1.0, frequency=1.0) {
  return (t, v1, v2) => {
    if (typeof v1 !== 'undefined' && typeof v2 !== 'undefined') {
      amplitude = v1;
      frequency = (Math.floor(24 * v2) + 1)/2 - 6;
    }
    return 0.5 + 0.5*amplitude * cos(frequency * t * 360);
  }
}

function makeLinear(at0, at1) {
  return (t) => lerp(at0, at1, t);
}

class parameter {
  constructor(name, f1, maxvalue, minvalue) {
    this.name = name;
    this.y = 0;
    this.f1 = f1
    this.f2 = new functorBlock(blocksize, lookupFunction("linear"), helpers.linear(1), 0, 1);
    this.maxvalue = maxvalue;
    this.minvalue = minvalue;
  }

  copyF1toF2() {
    this.f2.copyFrom(this.f1);
  }

  setPosition = (x, y)=> {
    this.y = y;
    this.f1.setPosition(x+50, y);
    this.f2.setPosition(x+50 + blocksize + 20, y);
  }

  plot = (animated, frame, t)=> {
    if (animated) {
      return this.animatedValueAt(frame, t);
    } else {
      return this.valueAt(t);
    }
  }

  valueAt = (t)=> {
    return lerp(this.minvalue, this.maxvalue, this.f2.valueAt(this.f1.valueAt(t)));
  }

  animatedValueAt = (frame, t)=> {
    let v1 = this.f1.valueAt(t);
    let v2 = this.f2.valueAt(t);
    return lerp(this.minvalue, this.maxvalue, lerp(v1, v2, frame));
  }

  draw = ()=> {
    stroke(0);
    strokeWeight(1);
    fill(0);
    textSize(26);
    text(this.name, 10, this.y+25);
    this.f1.draw();
    this.f2.draw();
  }

}

function linearFunctorBlock(k=1, def=0.5) {
  fix = lookupFunction("linear");
  f = helpers.linear(k);
  return new functorBlock(blocksize, fix, f, k, def);
}

function constFunctorBlock(k=1) {
  fix = lookupFunction("constant");
  f = helpers.constant(k);
  return new functorBlock(blocksize, fix, f, k);
}

function sinFunctorBlock(amplitude=1.0, frequency=1.0) {
  let fix = lookupFunction("sin");
  // we're hardcoding the function here because we need to pass in the frequency and amplitude
  let f = makeSinFunctor(amplitude, frequency);
  return new functorBlock(blocksize, fix, f, amplitude, frequency);
}

function cosFunctorBlock(amplitude=1.0, frequency=1.0) {
  let fix = lookupFunction("cos");
  // we're hardcoding the function here because we need to pass in the frequency and amplitude
  let f = makeCosFunctor(amplitude, frequency);
  return new functorBlock(blocksize, fix, f, amplitude, frequency);
}

class functorBlock {
  // f is a function mapping a value in 0-1 to a point in (0,1)-(0,1);
  // the f function is passed t and the two values v1 and v2
  constructor(size, fix, f, v1, v2) {
    this.x = 0;
    this.y = 0;
    this.size = size;
    // v1 and v2 are values from 0-1 that can be set by clicking on the block
    this.v1value = v1;
    this.v2value = v2;

    this.functionIndex = fix;
    this.f = f;
    this.fname = functionTable[fix].name;
  }

  copyFrom = (other) => {
    this.v1value = other.v1value;
    this.v2value = other.v2value;
    this.functionIndex = other.functionIndex;
    this.f = other.f;
    this.fname = other.fname;
  }

  setFunction = () => {
    this.functionIndex = (this.functionIndex + 1) % functionTable.length;
    this.f = functionTable[this.functionIndex].f();
    this.fname = functionTable[this.functionIndex].name;
    this.v1value = undefined;
    this.v2value = undefined;
  }

  setPosition = (x, y)=> {
    this.x = x;
    this.y = y;
  }

  setV1 = (v) => {
    console.log("setting v1 to ", v);
    this.v1value = v;
  }

  setV2 = (v) => {
    this.v2value = v;
  }

  valueAt = (t)=> {
    if (t < 0) {
      return this.f(0, this.v1value, this.v2value);
    } else if (t >= 1) {
      return this.f(1, this.v1value, this.v2value);
    }
    return this.f(t, this.v1value, this.v2value);
  }

  isInside(x, y) {
    return x >= this.x && x <= this.x + this.size && y >= this.y && y <= this.y + this.size;
  }

  tv(x, y) {
    return {
      t: (x - this.x) / this.size,
      v: (y - this.y) / this.size,
    };
  }

  draw() {
    stroke(0, 0, 128);
    strokeWeight(1);
    fill(255, 255, 222);
    rect(this.x, this.y, this.size, this.size);
    textSize(12);
    fill(0);
    noStroke();
    text(this.fname, this.x+1, this.y + this.size + 13);
    stroke(0);
    stroke(0);
    strokeWeight(2);
    noFill();
    beginShape(LINES);
    for (let i = 0; i < this.size; i++) {
      let t = i / this.size;
      let v = this.f(t, this.v1value, this.v2value);
      if (v < 0) {
        v = 0;
      } else if (v > 1) {
        v = 1;
      }
      vertex(this.x + i, this.y + (1 - v) * this.size);
    }
    endShape();
  }
}

// t always goes from 0 to 1 and our functions also generate values from 0 to 1
class parametricSketch {
  constructor(left, top, width, height) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.bgcolor = 0;
    this.parameters = [];
    this.addParameter("x", cosFunctorBlock(.75, .5));
    this.addParameter("y", sinFunctorBlock(.9, .75));
    this.addParameter("w", linearFunctorBlock(0, .5), 40);
    this.addParameter("r", linearFunctorBlock(0, 1), 255);
    this.addParameter("g", constFunctorBlock(.1), 255);
    this.addParameter("b", constFunctorBlock(0.9), 255);
    this.addParameter("a", linearFunctorBlock(.7, 1), 255);
    this.step = 0.001;
    this.layout();
  }

  copyAll() {
    for (let i = 0; i < this.parameters.length; i++) {
      this.parameters[i].copyF1toF2();
    }
  }

  layout() {
    let y = this.top + 20;
    for (let i = 0; i < this.parameters.length; i++) {
      this.parameters[i].setPosition(this.left - 390, y);
      y += blocksize + 30;
    }
  }

  addParameter(name, startf, maxvalue = 1, minvalue = 0) {
    let p = new parameter(name, startf, maxvalue, minvalue);
    this.parameters.push(p);
    this[name] = p.plot;
    return p;
  }

  valuesAt(animated, frame, t) {
    return {
      x: this.x(animated, frame, t),
      y: this.y(animated, frame, t),
      r: this.r(animated, frame, t),
      g: this.g(animated, frame, t),
      b: this.b(animated, frame, t),
      a: this.a(animated, frame, t),
      w: this.w(animated, frame, t),
    };
  }

  draw(animated = false, frame = 0) {
    fill(this.bgcolor);
    noStroke();
    rect(this.left, this.top, this.width, this.height);

    // main plotting loop
    let current = this.valuesAt(animated, frame, 0);
    for (let i = this.step; i <= 1; i += this.step) {
      let next = this.valuesAt(animated, frame, i);
      stroke(current.r, current.g, current.b, current.a);
      strokeWeight(current.w);
      // invert the y axis
      let y1 = 1 - current.y;
      let y2 = 1 - next.y;
      line(
        this.left + current.x * this.width,
        this.top + y1 * this.height,
        this.left + next.x * this.width,
        this.top + y2 * this.height
      );
      current = next;
    }
    for (let i = 0; i < this.parameters.length; i++) {
      this.parameters[i].draw();
    }
  }
}

function restart() {
  sketch = new parametricSketch(400, 0, 1000, 1000);
}

function windowResized() {
  restart();
}

function keyTyped() {
  switch (key) {
    case 'p':
      paused = !paused;
      break;
    case 'r':
      restart();
      break;
    case 'c':
      sketch.copyAll();
      break;
    case 'a':
      animate = !animate;
      break;
    case 'b':
      bounce = !bounce;
      break;
    case 's':
      let name = "parametrix_" + Date.now()%100000;
      save(canvas, name);
      break;
    case '>':
      animationFrameTimeMs = Math.min(10000, animationFrameTimeMs* 1.05);
      totalAnimationTimeMs = frame * animationFrameTimeMs;
      break;
    case '<':
      animationFrameTimeMs = Math.max(100, animationFrameTimeMs * 0.95);
      totalAnimationTimeMs = frame * animationFrameTimeMs;
      break;
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      animationFrameTimeMs = 1000 * (key - '0');
      totalAnimationTimeMs = frame * animationFrameTimeMs;
      break;
    case '0':
      animationFrameTimeMs = 10000;
      totalAnimationTimeMs = frame * animationFrameTimeMs;
      break;
  }
}

function findFunctionBlock(x, y) {
  for (let i = 0; i < sketch.parameters.length; i++) {
    let p = sketch.parameters[i];
    if (p.f1.isInside(mouseX, mouseY)) {
      return p.f1;
    } else if (p.f2.isInside(mouseX, mouseY)) {
      return p.f2;
    }
  }
  return null;
}

function adjustParameters() {
  let fb = findFunctionBlock(mouseX, mouseY);
  if (fb === null || fb !== currentFunctionBlock) {
    return;
  }
  tv = fb.tv(mouseX, mouseY);
  fb.setV1(1 - tv.v);
  fb.setV2(tv.t);
}

function toggleFunction() {
  let fb = findFunctionBlock(mouseX, mouseY);
  if (fb === null || fb !== currentFunctionBlock) {
    return;
  }
  fb.setFunction();
}

function mousePressed() {
  currentFunctionBlock = findFunctionBlock(mouseX, mouseY);
  switch (mouseButton) {
    case LEFT:
      adjustParameters();
      break;
    case RIGHT:
      toggleFunction();
      break;
  }
}

function mouseReleased() {
  currentFunctionBlock = null;
}

function mouseDragged() {
  if (mouseButton === LEFT) {
    adjustParameters();
  }
}

function setup() {
  canvas = createCanvas(ww, wh);
  canvas.parent('sketch-holder');
  restart();
}

function draw() {
  clear();
  if (animate) {
    background(206, 142, 255);
  } else {
    background(142, 206, 255);
  }

  let t = millis();
  let deltaTMs = t - lastDrawMs;
  lastDrawMs = t;
  if (!paused) {
    if (animate) {
      totalAnimationTimeMs += deltaTMs;
      frame = (totalAnimationTimeMs / animationFrameTimeMs) % 1;
      if (bounce) {
        if (totalAnimationTimeMs % (2 * animationFrameTimeMs) > animationFrameTimeMs) {
          frame = 1 - frame;
        }
      }
    }
  }
  sketch.draw(animate, frame);
}