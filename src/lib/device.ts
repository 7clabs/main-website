export type Quality = {
  webgl: boolean;
  reduced: boolean;
  /** A low-end device gets a lighter scene: no bloom, fewer particles, DPR 1. */
  low: boolean;
  mobile: boolean;
  dprMax: number;
};

/** Read once on the client. Keep this free of per-frame work. */
export function detectQuality(): Quality {
  // No throwaway context here: creating one is a long task on slow GPUs. If the browser then refuses the real
  // context, the scene boundary in SceneLayer drops the canvas and the page stays as it is.
  const webgl = typeof WebGLRenderingContext !== "undefined";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 768;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const low = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return { webgl, reduced, low, mobile, dprMax: low ? 1 : mobile ? 1.5 : 2 };
}

/**
 * True when WebGL is drawn by the CPU (SwiftShader, llvmpipe, a basic software renderer). Those are far too slow for
 * the 3D layer, so the site serves the static page instead. Runs once, after the page is idle, on a throwaway 1x1
 * canvas that is released at once. `7c-force-3d=1` in localStorage skips this (used for automated tests).
 */
export function isSoftwareRenderer(): boolean {
  try {
    if (localStorage.getItem("7c-force-3d") === "1") return false;
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false; // the real context may still work; the scene boundary handles failure
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}
