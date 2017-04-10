#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)


varying vec3 vNormal;
varying vec3 vPosition;
attribute vec3 color;
attribute vec3 center;
uniform float time;
uniform float noiseScale;
uniform float noiseDisplacement;

void main() {
  vNormal = normal;
  vPosition = position;
  float noyz = snoise3(vec3(center.xy * noiseScale, time * 0.25)) * noiseDisplacement;
  float dist = distance(position, vec3(0));
  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(position + vec3(0, 0, noyz), 1.0);
}
