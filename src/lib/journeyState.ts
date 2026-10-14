/**
 * Journey state that the page (DOM) and the scene share. Kept free of three.js on purpose, so the page's
 * first-load bundle does not pull the 3D library in with it.
 */

/** Layout of the Journey in the page: written by the DOM section, read by the scene every frame. */
export const journeyLayout = { top: 0, height: 0, vh: 1, on: false };

/** The overlay elements the scene positions every frame (set by the DOM section). */
export const journeyDom: { overlay: HTMLElement | null; label: HTMLElement | null; loop: HTMLElement | null } = {
  overlay: null,
  label: null,
  loop: null,
};

/** Live values the scene computes each frame and other parts read. Mutated in place; never reallocated. */
export const journeyState = { u: 0, vis: 0, enter: 0, railHover: -1 };

export const NODES = 9;

/** 0..1 progress through the pinned Journey, from the page scroll position. */
export function journeyProgress(scrollY: number): number {
  const range = journeyLayout.height - journeyLayout.vh;
  return range > 0 ? Math.min(1, Math.max(0, (scrollY - journeyLayout.top) / range)) : 0;
}

/** Page scroll position (px) that centres a node. */
export function scrollForNode(i: number): number {
  return journeyLayout.top + (i / (NODES - 1)) * (journeyLayout.height - journeyLayout.vh);
}
