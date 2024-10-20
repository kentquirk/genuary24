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
        ellipse(this.x, this.y + offset, 2 * this.portRadius);
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

    json() {
        return {
            Name: this.label,
            Direction: this.direction,
            Type: this.type
        };
    }
}


class ComponentKind {
    constructor(kind, ports, w, h, col) {
        this.kind = kind;
        this.ports = ports;
        this.w = w;
        this.h = h;
        this.col = col;
        this.labelNumber = 0;
        this.properties = new Map();
        componentKinds.set(kind, this);
    }

    addProperty(name, value) {
        this.properties.set(name, value);
    }

    addPortsTo(component) {
        for (let port of this.ports) {
            if (port.direction === 'input') {
                component.addInput(port.type, port.label, port.col);
            } else {
                component.addOutput(port.type, port.label, port.col);
            }
        }
    }
}

function addComponentKind(kind, ports, w = 150, h = 50, col = 200) {
    let k = new ComponentKind(kind, ports, w, h, col);
    button = createButton(kind);
    buttondiv = select('#button-holder');
    button.parent(buttondiv);
    let createComponent = () => {
        let c = new Component(kind, 250 + 10 * (k.labelNumber + 1), 200 + 10 * (k.labelNumber + 1));
        components.push(c);
        changed = true;
    }
    button.mousePressed(createComponent);
    return k;
}

class Component {
    constructor(kind, x, y, label = '') {
        let ckind = componentKinds.get(kind);
        this.kind = kind;
        this.label = label;
        if (label === '') {
            ckind.labelNumber += 1;
            this.label = kind + '_' + ckind.labelNumber;
        }
        this.x = x;
        this.y = y;
        this.shape = new ComponentShape(x, y, ckind.w, ckind.h, this.label);
        this.properties = new Map();
        for (let [name, value] of ckind.properties) {
            this.properties.set(name, value);
        }
        this.dragging = false;
        this.hovering = false;
        this.dragX = 0;
        this.dragY = 0;
        ckind.addPortsTo(this);
    }

    addInput(type, label, col) {
        this.shape.addInput(this, type, label, col);
    }

    addOutput(type, label, col) {
        this.shape.addOutput(this, type, label, col);
    }

    draw() {
        let ckind = componentKinds.get(this.kind);
        if (this.hovering) {
            this.shape.bodyfill = lerpColor(ckind.col, color(255), 0.5);
        } else {
            this.shape.bodyfill = ckind.col;
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

    select() {
        let container = select('#selected-component');
        let html = '<h3>' + this.label + '</h3>';
        html += '<table id="property-table">';
        // set up the table
        for (let [name, value] of this.properties) {
            let id = 'prop-' + this.label + '-' + name;
            let tfield = '<input type="text" class="textfield" id="' + id + '" value="' + value + '">';
            html += '<tr><td class="propname">' + name + '</td><td class="propvalue">' + tfield + '</td></tr>';
        }
        html += '</table>';
        // add the table to the container
        container.html(html);
        // set up the event handlers
        for (let [name, value] of this.properties) {
            let id = '#prop-' + this.label + '-' + name;
            let input = select(id);
            input.changed(() => {
                // don't turn numbers into strings
                if (typeof(this.properties.get(name)) === 'number') {
                    this.properties.set(name, parseFloat(input.value()));
                } else {
                    this.properties.set(name, input.value());
                }
                changed = true;
            });
        }
    }

    json() {
        let j = {
            Name: this.label,
            Kind: this.kind,
            Ports: []
        };
        for (let input of this.shape.inputs.values()) {
            j.Ports.push(input.json());
        }
        for (let output of this.shape.outputs.values()) {
            j.Ports.push(output.json());
        }
        j.Properties = {};
        for (let [name, value] of this.properties) {
            j.Properties[name] = value;
        }
        return j;
    }
}


class Connection {
    constructor(frComp, frPort, toComp, toPort) {
        // always go from the output to the input
        let p = frComp.port(frPort);
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

    json() {
        return {
            Source: {
                Component: this.frComp.label,
                Port: this.frPort
            },
            Destination: {
                Component: this.toComp.label,
                Port: this.toPort
            }
        };
    }
}
