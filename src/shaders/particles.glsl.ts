/**
 * Ambient dust: every particle drifts on the GPU, so the CPU does nothing per frame. The field wraps around
 * a box in front of the camera, so there is always dust, wherever the camera has travelled to.
 */
export const particlesVert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSize;
uniform float uFade;
uniform vec3 uCenter;
uniform vec3 uBox;
varying float vA;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.07 + aSeed * 40.0) * 0.45;
  p.y += cos(uTime * 0.05 + aSeed * 31.0) * 0.45;
  p.z += sin(uTime * 0.06 + aSeed * 17.0) * 0.35;
  p = uCenter + mod(p - uCenter + uBox, 2.0 * uBox) - uBox;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.5 + aSeed) * (6.0 / max(0.5, -mv.z));
  gl_Position = projectionMatrix * mv;
  vA = uFade * (0.25 + 0.55 * aSeed) * (0.75 + 0.25 * sin(uTime * 0.6 + aSeed * 50.0));
}
`;

export const particlesFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.0, d));
}
`;
