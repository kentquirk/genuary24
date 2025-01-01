#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aPosition;
attribute vec2 aTexCoord;

// lets get texcoords just for fun!
varying vec2 vTexCoord;
varying vec2 noiseCoord;

uniform float t;

void main() {
  // copy the texcoords
  vTexCoord = aTexCoord;
  noiseCoord = aTexCoord;
//   noiseCoord *= t;
//   noiseCoord = fract(noiseCoord);

  // Copy the position data into a vec4, adding 1.0 as the w parameter
  vec4 positionVec4 = vec4(aPosition, 1.0);

  // Scale to make the output fit the canvas
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

  // Send the vertex information on to the fragment shader
  gl_Position = positionVec4;
}