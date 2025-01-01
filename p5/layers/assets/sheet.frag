precision highp float;

// x,y coordinates, given from the vertex shader
varying vec2 vTexCoord;

// the texture contents
uniform sampler2D tex0;
// // other useful information from the canvas
// uniform vec2 texelSize;
// uniform vec2 canvasSize;
// // a custom variable from this sketch
// uniform float darkness;

void main() {
    // get the color at current pixel
    vec4 color = texture2D(tex0, vTexCoord);
    // set the output color
    color.b = 1.0;
    gl_FragColor = vec4(color.rgb, 1.0);
}