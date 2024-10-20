let paused = false;
let bg = 0;
let zoomLevel = 1;
let components = [];
let connections = [];
let partialConnection = null;
let dragComponent = null;
let dragPort = null;
let inputCol, outputCol;
let textCol = 0;
let changed = false;

// helper function
function verticalCurve(p1, p2) {
  let c1 = p1.copy();
  let c2 = p2.copy();
  c1.y = (p1.y + p2.y) / 2;
  c2.y = (p1.y + p2.y) / 2;
  noFill();
  stroke(0);
  strokeWeight(2);
  bezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
  // line(p1.x, p1.y, p2.x, p2.y);
  noStroke(0);
}

// shape has a list of
class Shape {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw() {
    push();
    translate(this.x, this.y);
    this.drawShape();
    pop();
  }

  drawShape() {
    // override
  }
}

class Port {
  constructor(parent, type, direction, label, col) {
    this.type = type;
    this.parent = parent;
    this.direction = direction;
    this.label = label;
    this.col = col;
    this.x = 0;
    this.y = 0;
    this.portRadius = 7;
    this.textFill = textCol;
    this.hovering = false;
  }

  // draw the port
  draw() {
    let align = BOTTOM;
    let offset = this.portRadius;
    if (this.direction === 'input') {
      align = TOP;
      offset = -this.portRadius;
    }
    fill(this.col);
    if (this.hovering) {
      stroke(0);
    }
    ellipse(this.x, this.y + offset, 2*this.portRadius);
    noStroke();
    fill(this.textFill);
    textSize(9);
    text(this.label, this.x, this.y - offset);
  }

  // ask if x, y is inside the port
  hit(x, y) {
    let offset = this.portRadius;
    if (this.direction === 'input') {
      offset = -this.portRadius;
    }
    return dist(x, y, this.x, this.y + offset) <= this.portRadius;
  }

  yaml(indent) {
    let spaces = ' '.repeat(indent) + '- ';
    let yaml = spaces + 'Name: ' + this.label + '\n';
    spaces = ' '.repeat(indent+2);
    yaml += spaces + 'Direction: ' + this.direction + '\n';
    yaml += spaces + 'Type: ' + this.type + '\n';
    return yaml;
  }
}

class ComponentShape extends Shape {
  constructor(x, y, w, h, label) {
    super(x, y);
    this.w = w;
    this.h = h;
    this.label = label;
    this.inputs = new Map();
    this.outputs = new Map();
    this.bodyfill = 255;
    this.textFill = textCol;
  }

  addInput(parent, type, label, col) {
    this.inputs.set(label, new Port(parent, type, 'input', label, col));
    this._layoutPorts();
  }

  addOutput(parent, type, label, col) {
    this.outputs.set(label, new Port(parent, type, 'output', label, col));
    this._layoutPorts();
  }

  _layoutPorts() {
    let nInputs = this.inputs.size;
    let i = 0;
    for (let input of this.inputs.values()) {
      let x = -this.w / 2 + (i+1) * this.w / (nInputs + 1);
      let y = -this.h / 2;
      input.x = x;
      input.y = y;
      i++;
    }

    let nOutputs = this.outputs.size;
    i = 0;
    for (let output of this.outputs.values()) {
      let x = -this.w / 2 + (i+1) * this.w / (nOutputs + 1);
      let y = this.h / 2;
      output.x = x;
      output.y = y;
      i++;
    }
  }

  // draw the component as if it's at the origin
  drawShape() {
    rectMode(CENTER);
    fill(this.bodyfill);
    rect(0, 0, this.w, this.h);
    fill(this.textFill);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.label, 0, 0);
    for (let input of this.inputs.values()) {
      input.draw();
    }
    for (let output of this.outputs.values()) {
      output.draw();
    }
  }

  // ask if x, y is inside the component without the translation
  // but with the zoomLevel
  // x, y are in the global coordinate system without scaling, so we have to scale them
  bodyHit(x, y) {
    x = x / zoomLevel - this.x;
    y = y / zoomLevel - this.y;
    let w = this.w/2;
    let h = this.h/2;
    return x >= -w && x <= w && y >= -h && y <= h;
  }

  portHit(x, y) {
    // we need a relative position
    x = x / zoomLevel - this.x;
    y = y / zoomLevel - this.y;
    for (let input of this.inputs.values()) {
      if (input.hit(x, y)) {
        return input;
      }
    }
    for (let output of this.outputs.values()) {
      if (output.hit(x, y)) {
        return output;
      }
    }
    return null;
  }
}

class Component {
  constructor(label, x, y) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.shape = new ComponentShape(x, y, 150, 50, label);
    this.dragging = false;
    this.hovering = false;
    this.dragX = 0;
    this.dragY = 0;
  }

  addInput(type, label, col) {
    this.shape.addInput(this, type, label, col);
  }

  addOutput(type, label, col) {
    this.shape.addOutput(this, type, label, col);
  }

  draw() {
    if (this.hovering) {
      this.shape.bodyfill = color(255, 255, 0);
    } else {
      this.shape.bodyfill = color(255);
    }
    this.shape.draw();
  }

  noHover() {
    this.hovering = false;
    for (let input of this.shape.inputs.values()) {
      input.hovering = false;
    }
    for (let output of this.shape.outputs.values()) {
      output.hovering = false;
    }
  }

  bodyHit(x, y) {
    return this.shape.bodyHit(x, y);
  }

  portHit(x, y) {
    return this.shape.portHit(x, y);
  }

  port(label) {
    for (let input of this.shape.inputs.values()) {
      if (input.label === label) {
        return input;
      }
    }
    for (let output of this.shape.outputs.values()) {
      if (output.label === label) {
        return output;
      }
    }
    print('port not found', label, this.inputs, this.outputs);
    return null;
  }

  portPosition(portLabel) {
    let p = this.port(portLabel);
    if (p !== null) {
      return createVector(this.x + p.x, this.y + p.y);
    }
    print('port not found', portLabel, this.inputs, this.outputs);
    return null;
  }

  beginDrag() {
    this.dragging = true;
    this.dragX = mouseX;
    this.dragY = mouseY;
  }

  endDrag() {
    this.dragging = false;
  }

  drag() {
    if (this.dragging) {
      this.x += (mouseX - this.dragX) / zoomLevel;
      this.y += (mouseY - this.dragY) / zoomLevel;
      this.shape.x = this.x;
      this.shape.y = this.y;
      this.dragX = mouseX;
      this.dragY = mouseY;
    }
  }

  yaml(indent) {
    let spaces = ' '.repeat(indent) + '- ';
    let yaml = spaces + 'Name: ' + this.label + '\n';
    spaces = ' '.repeat(indent+2);
    yaml += spaces + 'Ports:\n';
    for (let input of this.shape.inputs.values()) {
      yaml += input.yaml(indent+2);
    }
    for (let output of this.shape.outputs.values()) {
      yaml += output.yaml(indent+2);
    }
    return yaml;
  }
}

class Connection {
  constructor(frComp, frPort, toComp, toPort) {
    // always go from the output to the input
    let p = frComp.port(frPort);
    print(frComp);
    if (frComp.port(frPort).direction == 'input') {
      // print('reversing connection');
      this.frComp = toComp;
      this.frPort = toPort;
      this.toComp = frComp;
      this.toPort = frPort;
    } else {
      // print('normal connection');
      this.frComp = frComp;
      this.frPort = frPort;
      this.toComp = toComp;
      this.toPort = toPort;
    }
  }

  draw() {
    let p1 = this.frComp.portPosition(this.frPort);
    let p2 = this.toComp.portPosition(this.toPort);
    verticalCurve(p1, p2);
  }

  yaml(indent) {
    let spaces = ' '.repeat(indent) + '- ';
    let yaml = spaces + 'Source:\n';
    let spaces2 = ' '.repeat(indent+2);
    yaml += spaces2 + '  Component: ' + this.frComp.label + '\n';
    yaml += spaces2 + '  Port: ' + this.frPort + '\n';
    yaml += spaces2 + 'Destination:\n';
    yaml += spaces2 + '  Component: ' + this.toComp.label + '\n';
    yaml += spaces2 + '  Port: ' + this.toPort + '\n';
    yaml += spaces + 'Properties:\n';
    yaml += spaces2 + '  Color: "' + this.frComp.port(this.frPort).col.toString('#rrggbb') + '"\n';
    return yaml;
  }
}


function restart() {
  bg = 128;
  zoomLevel = 2;
  inputCol = color(128, 128, 255);
  outputCol = color(255, 128, 128);

  c1 = new Component('TraceGRPC', 100, 100);
  c1.addOutput('OtelTraces', 'TraceOut', outputCol);
  c2 = new Component('DeterministicSampler', 100, 300);
  c2.addInput('OtelTraces', 'Input', inputCol);
  c2.addOutput('OtelTraces', 'Kept', outputCol);
  c2.addOutput('OtelTraces', 'Dropped', outputCol);
  c3 = new Component('HoneycombExporter', 100, 500);
  c3.addInput('OtelTraces', 'Traces', inputCol);
  components = [c1, c2, c3];
  let connection = new Connection(c1, 'TraceOut', c2, 'Input');
  connections = [connection];
  generateYaml();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  restart();
}

function keyTyped() {
  switch (key) {
    case ' ':
      paused = !paused;
      break;
    case 'r':
      restart();
      break;
    case 'z':
      zoomLevel *= 1.25;
      break;
    case 'Z':
      zoomLevel *= 0.8;
      break;
  }
}

function mousePressed() {
  for (let component of components) {
    if (component.bodyHit(mouseX, mouseY)) {
      // print('pressed');
      dragComponent = component;
      component.beginDrag();
      break;
    }
    let dp = component.portHit(mouseX, mouseY);
    if (dp !== null) {
      // print('port hit');
      dragPort = dp;
      dragPort.hovering = true;
      break;
    }
  }
}

function mouseReleased() {
  if (dragComponent) {
    dragComponent.endDrag();
    dragComponent = null;
  }
  partialConnection = null;
  if (dragPort) {
    dragPort.hovering = false;
    for (let component of components) {
      let port = component.portHit(mouseX, mouseY);
      if (port && port !== dragPort && port.parent !== dragPort.parent && port.type !== dragPort.type) {
        // print('connecting', dragPort, 'to', port);
        let connection = new Connection(dragPort.parent, dragPort.label, component, port.label);
        connections.push(connection);
        break;
      }
    }
    dragPort = null;
  }
  changed = true;
}

function mouseDragged() {
  if (dragComponent) {
    // print('dragging', dragComponent.label);
    dragComponent.drag();
  }
  partialConnection = null;
  if (dragPort) {
    partialConnection = dragPort;
    // print('dragging port', dragPort.label);
  }
}

function mouseMoved() {
  for (let component of components) {
    ch = component.bodyHit(mouseX, mouseY);
    ph = component.portHit(mouseX, mouseY);
    if (ch) {
      component.hovering = true;
    } else if (ph) {
      ph.hovering = true;
    } else {
      component.noHover();
    }
  }
}

function yaml() {
  let yaml = 'Components:\n';
  for (let component of components) {
    yaml += component.yaml(2);
  }
  yaml += 'Connections:\n';
  for (let connection of connections) {
    yaml += connection.yaml(2);
  }
  return yaml;
}

function generateYaml() {
  let hpsf = select('#HPSF');
  hpsf.html(yaml());
}

function draw() {
  clear();
  background(bg);
  scale(zoomLevel);

  for (let connection of connections) {
    connection.draw();
  }

  if (partialConnection) {
    let p1 = partialConnection.parent.portPosition(partialConnection.label);
    let p2 = createVector(mouseX/zoomLevel, mouseY/zoomLevel);
    verticalCurve(p1, p2);
  }

  for (let component of components) {
    component.draw();
  }

  if (changed) {
    generateYaml();
    changed = false;
  }

  if (!paused) {
    // bg = (bg + 1) % 255;
  }

}