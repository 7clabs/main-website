import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

/**
 * GSAP and ScrollTrigger are loaded on demand so they stay out of the first-load bundle. Everything that
 * animates with them waits for this, and every animation here begins below the fold or after first paint.
 */
let motion: Promise<{ gsap: typeof Gsap; ScrollTrigger: typeof ST }> | null = null;

export function loadMotion() {
  motion ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, s]) => {
    g.gsap.registerPlugin(s.ScrollTrigger);
    return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
  });
  return motion;
}

/**
 * Runs `cb` once the page has finished loading and the main thread is idle, so the heavy parts
 * (3D, smooth scroll, scroll-linked effects) never compete with the first paint and hydration.
 * Returns a cancel function.
 */
export function whenIdle(cb: () => void, timeout = 1500): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => !cancelled && cb(), { timeout });
    else timer = setTimeout(() => !cancelled && cb(), 200);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    clearTimeout(timer);
  };
}
