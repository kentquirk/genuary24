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

class ComponentShape extends Shape {
    constructor(x, y, w, h, name) {
        super(x, y);
        this.w = w;
        this.h = h;
        this.name = name;
        this.inputs = new Map();
        this.outputs = new Map();
        this.bodyfill = 255;
        this.textFill = textCol;
    }

    addInput(parent, type, name, col) {
        this.inputs.set(name, new Port(parent, type, 'input', name, col));
        this._layoutPorts();
    }

    addOutput(parent, type, name, col) {
        this.outputs.set(name, new Port(parent, type, 'output', name, col));
        this._layoutPorts();
    }

    _layoutPorts() {
        let nInputs = this.inputs.size;
        let i = 0;
        for (let input of this.inputs.values()) {
            let x = -this.w / 2;
            let y = -this.h / 2 + (i + 1) * this.h / (nInputs + 1);
            input.x = x;
            input.y = y;
            i++;
        }

        let nOutputs = this.outputs.size;
        i = 0;
        for (let output of this.outputs.values()) {
            let x = this.w / 2;
            let y = -this.h / 2 + (i + 1) * this.h / (nOutputs + 1);
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
        textAlign(CENTER, TOP);
        textSize(12);
        text(this.name, 0, -this.h / 2 + 5);
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
        let w = this.w / 2;
        let h = this.h / 2;
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
