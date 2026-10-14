/** Cursor ribbon: a tapering strip that wobbles with noise and fades along its length. */
export const trailVert = /* glsl */ `
attribute float aAge;
uniform float uTime;
varying float vAge;
void main() {
  vAge = aAge;
  vec3 p = position;
  float w = sin(uTime * 2.1 + aAge * 9.0) * 0.5 + sin(uTime * 3.7 - aAge * 5.0) * 0.5;
  p.xy += vec2(-normal.y, normal.x) * w * 0.035 * aAge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const trailFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying float vAge;
void main() {
  float f = pow(1.0 - vAge, 2.0);
  gl_FragColor = vec4(uColor * f * uIntensity, f);
}
`;
