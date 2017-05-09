#pragma glslify: lambert = require(glsl-diffuse-lambert)
#pragma glslify: blendDarken = require(glsl-blend/darken)
#define M_PI 3.1415926535897932384626433832795

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
  vec3 firstColor = vec3(0.22,0.56,0.53);
  vec3 secondColor = vec3(0.65,0.75,0.31);
  vec3 gradient = mix(firstColor, secondColor,(vPosition.y / (resolution.y) * sin(mod(time, M_PI))));
  vec3 endColor = blendDarken(vec3(power), gradient);

  // If theme is white, discard the gradient and only apply diffuse white with a small ambient light added
  endColor = endColor * (1.0 - isWhite) + ((power + 0.15) * isWhite) + vec3(0.13);

  gl_FragColor = vec4(endColor, 1.0);
}
