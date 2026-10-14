/** Particles around each Journey node. Hovering a node raises the local density: they pull in, grow and brighten. */
export const nodeParticlesVert = /* glsl */ `
attribute float aNode;
attribute float aSeed;
attribute vec3 aOffset;
uniform float uTime;
uniform float uHover[9];
uniform float uAct[9];
uniform float uVis;
uniform float uSize;
varying float vA;
void main() {
  int n = int(aNode + 0.5);
  float h = uHover[n];
  float act = uAct[n];
  vec3 o = aOffset * (1.0 - 0.38 * h);
  o += vec3(sin(uTime * 0.4 + aSeed * 30.0), cos(uTime * 0.33 + aSeed * 21.0), sin(uTime * 0.27 + aSeed * 12.0)) * 0.12;
  vec4 mv = modelViewMatrix * vec4(position + o, 1.0);
  gl_PointSize = uSize * (0.6 + aSeed * 0.8) * (1.0 + h * 0.9) * (7.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
  vA = uVis * (0.18 + act * 0.35 + h * 0.55) * (0.6 + 0.4 * aSeed);
}
`;

export const nodeParticlesFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.05, d));
}
`;
