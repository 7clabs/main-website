import { useScene } from "./sceneStore";

/**
 * Page navigation that behaves well on a page with a long pinned section in the middle.
 * A short hop scrolls smoothly. A long one jumps straight there, so you are not swept through the
 * whole pinned tree (which would flash through every feature on the way).
 */
const headerHeight = () => document.querySelector("header")?.getBoundingClientRect().height ?? 80;

export function jumpTo(id: string, push = true) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - (id === "top" ? 0 : headerHeight()));
  const far = Math.abs(y - window.scrollY) > window.innerHeight * 2.2;
  const lenis = useScene.getState().lenis;
  if (lenis) lenis.scrollTo(y, { immediate: far || reduced, duration: 1.4 });
  else window.scrollTo({ top: y, behavior: far || reduced ? "auto" : "smooth" });
  if (push) history.replaceState(null, "", id === "top" ? window.location.pathname : `#${id}`);
  return true;
}
