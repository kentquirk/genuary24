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

  function generateYAML() {
    let hpsf = select('#HPSF');
    hpsfText = window.toYAML(generateJSON());
    hpsf.html(hpsfText);
  }

  function generateJSON() {
    let j = {
      Components: [],
      Connections: []
    };
    for (let component of components) {
      j.Components.push(component.json());
    }
    for (let connection of connections) {
      j.Connections.push(connection.json());
    }
    return j;
  }

