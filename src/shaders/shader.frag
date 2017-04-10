#pragma glslify: lambert = require(glsl-diffuse-lambert)
#pragma glslify: blendDarken = require(glsl-blend/darken)

varying vec3 vNormal;
varying vec3 vPosition;
uniform float time;
uniform vec2 resolution;
uniform float isWhite;

void main() {
  // If theme is not white, place light at origin
  vec3 lightPosition = vec3(0.0, 0.0, 1000.0 * isWhite);

  // Light geometry
  vec3 lightDirection = normalize(lightPosition - vPosition);

  // Surface properties
  vec3 normal = normalize(vNormal);

  // Compute diffuse light intensity
  float power = lambert(
    lightDirection,
    normal);

  // Blend a 2 colors gradient using darken mode
  vec3 firstColor = vec3(0.76,0.98,0.47);
  vec3 secondColor = vec3(0.41,0.90,0.62);
  vec3 gradient = mix(firstColor, secondColor,(vPosition.y / (resolution.y / 2.0)) );
  vec3 endColor = blendDarken(vec3(power) + vec3(0.07,0.07,0.07), gradient);

  // If theme is white, discard the gradient and only apply diffuse white with a small ambient light added
  endColor = endColor * (1.0 - isWhite) + ((power + 0.15) * isWhite);

  gl_FragColor = vec4(endColor, 1.0);
}
