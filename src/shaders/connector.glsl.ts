/** Journey connectors: a line that fills with light up to the current position and carries a moving pulse. */
export const connectorVert = /* glsl */ `
varying float vU;
void main() {
  vU = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const connectorFrag = /* glsl */ `
uniform float uLit;      // 0..1, how much of this segment has light
uniform float uTime;
uniform float uVis;
uniform vec3 uColor;
uniform vec3 uBase;
varying float vU;
void main() {
  float lit = step(vU, uLit);
  float head = exp(-abs(vU - uLit) * 14.0) * step(0.001, uLit) * step(uLit, 0.999);
  float pulse = lit * (0.55 + 0.45 * sin((vU * 6.0 - uTime * 1.4) * 6.2831)) ;
  vec3 col = mix(uBase * 0.55, uColor * (1.1 + pulse * 1.3), lit) + uColor * head * 2.4;
  float a = mix(0.35, 0.95, lit) * uVis;
  gl_FragColor = vec4(col, a);
}
`;

/** The feedback loop from the last node back to the first: dashes that travel along the arc. */
export const loopFrag = /* glsl */ `
uniform float uOn;
uniform float uTime;
uniform float uVis;
uniform vec3 uColor;
varying float vU;
void main() {
  float d = fract(vU * 22.0 - uTime * 0.5);
  float dash = smoothstep(0.0, 0.15, d) * (1.0 - smoothstep(0.55, 0.7, d));
  float a = (0.1 + dash * 0.6) * uOn * uVis;
  gl_FragColor = vec4(uColor * (0.6 + dash * 0.9), a);
}
`;
