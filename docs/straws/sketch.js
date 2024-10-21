let paused = false;
let bg = 0;
let zoomLevel = 1;
let components = [];
let connections = [];
let componentKinds = new Map();
let partialConnection = null;
let dragComponent = null;
let dragPort = null;
let inputCol, outputCol;
let textCol = 0;
let changed = false;
let hpsfText = '';

function restart() {
  bg = 80;
  zoomLevel = 1.5;
  inputCol = color(128, 255, 128);
  outputCol = color(255, 192, 192);
  buttondiv = select('#button-holder');
  buttondiv.html('');

  let k = addComponentKind('TraceGRPC', [
    {direction: 'output', type: 'OtelTraces', label: 'TraceOut', col: outputCol}
  ], 100, 70, color(128, 255, 128));
  k.addProperty('Port', 4317);
  k = addComponentKind('DeterministicSampler', [
    {direction: 'input', type: 'OtelTraces', label: 'Input', col: inputCol},
    {direction: 'output', type: 'OtelTraces', label: 'Kept', col: outputCol},
    {direction: 'output', type: 'OtelTraces', label: 'Dropped', col: outputCol}
  ], 150, 100, color(192, 192, 255));
  k.addProperty('SampleRate', 10);
  k = addComponentKind('EMAThroughputSampler', [
    {direction: 'input', type: 'OtelTraces', label: 'Input', col: inputCol},
    {direction: 'output', type: 'OtelTraces', label: 'Kept', col: outputCol},
    {direction: 'output', type: 'OtelTraces', label: 'Dropped', col: outputCol}
  ], 170, 120, color(192, 222, 255));
  k.addProperty('TPS', 100);
  k.addProperty('KeyFields', 'key1, key2, key3');
  k = addComponentKind('HoneycombExporter', [
    {direction: 'input', type: 'OtelTraces', label: 'Traces', col: inputCol}
  ], 180, 80, color(255, 255, 128));
  k.addProperty('Dataset', 'mydataset');
  k.addProperty('APIKey', '$HONEYCOMB_APIKEY');

  components = [new Component('HoneycombExporter', 300, windowHeight*.35, 'ToHoneycomb')];

  connections = [];
  generateYAML();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight*.7);
  restart();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight*.7);
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
    case 'R':
      connections = [];
      break;
    case 'd':
      for (let component of components) {
        if (component.hovering) {
          let index = components.indexOf(component);
          components.splice(index, 1);
          // and all of its connections
          for (let i = connections.length-1; i >= 0; i--) {
            let connection = connections[i];
            if (connection.frComp === component || connection.toComp === component) {
              connections.splice(i, 1);
            }
          }
          break;
        }
      }
      for (let i = connections.length-1; i >= 0; i--) {
        let connection = connections[i];
        let pf = connection.frComp.port(connection.frPort);
        let pt = connection.toComp.port(connection.toPort);
        if (pf.hovering || pt.hovering) {
          connections.splice(i, 1);
        }
      }
      break;
    case 'z':
      zoomLevel *= 1.25;
      break;
    case 'Z':
      zoomLevel *= 0.8;
      break;
    case 'j':
      saveJSON(generateJSON(), 'hpsf.json');
      break;
    case 'y':
      save([window.toYAML(generateJSON())], 'hpsf.yaml');
      break;
  }
}

function mousePressed() {
  // select in the reverse order so we get the one on top
  for (let i = components.length-1; i >= 0; i--) {
    let component = components[i];
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

function mouseClicked() {
  // print('clicked');
  for (let component of components) {
    if (component.bodyHit(mouseX, mouseY)) {
      component.select();
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
    // print('dragPort', dragPort);
    dragPort.hovering = false;
    for (let component of components) {
      let port = component.portHit(mouseX, mouseY);
      // print('port', port);
      if (port && port !== dragPort && port.parent !== dragPort.parent && port.direction !== dragPort.direction) {
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
    generateYAML();
    changed = false;
  }

  if (!paused) {
    // bg = (bg + 1) % 255;
  }

}