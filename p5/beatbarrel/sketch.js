canvasWidth = 600;
canvasHeight = 600;
let paused = false;
let mic, recorder;
let soundFile;
let soundFiles = [];
let sm;
let ui;

let nBands = 4;
let innerDiameter = 80;
let outerDiameter = 560;
let bands;

let looptime = 4.0; // seconds
let framerate = 60;
let npoints = looptime * framerate;

class Band {
  constructor(index, inner, outer, fill, stroke) {
    this.index = index;
    this.innerDiam = inner;
    this.outerDiam = outer;
    this.fill = fill;
    this.stroke = stroke;
    this.volume = 0;
    this.data = [];
    this.soundfile = null;

    for (let i = 0; i < npoints; i++) {
      this.data.push(random(1));
    }
  }

  draw(f = this.fill, s = this.stroke) {
    push();
    beginClip({invert: true});
    fill(0);
    noStroke();
    circle(0, 0, this.innerDiam);
    endClip();
    stroke(s);
    fill(f);
    circle(0, 0, this.outerDiam);
    circle(0, 0, this.innerDiam+1);
    fill(s);
    this.drawData();
    pop();
  }

  drawData() {
    let n = this.data.length;
    let angle = TWO_PI / n;
    for (let i = 0; i < n; i++) {
      let middle = (this.innerDiam + this.outerDiam) / 4;  // middle of the band
      let innerRadius = map(this.data[i] * 0.9, 1, 0, this.innerDiam/2, middle);
      let outerRadius = map(this.data[i] * 0.9, 0, 1, middle, this.outerDiam/2);
      let j = (i + 1) % n;
      let cosT1 = cos(i * angle);
      let sinT1 = sin(i * angle);
      let cosT2 = cos(j * angle);
      let sinT2 = sin(j * angle);
      beginShape();
      vertex(innerRadius * cosT1, innerRadius * sinT1);
      vertex(outerRadius * cosT1, outerRadius * sinT1);
      vertex(outerRadius * cosT2, outerRadius * sinT2);
      vertex(innerRadius * cosT2, innerRadius * sinT2);
      endShape(CLOSE);
    }
  }

  isInside(x, y) {
    let r = dist(x, y, width/2, height/2);
    console.log('x, y, r = ', x, y, r);
    return r > this.innerDiam/2 && r < this.outerDiam/2;
  }
}

class Bands {
  constructor(n, innerDiam, outerDiam) {
    this._recording = -1; // index of the band being recorded
    this._playing = []; // all tracks being played
    this.bands = [];
    let bandWidth = (outerDiam - innerDiam) / nBands;
    for (let i = 0; i < n; i++) {
      let inner = innerDiam + i * bandWidth;
      let outer = inner + bandWidth;
      this.bands.push(new Band(i, inner, outer, color(192), color(0)));
    }
    this.mic = null;
    this.recorder = null;
  }

  setupRecorder() {
    if (!this.mic) {
      this.mic = new p5.AudioIn();
      this.mic.start();
    }
    if (!this.mic.enabled) {
      return false;
    }
    if (this.recorder) {
      return true;  // we are already set up
    }
    this.recordedData = [];
    this.soundfile = null;
    // create a sound recorder
    this.recorder = new p5.SoundRecorder();
    // connect the mic to the recorder
    this.recorder.setInput(mic);
    return true;
  }

  get recording() {
    return this._recording != -1;
  }

  startRecording(i) {
    userStartAudio();
    if (!this.setupRecorder()) {
      console.log('mic not enabled!!');
      return false;
    }
    this._recording = i;
    this.recordedData = [];
    this.soundfile = new p5.SoundFile();
    this.recorder.record(this.soundfile);
    return true;
  }

  stopRecording() {
    this.recorder.stop();
    this.soundfile.loop(0, undefined, undefined, 0, looptime);
    this.bands[this._recording].soundfile = this.soundfile;
    this.bands[this._recording].data = this.normalize(this.recordedData);
    console.log('recorded data len = ', this.recordedData.length);
    this._recording = -1;
  }

  normalize(data) {
    let min = Math.min(...data);
    let max = Math.max(...data);
    return data.map(v => map(v, min, max, 0, 1));
  }

  tick(v) {
    if (this.recording) {
      this.recordedData.push(this.mic.getLevel());
    }
  }

  draw() {
    for (let b of this.bands) {
      if (b.index == this._recording) {
        b.draw(color(255, 0, 0), color(255));
      } else {
        b.draw();
      }
    }
  }

  mousePressed() {
    for (let b of this.bands) {
      if (b.isInside(mouseX, mouseY)) {
        this._recording = b.index;
        return false; // prevent default
      }
    }
  }

  bind() {
    return this.mousePressed.bind(this);
  }

}

// A simple state machine that also stores properties for each state
class StateMachine {
  constructor() {
    this.states = {};
    this.current = '';
  }

  add(name, run, props={}, entry=() => {}, exit=() => {}) {
    this.states[name] = {run: run, props:props, entry:entry, exit:exit};
  }

  get props() {
    return this.states[this.current].props;
  }

  run() {
    let state = this.states[this.current];
    if (state) {
      state.run();
    }
  }

  transition(state) {
    let currentState = this.states[this.current];
    if (currentState) {
      currentState.exit();
    }
    // console.log('transitioning from ' + this.current + ' to ' + state);
    this.current = state;
    let newState = this.states[state];
    if (newState) {
      newState.entry();
    }
  }
}

function setupStates() {
  let track = 0;
  let start = () => {
    if (!bands.startRecording(track)) {
      console.log('mic not enabled!');
      return;
    }
    track = (track + 1) % nBands;
    sm.transition('stopRecording');
  }

  let stop = () => {
    bands.stopRecording();
    sm.transition('playback');
  }

  let playback = () => {
    sm.transition('startRecording');
  }

  sm = new StateMachine();

  sm.add('startRecording', start, { bg: 'blue', label:'start', msg:'tap to record' });
  sm.add('stopRecording', stop, { bg: 'red', label:'stop', msg:'recording! tap to stop' });
  sm.add('playback', playback, { bg: 'green', label:'play', msg:'tap to play' });
  sm.transition('startRecording');
  return sm;
}

function setupStates2() {
  let record = () => {
    if (mic.enabled) {
      // record to our p5.SoundFile
      recorder.record(soundFile);
    }
  }
  let stop = () => {
    // stop recorder and
    // send result to soundFile
    recorder.stop();
  }
  let play = () => {
    soundFile.play(); // play the result!
  }
  let loop = () => {
    soundFile.loop(); // play the result!
  }
  let pause = () => {
    soundFile.pause(); // play the result!
  }
}


class UIButton {
  constructor(x, y, w, h, typ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h || w;
    this._type = typ || 'rect';
    this._fill = color(255);
    this._stroke = color(0);
    this._label = '';
    this._action = () => {};
    return this;
  }

  type(t) {
    this._type = t;
    return this;
  }

  fill(c) {
    console.log('setting fill to ', c);
    this._fill = c;
    return this;
  }

  stroke(c) {
    this._stroke = c;
    return this;
  }

  action(f) {
    this._action = f;
    return this;
  }

  label(txt) {
    this._label = txt;
    return this;
  }

  draw() {
    fill(this._fill);
    stroke(this._stroke);
    switch (this._type) {
      case 'rect':
        rect(this.x, this.y, this.w, this.h);
        break;
      case 'ellipse':
        ellipse(this.x+this.w/2, this.y+this.h/2, this.w, this.h);
        break;
      case 'circle':
        circle(this.x+this.w/2, this.y+this.w/2, this.w);
        break;
    }
    fill(this._stroke);
    text(this._label, this.x + this.w / 2, this.y + this.h / 2);
  }

  isInside(x, y) {
    return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
  }
}

class UI {
  constructor() {
    this.controls = [];
  }

  draw() {
    for (let control of this.controls) {
      control.draw();
    }
  }

  addControl(control) {
    this.controls.push(control);
    return control;
  }

  mousePressed() {
    for (let control of this.controls) {
      if (control.isInside(mouseX, mouseY)) {
        control._action();
        return false; // prevent default
      }
    }
  }

  bind() {
    return this.mousePressed.bind(this);
  }
}

function setup() {
  let cnv = createCanvas(canvasWidth, canvasHeight);
  cnv.parent('sketch-holder');

  textAlign(CENTER, CENTER);

  sm = setupStates();

  frameRate(framerate);

  bands = new Bands(nBands, innerDiameter, outerDiameter);

  textSize(24);
  ui = new UI();
  let btn = new UIButton(10, 10, 100, 50, 'ellipse');
  btn.label(sm.props.label).fill(sm.props.bg).action(() => {
    canvasPressed();
    btn.label(sm.props.label);
    btn.fill(sm.props.bg);
  });
  ui.addControl(btn);

  cnv.mousePressed(() => {
    ui.mousePressed();
    bands.mousePressed();
  });
}

function canvasPressed() {
  sm.run();
}

// function restart() {
//   // ensure audio is enabled
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   restart();
// }


function draw() {
  clear();
  background(255)

  ui.draw();

  push();
  translate(width/2, height/2);
  bands.draw();
  pop();

  bands.tick();

  // fill(sm.props.bg);
  // stroke(0);
  // circle(width/2, height/2, 200);

  // background(sm.props.bg);
  text(sm.props.msg, width/2, height/2);

  if (!paused) {
  }

}