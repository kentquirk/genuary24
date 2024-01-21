canvasWidth = 400;
canvasHeight = 400;
let paused = false;
let mic, recorder;
let soundFile;
let soundFiles = [];
let sm;

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
  let start = () => {
    if (mic.enabled) {
      // record to our p5.SoundFile
      recorder.record(soundFile);
      sm.transition('stopRecording');
    }
  }

  let stop = () => {
    // stop recorder and
    // send result to soundFile
    recorder.stop();
    sm.transition('playback');
  }

  let playback = () => {
    soundFile.play(); // play the result!
    // save(soundFile, 'mySound.wav');
    sm.transition('startRecording');
  }

  sm = new StateMachine();

  sm.add('startRecording', start, { bg: 'blue', msg:'tap to record' });
  sm.add('stopRecording', stop, { bg: 'red', msg:'recording! tap to stop' });
  sm.add('playback', playback, { bg: 'green', msg:'tap to play' });
  sm.transition('startRecording');
  return sm;
}

function setup() {
  let cnv = createCanvas(canvasWidth, canvasHeight);
  cnv.parent('sketch-holder');
  cnv.mousePressed(canvasPressed);
  textAlign(CENTER, CENTER);

  // create an audio in
  mic = new p5.AudioIn();

  // prompts user to enable their browser mic
  mic.start();

  // create a sound recorder
  recorder = new p5.SoundRecorder();

  // connect the mic to the recorder
  recorder.setInput(mic);

  // this sound file will be used to
  // playback & save the recording
  soundFile = new p5.SoundFile();

  sm = setupStates();
}

function canvasPressed() {
  // ensure audio is enabled
  userStartAudio();
  sm.run();
}

function restart() {
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}


function draw() {
  clear();
  background(255);

  fill(sm.props.bg);
  stroke(0);
  circle(width/2, height/2, 200);

  // background(sm.props.bg);
  text(sm.props.msg, width/2, height/2);

  if (!paused) {
  }

}