let noisetex;
let linetex;

let texSize = 100;
let noiseprob = 0.4;
let paintfloor = 192;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    stroke(0);

    // draw the noise texture
    noisetex = createGraphics(texSize, texSize);
    noisetex.background(0);
    strokeWeight(1);
    noisetex.stroke(255, 255);
    for (let i = 0; i < texSize*texSize*noiseprob; i++) {
        noisetex.point(random(texSize), random(texSize));
    }

    // draw the paint texture
    painttex = createGraphics(texSize, texSize);
    painttex.background(0);
    strokeWeight(1);
    for (let x = 0; x < texSize; x++) {
        let y1 = random(texSize);
        let y2 = y1 + random(texSize-y1);

        painttex.stroke(paintfloor+random(255-paintfloor));
        painttex.line(x, 0, x, y1);
        painttex.stroke(paintfloor+random(255-paintfloor));
        painttex.line(x, y1, x, y2);
        painttex.stroke(paintfloor+random(255-paintfloor));
        painttex.line(x, y2, x, texSize);
    }

}

function draw() {
    clear();
    background(128);

    image(noisetex, -100, -100, 200, 200);
}