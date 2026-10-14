import { CatmullRomCurve3, Vector3, type PerspectiveCamera } from "three";
import { productsState } from "./products";
import { routeState } from "./route";

import { journeyLayout, journeyProgress, journeyState, NODES } from "./journeyState";

export { journeyDom, journeyLayout, journeyProgress, journeyState, NODES, scrollForNode } from "./journeyState";

/** The Products backdrop object, parked well away from the hero and the Journey. */
export const PRODUCTS_ORIGIN = new Vector3(0, -160, 0);
/** The structure lives far below the hero so the hero camera never sees it. */
export const ORIGIN = new Vector3(0, -80, 0);

export const nodePos: Vector3[] = Array.from({ length: NODES }, (_, i) =>
  new Vector3((i - 4) * 3.4, Math.cos(i * 0.7) * 0.9, Math.sin(i * 0.9) * 1.4).add(ORIGIN),
);
export const path = new CatmullRomCurve3(nodePos, false, "catmullrom", 0.5);

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Preallocated: nothing is created per frame.
const _a = new Vector3();
const _b = new Vector3();
const _look = new Vector3();
const _pos = new Vector3();
const _c = new Vector3();
const _d = new Vector3();

/**
 * The one place the camera is positioned. It rests at the hero pose, travels to the first node as the
 * Journey scrolls into view, then follows the path node to node. Returns how visible the structure is (0-1).
 */
export function placeCamera(cam: PerspectiveCamera, heroZ: number, scrollY: number): void {
  const vh = journeyLayout.vh;
  const enter = journeyLayout.on ? smooth(clamp01((scrollY - (journeyLayout.top - vh)) / vh)) : 0;
  const u = journeyProgress(scrollY) * (NODES - 1);
  const exitT = journeyLayout.on ? clamp01((scrollY - (journeyLayout.top + journeyLayout.height - vh)) / (vh * 0.7)) : 0;
  const vis = enter * (1 - smooth(exitT));
  journeyState.u = u;
  journeyState.vis = vis;
  journeyState.enter = enter;

  // Base pose: the hero, travelling to the path as the Journey comes into view.
  const wide = cam.aspect > 1.1;
  _pos.set(0, 0, heroZ);
  _look.set(0, 0, 0);
  if (enter > 0) {
    // The path runs left to right across the screen. The camera slides along it with the active node in the
    // upper half, so its text can sit underneath.
    path.getPoint(u / (NODES - 1), _a);
    _look.copy(_a).add(_b.set(0, wide ? -1.0 : -1.5, 0)).multiplyScalar(enter);
    _pos.set(0, 0, heroZ).lerp(_c.copy(_a).add(_b.set(0.5, -0.2, wide ? 9.2 : 13)), enter);
  }

  // Products: the camera orbits the product object; the active tab sets the angle.
  const ps = productsState;
  const pw = ps.on ? smooth(clamp01((scrollY - (ps.top - ps.vh)) / ps.vh)) * (1 - smooth(clamp01((scrollY - (ps.top + ps.height - ps.vh)) / ps.vh))) : 0;
  ps.vis = pw;
  if (pw > 0) {
    const r = wide ? 8.5 : 11;
    _c.set(Math.sin(ps.theta) * r, PRODUCTS_ORIGIN.y + 0.5, Math.cos(ps.theta) * r);
    _pos.lerp(_c, pw);
    // Keep the object in the right third of the screen: look a little to its left, in camera space.
    _d.set(-Math.cos(ps.theta), 0, Math.sin(ps.theta)).multiplyScalar(wide ? 3.1 : 0).add(PRODUCTS_ORIGIN);
    _d.y -= wide ? 1.7 : 2.4; // the object sits up in the empty corner beside the heading
    _look.lerp(_d, pw);
  }

  // Careers: the camera swings round the hero object to a new angle, and the object ends up high on the right.
  const cw = routeState.careers;
  if (cw > 0) {
    _c.set(-3.4, 0.7, heroZ * 0.82);
    _pos.lerp(_c, cw);
    _d.set(-1.4, -0.9, 0);
    _look.lerp(_d, cw);
  }

  cam.position.copy(_pos);
  cam.lookAt(_look);
}
