#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution; // This is passed in as a uniform from the sketch.js file
// the texture contents
uniform sampler2D noisetex;
uniform sampler2D painttex;
uniform sampler2D tex0;

// x,y coordinates, given from the vertex shader
varying vec2 vTexCoord;
varying vec2 noiseCoord;

bool isBlack(vec4 color) {
  return color.r == 0.0 && color.g == 0.0 && color.b == 0.0;
}

bool isWhite(vec4 color) {
  return color.r == 1.0 && color.g == 1.0 && color.b == 1.0;
}

void main() {
  // get the image pixel at the specified coordinate
  vec4 pixel = texture2D(tex0, vTexCoord);

  if (isBlack(pixel)) {
    // sample the noise texture
    vec4 noise = texture2D(noisetex, noiseCoord);
    // gl_FragColor = noise;
    if (noise.a < 0.15) {
      // draw the pixel as is
    //   gl_FragColor = vec4(noiseCoord.x, noiseCoord.y, 0.0, 1.0);
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  } else if (isWhite(pixel)) {
    // draw the pixel as is
    // gl_FragColor = vec4(noiseCoord.x, noiseCoord.y, 0.0, 1.0);
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  } else {
    // sample the paint texture
    vec4 paint = texture2D(painttex, noiseCoord);
    // combine the paint with the pixel
    gl_FragColor = paint * pixel;
  }
}