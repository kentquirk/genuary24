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

let typecolors = new Map();

function restart() {
  bg = 80;
  zoomLevel = 1.5;
  inputCol = color(128, 255, 128);
  outputCol = color(255, 192, 192);
  buttondiv = select('#button-holder');
  buttondiv.html('');

  typecolors.set('Honeycomb', color(255, 192, 255));
  typecolors.set('OTelTraces', color(192, 192, 255));
  typecolors.set('OTelLogs', color(255, 255, 192));

  let k = addComponentKind('TraceGRPC', [
    {direction: 'output', type: 'OTelTraces', name: 'TraceOut'}
  ], 100, 70, color(128, 255, 128));
  k.addProperty('Port', 4317);
  k = addComponentKind('RefineryGRPC', [
    {direction: 'output', type: 'Honeycomb', name: 'TraceOut'}
  ], 100, 70, color(128, 255, 128));
  k.addProperty('Port', 4317);
  k = addComponentKind('RefineryHTTP', [
    {direction: 'output', type: 'Honeycomb', name: 'TraceOut'}
  ], 100, 70, color(128, 255, 128));
  k.addProperty('Port', 8080);
  k = addComponentKind('LogsHTTP', [
    {direction: 'output', type: 'OTelLogs', name: 'LogsOut'}
  ], 100, 70, color(128, 240, 240));
  k.addProperty('Port', 8080);
  k = addComponentKind('LogSplitter', [
    {direction: 'input', type: 'OTelLogs', name: 'Input'},
    {direction: 'output', type: 'OTelTraces', name: 'Has TraceID'},
    {direction: 'output', type: 'OTelLogs', name: 'No TraceID'}
  ], 150, 100, color(140, 140, 255));
  k.addProperty('TraceIDField', 'trace.trace_id');
  k = addComponentKind('TraceConverter', [
    {direction: 'input', type: 'OTelTraces', name: 'Input'},
    {direction: 'output', type: 'Honeycomb', name: 'Output'}
  ], 150, 100, color(192, 255, 192));
  k = addComponentKind('DeterministicSampler', [
    {direction: 'input', type: 'Honeycomb', name: 'Input'},
    {direction: 'output', type: 'Honeycomb', name: 'Kept'},
    {direction: 'output', type: 'Honeycomb', name: 'Dropped'}
  ], 150, 100, color(192, 192, 255));
  k.addProperty('Environment', '__default__');
  k.addProperty('SampleRate', 10);
  k = addComponentKind('EMAThroughputSampler', [
    {direction: 'input', type: 'Honeycomb', name: 'Input'},
    {direction: 'output', type: 'Honeycomb', name: 'Kept'},
    {direction: 'output', type: 'Honeycomb', name: 'Dropped'}
  ], 170, 120, color(192, 222, 255));
  k.addProperty('TPS', 100);
  k.addProperty('KeyFields', 'key1, key2, key3');
  k = addComponentKind('HoneycombExporter', [
    {direction: 'input', type: 'Honeycomb', name: 'Traces'}
  ], 180, 80, color(255, 255, 128));
  k.addProperty('Dataset', 'mytraces');
  k.addProperty('APIKey', '$HONEYCOMB_APIKEY');
  k = addComponentKind('OTelTraceExporter', [
    {direction: 'input', type: 'OTelTraces', name: 'Traces'}
  ], 180, 80, color(255, 255, 128));
  k.addProperty('Dataset', 'mytraces');
  k.addProperty('APIKey', '$HONEYCOMB_APIKEY');
  k = addComponentKind('OTelLogExporter', [
    {direction: 'input', type: 'OTelLogs', name: 'Logs'}
  ], 180, 80, color(255, 222, 128));
  k.addProperty('Dataset', 'mylogs');
  k.addProperty('APIKey', '$HONEYCOMB_APIKEY');
  k = addComponentKind('LogStorage', [
    {direction: 'input', type: 'OTelLogs', name: 'Logs'}
  ], 180, 80, color(128, 222, 255));
  k.addProperty('APIKey', '$HONEYCOMB_APIKEY');

  generateYAML(windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight*.7);
  restart();
}

function reconstructHPSF(j) {
  let originalWidth = j.layout.frame.width;
  let originalHeight = j.layout.frame.height;

  components = [];
  connections = [];
  for (let jcmp of j.components) {
    print ("components:", j.layout.components, jcmp);
    let layoutcmp = j.layout.components.find(c => {print(c, jcmp); return c.name === jcmp.name});
    print('layout', layoutcmp);
    let x = layoutcmp.x * windowWidth / originalWidth;
    let y = layoutcmp.y * windowHeight / originalHeight;
    let c = new Component(jcmp.kind, x, y, jcmp.name);
    components.push(c);
  }
  for (let jc of j.connections) {
    print ('connection', jc);
    print ('components', components);
    let frComp = components.find(c => c.name === jc.source.component);
    let toComp = components.find(c => c.name === jc.destination.component);
    let c = new Connection(frComp, jc.source.port, toComp, jc.destination.port);
    connections.push(c);
  }
  generateYAML(windowWidth, windowHeight);
}

function loadJSON(data) {
  print('loading json');
  let j = JSON.parse(data);
  reconstructHPSF(j);
}

function loadYAML(name, data) {
  print('loading yaml file ' + name);
  // open the file and read it
  // the data is stored in the data field like this:
  // data:application/x-yaml;base64,Y29...
  // so we need to extract the base64 part after the comma
  let parts = data.split(',');
  let text = window.atob(parts[1]);
  let j = window.fromYAML(text);
  console.log(j);
  reconstructHPSF(j);
}

// this is called after a file is dropped and fully loaded
function handleFile(file) {
  print("in handlefile", file);
  if (file.type.includes('json') || file.subtype.includes('json')) {
    loadJSON(file.data);
  } else if (file.type.includes('yaml') || file.subtype.includes('yaml')) {
    loadYAML(file.name, file.data);
  } else {
    print('unsupported file type ' + file.type);
  }
}

// this is called immediately after a file is dropped with the drop event
function handleDrop(event) {
  event.preventDefault();
  console.log(event);
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight*.7);
  canvas.parent('sketch-holder');

  canvas.drop(handleFile, handleDrop);

  components = [];
  connections = [];
  restart();
}

function keyTyped() {
  switch (key) {
    case ' ':
      paused = !paused;
      break;
    case 'r':
      components = [];
      connections = [];
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
      saveJSON(generateJSON(windowWidth, windowHeight), 'hpsf.json');
      break;
    case 'y':
      save([window.toYAML(generateJSON(windowWidth, windowHeight))], 'hpsf.yaml');
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
      if (port && port !== dragPort && port.parent !== dragPort.parent &&
        port.direction !== dragPort.direction && port.type === dragPort.type) {
        // print('connecting', dragPort, 'to', port);
        let connection = new Connection(dragPort.parent, dragPort.name, component, port.name);
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
    // print('dragging', dragComponent.name);
    dragComponent.drag();
  }
  partialConnection = null;
  if (dragPort) {
    partialConnection = dragPort;
    // print('dragging port', dragPort.name);
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
    let p1 = partialConnection.parent.portPosition(partialConnection.name);
    let p2 = createVector(mouseX/zoomLevel, mouseY/zoomLevel);
    bestCurve(p1, p2);
  }

  for (let component of components) {
    component.draw();
  }

  if (changed) {
    generateYAML(windowWidth, windowHeight);
    changed = false;
  }

  if (!paused) {
    // bg = (bg + 1) % 255;
  }

}