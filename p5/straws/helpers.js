// helper function
function verticalCurve(p1, p2) {
    let c1 = p1.copy();
    let c2 = p2.copy();
    c1.y = (p1.y + p2.y) / 2;
    c2.y = (p1.y + p2.y) / 2;
    noFill();
    stroke(240);
    strokeWeight(2);
    bezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
    // line(p1.x, p1.y, p2.x, p2.y);
    noStroke(0);
  }

  function horizontalCurve(p1, p2) {
    let c1 = p1.copy();
    let c2 = p2.copy();
    c1.x = (p1.x + p2.x) / 2;
    c2.x = (p1.x + p2.x) / 2;
    noFill();
    stroke(240);
    strokeWeight(2);
    bezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
    // line(p1.x, p1.y, p2.x, p2.y);
    noStroke(0);
  }

  function bestCurve(p1, p2) {
    if (Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y)) {
      horizontalCurve(p1, p2);
    } else {
      verticalCurve(p1, p2);
    }
  }

  function generateYAML(winW, winH) {
    let hpsf = select('#HPSF');
    hpsfText = window.toYAML(generateJSON(winW, winH));
    hpsf.html(hpsfText);
  }

  function generateJSON(winW, winH) {
    let j = {
      components: [],
      connections: []
    };
    for (let component of components) {
      j.components.push(component.json());
    }
    for (let connection of connections) {
      j.connections.push(connection.json());
    }
    j.layout = {
      frame: { width: winW, height: winH }
    };
    j.layout.components = [];
    for (let component of components) {
      j.layout.components.push({
        label: component.label,
        x: component.x,
        y: component.y
      });
    }
    return j;
  }

