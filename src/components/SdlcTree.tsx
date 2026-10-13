"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  Quaternion,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { treeStages } from "@/app/content";

type Rng = () => number;
type Anim = {
  active: number;
  scrollIdx: number;
  hover: number;
  yaw: number;
  targetYaw: number;
  uy: number; // sideways rotation the visitor has dragged or scrolled in
  uyT: number;
  px: number;
  py: number;
  zoom: number;
  look: Vector3;
  flight: { from: number; to: number; start: number } | null;
  card: { x: number; y: number; init: boolean };
  reduced: boolean;
};
type Cloud = { pos: number[]; col: number[]; bPos: number[]; bCol: number[] };

const N = treeStages.length;
const FLIGHT_MS = 1300;
const WIDE_W = 1100; // at this width and above the flashcard floats beside the point you hover
const FOV = 34;
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AMBER = new Color(1, 0.62, 0.26);
const DENSITY = [820, 620, 520, 440, 390]; // scan points per unit length, by branching depth
const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const rgb = (s: string) => {
  const [r, g, b] = s.split(",").map(Number);
  return new Color(r / 255, g / 255, b / 255);
};

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(MOTION_QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
}

/** Small seeded PRNG so the tree has the same shape on every visit. */
function rng(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const trunkAt = (y: number) => new Vector3(0.03 * Math.sin(y * 3.2), y, -0.025 * Math.cos(y * 2.4));

function newCloud(): Cloud {
  return { pos: [], col: [], bPos: [], bCol: [] };
}

/** One point of the scan: mostly cool-toned, a few amber specks, a few brighter ones. */
function emit(c: Cloud, p: Vector3, color: Color, r: Rng) {
  const bright = r() < 0.09;
  const k = 0.65 + r() * 0.55;
  const col = r() < 0.06 ? AMBER : color;
  (bright ? c.bPos : c.pos).push(p.x, p.y, p.z);
  (bright ? c.bCol : c.col).push(col.r * k, col.g * k, col.b * k);
}

/** Scatter points in a thin shell around a curve, like a laser scan of a branch. */
function shell(c: Cloud, curve: CatmullRomCurve3, count: number, r0: number, r1: number, color: Color, r: Rng) {
  for (let k = 0; k < count; k++) {
    const u = r();
    const p = curve.getPointAt(u);
    const rad = (r0 + (r1 - r0) * u) * (0.35 + 0.9 * r());
    const a = r() * Math.PI * 2;
    const z = r() * 2 - 1;
    const s = Math.sqrt(1 - z * z);
    emit(c, new Vector3(p.x + s * Math.cos(a) * rad, p.y + z * rad, p.z + s * Math.sin(a) * rad), color, r);
  }
}

/** A small mass of leaves. */
function foliage(c: Cloud, centre: Vector3, radius: number, count: number, color: Color, r: Rng) {
  for (let k = 0; k < count; k++) {
    const u = r() * Math.PI * 2;
    const v = Math.acos(2 * r() - 1);
    const d = radius * Math.pow(r(), 0.55);
    emit(c, new Vector3(centre.x + d * Math.sin(v) * Math.cos(u), centre.y + d * Math.cos(v) * 0.8, centre.z + d * Math.sin(v) * Math.sin(u)), color, r);
  }
}

type Grower = { c: Cloud; color: Color; r: Rng; q: number; ends: Vector3[] };

/**
 * Grows one limb and, recursively, everything that forks from it: each limb wanders a little, then
 * splits into two or three shorter, thinner limbs at 25 to 55 degrees, until the twigs, which end in
 * a tiny cluster of leaves. This is what gives the tree its natural, irregular shape.
 */
function grow(g: Grower, start: Vector3, dir: Vector3, len: number, rad: number, depth: number, maxD: number, up: number) {
  const { r } = g;
  const d = dir.clone().normalize();
  const pts = [start.clone()];
  const segs = 3;
  for (let k = 0; k < segs; k++) {
    d.add(new Vector3((r() - 0.5) * 0.55, (r() - 0.5) * 0.3 + up, (r() - 0.5) * 0.55)).normalize();
    pts.push(pts[k].clone().addScaledVector(d, len / segs));
  }
  const curve = new CatmullRomCurve3(pts);
  shell(g.c, curve, Math.max(8, Math.round(len * DENSITY[Math.min(depth, 4)] * g.q)), rad, rad * 0.35, g.color, r);
  const tip = pts[segs];
  if (depth >= maxD) {
    foliage(g.c, tip, 0.04 + r() * 0.035, Math.round(20 * g.q), g.color, r);
    g.ends.push(tip);
    return;
  }
  const kids = depth === 0 ? 3 : r() < 0.35 ? 3 : 2;
  for (let k = 0; k < kids; k++) {
    const u = k === 0 ? 1 : 0.5 + 0.42 * r();
    const sp = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const axis = new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).cross(tan).normalize();
    const ang = (k === 0 ? 0.35 : 0.55 + r() * 0.5) * (r() < 0.5 ? 1 : -1);
    grow(g, sp, tan.clone().applyAxisAngle(axis, ang), len * (0.62 + 0.14 * r()), rad * 0.64, depth + 1, maxD, up * 0.8);
  }
}

function layers(c: Cloud, tex: CanvasTexture, size: number, parent: Group) {
  const make = (pos: number[], col: number[], s: number) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    const m = new PointsMaterial({ map: tex, vertexColors: true, size: s, sizeAttenuation: true, transparent: true, opacity: 0.62, depthWrite: false, blending: AdditiveBlending });
    parent.add(new Points(g, m));
    return m;
  };
  return { fine: make(c.pos, c.col, size), bright: make(c.bPos, c.bCol, size * 2) };
}

function glowTexture(sharp: boolean) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (sharp) {
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.45, "rgba(255,255,255,0.95)");
    gr.addColorStop(0.55, "rgba(255,255,255,0.25)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
  } else {
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.3, "rgba(255,255,255,0.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(cv);
}

function makeBird(color: Color, glow: CanvasTexture) {
  const group = new Group();
  const mat = new MeshBasicMaterial({ color, side: DoubleSide });
  const body = new Mesh(new SphereGeometry(0.016, 12, 8), mat);
  body.scale.set(1.25, 0.8, 0.8);
  group.add(body);
  const wing = (sign: number) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute([0, 0.004, 0, sign * 0.07, 0.018, 0, sign * 0.036, -0.014, 0], 3));
    const pivot = new Group();
    pivot.add(new Mesh(g, mat));
    group.add(pivot);
    return pivot;
  };
  const wingL = wing(-1);
  const wingR = wing(1);
  const halo = new Sprite(new SpriteMaterial({ map: glow, color, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.4 }));
  halo.scale.setScalar(0.09);
  group.add(halo);
  return { group, wingL, wingR, halo, mat };
}

/**
 * A full-grown tree, laser-scanned in feel: a thick trunk and nine main boughs, one per feature.
 * Every bough forks again and again into limbs, branches and twigs, ending in tiny leaf clusters.
 * Each bough carries its feature's colour, and every twig end is a glowing point you can hover.
 */
function buildTree(sharp: CanvasTexture, glow: CanvasTexture) {
  const r = rng(23);
  const root = new Group();
  // Fewer points on weaker machines.
  const q = Math.max(0.55, Math.min(1, (navigator.hardwareConcurrency || 4) / 8));
  const bark = new Color(0.55, 0.68, 0.86);
  const rootTone = new Color(0.45, 0.56, 0.72);

  // Trunk, leader and roots
  const trunkPts = Array.from({ length: 14 }, (_, k) => trunkAt(-1.05 + (k * 1.7) / 13));
  const trunkCloud = newCloud();
  shell(trunkCloud, new CatmullRomCurve3(trunkPts), Math.round(15000 * q), 0.105, 0.05, bark, r);
  shell(trunkCloud, new CatmullRomCurve3(Array.from({ length: 5 }, (_, k) => trunkAt(0.6 + (k * 0.5) / 4))), Math.round(2000 * q), 0.05, 0.012, bark, r);
  layers(trunkCloud, sharp, 0.02, root);

  const rootCloud = newCloud();
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + r() * 0.4;
    const len = 0.55 + r() * 0.4;
    const pts = new QuadraticBezierCurve3(trunkAt(-0.95), new Vector3(Math.cos(a) * 0.22, -1.08, Math.sin(a) * 0.22), new Vector3(Math.cos(a) * len, -1.14, Math.sin(a) * len)).getPoints(8);
    const cur = new CatmullRomCurve3(pts);
    shell(rootCloud, cur, Math.round(800 * q), 0.045, 0.006, rootTone, r);
    grow({ c: rootCloud, color: rootTone, r, q, ends: [] }, pts[6], new Vector3(Math.cos(a), -0.15, Math.sin(a)), 0.22, 0.01, 3, 4, -0.02);
  }
  for (let k = 0; k < 1800 * q; k++) {
    const a = r() * Math.PI * 2;
    const d = 0.25 + 1.5 * Math.sqrt(r());
    emit(rootCloud, new Vector3(Math.cos(a) * d, -1.1 + (r() - 0.5) * 0.02, Math.sin(a) * d), rootTone, r);
  }
  layers(rootCloud, sharp, 0.016, root);

  // Unlabelled limbs that fill out the crown.
  const filler = newCloud();
  const fillerTone = new Color(0.5, 0.64, 0.88);
  for (let k = 0; k < 9; k++) {
    const h = 0.1 + r() * 0.75;
    const a = r() * Math.PI * 2;
    grow({ c: filler, color: fillerTone, r, q, ends: [] }, trunkAt(h), new Vector3(Math.cos(a) * 0.8, 0.55, Math.sin(a) * 0.8), 0.46, 0.026, 1, 4, 0.05);
  }
  layers(filler, sharp, 0.018, root);

  // One bough per feature: its whole sub-tree carries the feature's colour.
  const branches = treeStages.map((stage, i) => {
    const col = rgb(stage.color);
    const tint = col.clone().lerp(new Color(1, 1, 1), 0.1);
    const hb = -0.15 + i * 0.1; // where it leaves the trunk
    const th = i * 2.39996; // golden angle: boughs spiral evenly round the trunk
    const base = trunkAt(hb);
    const dir = new Vector3(Math.cos(th) * 0.85, 0.5, -Math.sin(th) * 0.85);
    const g: Grower = { c: newCloud(), color: tint, r, q, ends: [] };
    grow(g, base, dir, 0.78 - i * 0.025, 0.034, 0, 4, 0.05);
    const mats = layers(g.c, sharp, 0.02, root);

    // The main node floats in the middle of the bough's leaves; glowing points mark twig ends.
    const centre = g.ends.reduce((s, p) => s.add(p), new Vector3()).multiplyScalar(1 / Math.max(1, g.ends.length));
    const picks = g.ends.filter((_, k) => k % Math.max(1, Math.floor(g.ends.length / 7)) === 0).slice(0, 7);
    const epGeo = new BufferGeometry().setFromPoints(picks);
    const epMat = new PointsMaterial({ map: glow, color: col, size: 0.075, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: 0.85, blending: AdditiveBlending });
    root.add(new Points(epGeo, epMat));

    const node = new Sprite(new SpriteMaterial({ map: glow, color: col, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.9 }));
    node.position.copy(centre);
    root.add(node);
    const core = new Sprite(new SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.95 }));
    core.scale.setScalar(0.04);
    core.position.copy(centre);
    root.add(core);

    const bird = makeBird(col, glow);
    root.add(bird.group);
    const path = [...trunkPts.filter((p) => p.y < hb), base, base.clone().lerp(centre, 0.5).add(new Vector3(0, 0.05, 0)), centre];
    return { tip: centre, points: [centre, ...picks], col, mats, epMat, node, core, bird, path, perch: new Vector3(centre.x, centre.y + 0.14, centre.z) };
  });

  // Sap: telemetry flowing up the trunk and out along each bough.
  const sapN = 36;
  const sap = Array.from({ length: sapN }, (_, k) => ({ b: k % N, u: Math.random(), speed: 0.003 + Math.random() * 0.004 }));
  const sapGeo = new BufferGeometry();
  sapGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(sapN * 3), 3));
  sapGeo.setAttribute("color", new Float32BufferAttribute(new Float32Array(sapN * 3), 3));
  root.add(new Points(sapGeo, new PointsMaterial({ map: glow, vertexColors: true, size: 0.05, transparent: true, depthWrite: false, blending: AdditiveBlending })));

  // Dust drifting around the tree.
  const moteN = 80;
  const motes = Array.from({ length: moteN }, (_, k) => ({
    p: new Vector3((r() - 0.5) * 3.4, -1.1 + r() * 2.4, (r() - 0.5) * 3.4),
    ph: r() * Math.PI * 2,
    leaf: k % 3 === 0,
    c: rgb(treeStages[Math.floor(r() * N)].color),
  }));
  const moteGeo = new BufferGeometry();
  moteGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(moteN * 3), 3));
  const moteCol: number[] = [];
  motes.forEach((m) => moteCol.push(m.c.r, m.c.g, m.c.b));
  moteGeo.setAttribute("color", new Float32BufferAttribute(moteCol, 3));
  root.add(new Points(moteGeo, new PointsMaterial({ map: sharp, vertexColors: true, size: 0.022, transparent: true, opacity: 0.6, depthWrite: false, blending: AdditiveBlending })));

  const lead = makeBird(new Color(1, 1, 1), glow);
  lead.group.scale.setScalar(1.5);
  lead.group.visible = false;
  root.add(lead.group);

  return { root, branches, sap, sapGeo, motes, moteGeo, lead };
}

function disposeScene(scene: Scene) {
  scene.traverse((o) => {
    const m = o as Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats as (Material & { map?: CanvasTexture | null })[]) {
      mat.map?.dispose();
      mat.dispose();
    }
  });
}

/** Small icons for the control legend. */
const legend = [
  { icon: "M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4", text: "Scroll to fly up the tree" },
  { icon: "M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4", text: "Drag or scroll sideways to turn it" },
  { icon: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0", text: "Hover a glowing point for that agent" },
];

/**
 * The feature tree on WebGL (three.js). One coloured bough per feature, labelled in short. Vertical
 * scroll flies up the tree one feature at a time; dragging, scrolling sideways, or the slider turns
 * it. Hovering any glowing point or branch end opens that agent's flashcard beside it.
 */
export function SdlcTree() {
  const outerRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [rot, setRot] = useState(0);
  const [noGl, setNoGl] = useState(false);
  const reduced = useReducedMotion();
  const active = hoverIdx ?? scrollIdx;

  const anim = useRef<Anim>({
    active: 0,
    scrollIdx: 0,
    hover: -1,
    yaw: -Math.PI / 4,
    targetYaw: -Math.PI / 4,
    uy: 0,
    uyT: 0,
    px: 0,
    py: 0,
    zoom: 1,
    look: new Vector3(),
    flight: null,
    card: { x: 0, y: 0, init: false },
    reduced: false,
  });

  useEffect(() => {
    anim.current.reduced = reduced;
  }, [reduced]);

  useEffect(() => {
    anim.current.active = active;
  }, [active]);

  // Scrolling to a new feature: turn to face it and fly the lead bird there.
  useEffect(() => {
    const a = anim.current;
    if (a.scrollIdx !== scrollIdx && !a.reduced) a.flight = { from: a.scrollIdx, to: scrollIdx, start: performance.now() };
    a.scrollIdx = scrollIdx;
    a.uyT = 0;
    let target = -Math.PI / 4 - scrollIdx * 2.39996;
    target += Math.PI * 2 * Math.round((a.yaw - target) / (Math.PI * 2));
    a.targetYaw = target;
    if (a.reduced) {
      a.yaw = target;
      a.uy = 0;
    }
    const id = setTimeout(() => setRot(0), 0);
    return () => clearTimeout(id);
  }, [scrollIdx]);

  // Vertical scroll position -> feature.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        const i = Math.min(N - 1, Math.floor(p * N));
        setScrollIdx((prev) => (prev === i ? prev : i));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const glCanvas = glRef.current;
    const wrap = wrapRef.current;
    if (!glCanvas || !wrap) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      const id = setTimeout(() => setNoGl(true), 0);
      return () => clearTimeout(id);
    }
    renderer.setClearColor(0x000000, 0);

    const a = anim.current;
    const scene = new Scene();
    const sharp = glowTexture(true);
    const glow = glowTexture(false);
    const tree = buildTree(sharp, glow);
    const cam = new PerspectiveCamera(FOV, 1, 0.1, 40);
    scene.add(tree.root);

    let w = 0;
    let h = 0;
    let d = 6;
    let raf = 0;
    let visible = true;
    let pitch = 0.2;
    let dark: boolean | null = null;
    let hits: { i: number; x: number; y: number; pts: { x: number; y: number }[] }[] = [];
    const tmp = new Vector3();
    const lookT = new Vector3();
    const qInv = new Quaternion();
    const drag = { on: false, x: 0 };

    // Light and dark themes: glowing additive points suit a dark ground; on white they become
    // darker, normally-blended points. The fog fades distant parts into the page colour.
    function applyTheme(isDark: boolean) {
      dark = isDark;
      scene.fog = new Fog(isDark ? 0x0b1220 : 0xf6f8fc, d - 1.4, d + (isDark ? 2.2 : 4.6));
      scene.traverse((o) => {
        if ((o as Points).isPoints) {
          const m = (o as Points).material as PointsMaterial;
          m.blending = isDark ? AdditiveBlending : NormalBlending;
          m.color.setRGB(isDark ? 1 : 0.34, isDark ? 1 : 0.4, isDark ? 1 : 0.56);
          m.needsUpdate = true;
        } else if ((o as Sprite).isSprite) {
          const m = (o as Sprite).material;
          m.blending = isDark ? AdditiveBlending : NormalBlending;
          m.needsUpdate = true;
        }
      });
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap!.clientWidth;
      h = wrap!.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);

      // Fit the whole tree, with room above for the heading and below for the controls.
      const wide = w >= WIDE_W;
      const top = wide ? 80 : 96;
      const bottom = wide ? 112 : h * 0.44;
      const band = Math.max(160, h - top - bottom);
      const tanH = Math.tan((FOV * Math.PI) / 360);
      const dH = 3.3 / ((band / h) * 2 * tanH);
      const dW = (wide ? 5.0 : 4.2) / ((w / h) * 2 * tanH);
      d = Math.max(dH, dW);
      cam.aspect = w / h;
      cam.setViewOffset(w, h, 0, -(top + band / 2 - h / 2), w, h);
      cam.updateProjectionMatrix();
      if (dark !== null) applyTheme(dark);
    }

    // Local (tree) position -> screen pixels.
    const toScreen = (p: Vector3) => {
      tmp.copy(p);
      tree.root.localToWorld(tmp);
      tmp.project(cam);
      return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h };
    };

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible || !w) return;
      const isDark = document.documentElement.dataset.theme !== "light";
      if (isDark !== dark) applyTheme(isDark);
      const t = a.reduced ? 0 : now / 1000;
      const px = a.reduced ? 0 : a.px;
      const py = a.reduced ? 0 : a.py;

      // Orbit: ease toward the scroll feature, add the visitor's sideways turn and the pointer tilt.
      a.yaw += (a.targetYaw - a.yaw) * 0.05;
      a.uy += (a.uyT - a.uy) * (a.reduced ? 1 : 0.14);
      tree.root.rotation.y = a.yaw + a.uy + px * 0.3;
      pitch += (0.17 + py * 0.2 - pitch) * 0.08;
      tree.root.updateMatrixWorld(true);

      // Fly-through: the camera drifts toward the current feature and comes in a little closer.
      const nodeW = tree.root.localToWorld(tmp.copy(tree.branches[a.scrollIdx].tip));
      lookT.set(nodeW.x * 0.25, nodeW.y * 0.25, nodeW.z * 0.25);
      a.look.lerp(lookT, a.reduced ? 1 : 0.05);
      a.zoom += ((a.reduced ? 1 : 0.94) - a.zoom) * 0.04;
      const dist = d * a.zoom;
      cam.position.set(a.look.x, a.look.y + Math.sin(pitch) * dist, a.look.z + Math.cos(pitch) * dist);
      cam.lookAt(a.look);
      cam.updateMatrixWorld(true);

      // The active bough brightens and swells; passed boughs stay lit.
      tree.branches.forEach((b, i) => {
        const on = i === a.active;
        const seen = i <= a.scrollIdx;
        const op = Math.min(1, (on ? 0.95 : seen ? 0.7 : 0.42) * (isDark ? 1 : 1.7)); // points need more weight on a light page
        const sz = on ? 1.25 : 1;
        b.mats.fine.opacity += (op - b.mats.fine.opacity) * 0.1;
        b.mats.bright.opacity += (op - b.mats.bright.opacity) * 0.1;
        b.mats.fine.size += (0.02 * sz - b.mats.fine.size) * 0.1;
        b.mats.bright.size += (0.04 * sz - b.mats.bright.size) * 0.1;
        const pulse = 1 + 0.18 * Math.sin(t * 2.4 + i);
        b.node.scale.setScalar((on ? 0.3 : 0.12) * pulse);
        b.epMat.size += ((on ? 0.11 : 0.075) * pulse - b.epMat.size) * 0.2;
        b.epMat.opacity += ((on ? 1 : 0.8) - b.epMat.opacity) * 0.15;
        const nm = b.node.material as SpriteMaterial;
        nm.opacity += ((on ? 1 : seen ? 0.85 : 0.6) - nm.opacity) * 0.1;
      });

      // Sap
      const sp = tree.sapGeo.getAttribute("position");
      const sc = tree.sapGeo.getAttribute("color");
      tree.sap.forEach((s, k) => {
        if (!a.reduced) s.u += s.speed;
        if (s.u >= 1) Object.assign(s, { u: 0, b: Math.floor(Math.random() * N) });
        const path = tree.branches[s.b].path;
        const f = s.u * (path.length - 1);
        const i0 = Math.floor(f);
        const p0 = path[i0];
        const p1 = path[Math.min(i0 + 1, path.length - 1)];
        sp.setXYZ(k, p0.x + (p1.x - p0.x) * (f - i0), p0.y + (p1.y - p0.y) * (f - i0), p0.z + (p1.z - p0.z) * (f - i0));
        const c = tree.branches[s.b].col;
        sc.setXYZ(k, c.r, c.g, c.b);
      });
      sp.needsUpdate = true;
      sc.needsUpdate = true;

      // Dust
      const mp = tree.moteGeo.getAttribute("position");
      tree.motes.forEach((m, k) => {
        if (!a.reduced) {
          m.p.y += m.leaf ? -0.0009 : 0.0007;
          m.p.x += Math.sin(t * 0.6 + m.ph) * 0.0008;
          if (m.p.y < -1.1) m.p.y = 1.2;
          if (m.p.y > 1.3) m.p.y = -1.05;
        }
        mp.setXYZ(k, m.p.x, m.p.y, m.p.z);
      });
      mp.needsUpdate = true;

      // Birds (billboarded so the wings always face the viewer) perched above each main node.
      qInv.copy(tree.root.quaternion).invert().multiply(cam.quaternion);
      const flight = a.flight && now - a.flight.start < FLIGHT_MS ? a.flight : null;
      if (!flight) a.flight = null;
      hits = [];
      tree.branches.forEach((b, i) => {
        const on = i === a.active;
        b.bird.group.position.set(b.perch.x, b.perch.y + 0.012 * Math.sin(t * 2 + i), b.perch.z);
        b.bird.group.quaternion.copy(qInv);
        b.bird.group.scale.setScalar(b.bird.group.scale.x + ((on ? 1.5 : 0.9) - b.bird.group.scale.x) * 0.15);
        b.bird.group.visible = !(flight && flight.to === i);
        const flap = 0.35 + 0.25 * Math.sin(t * 7 + i * 1.7);
        b.bird.wingL.rotation.z = flap;
        b.bird.wingR.rotation.z = -flap;
        (b.bird.halo.material as SpriteMaterial).opacity = on ? 0.7 : 0.25;
        const pts = b.points.map((p) => toScreen(p));
        hits.push({ i, x: pts[0].x, y: pts[0].y, pts });
      });

      // Lead agent flying from the previous feature to the next.
      if (flight) {
        const p = Math.min(1, (now - flight.start) / FLIGHT_MS);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const A = tree.branches[flight.from].perch;
        const B = tree.branches[flight.to].perch;
        const pos = new Vector3().lerpVectors(A, B, e);
        pos.y += Math.sin(Math.PI * e) * 0.4;
        tree.lead.group.visible = true;
        tree.lead.group.position.copy(pos);
        tree.lead.group.quaternion.copy(qInv);
        const flap = Math.sin(now / 55) * 0.6;
        tree.lead.wingL.rotation.z = flap;
        tree.lead.wingR.rotation.z = -flap;
        const col = tree.branches[flight.to].col;
        tree.lead.mat.color.copy(col);
        (tree.lead.halo.material as SpriteMaterial).color.copy(col);
      } else {
        tree.lead.group.visible = false;
      }

      renderer.render(scene, cam);

      // Short labels on each branch, and the agent's flashcard beside the active one.
      const wide = w >= WIDE_W;
      const treeCx = toScreen(new Vector3(0, 0, 0)).x;
      hits.forEach((hit) => {
        const el = labelRefs.current[hit.i];
        if (!el) return;
        const right = hit.x >= treeCx;
        el.style.transform = `translate(${right ? hit.x + 18 : hit.x - 18}px, ${hit.y - 12}px) translateX(${right ? "0" : "-100%"})`;
        el.style.opacity = hit.i === a.active && wide ? "0" : "1";
        el.style.textAlign = right ? "left" : "right";
      });
      const cardEl = cardRef.current;
      const act = hits.find((x) => x.i === a.active);
      if (cardEl && act) {
        if (wide) {
          const cw = cardEl.offsetWidth;
          const ch = cardEl.offsetHeight;
          const right = act.x >= treeCx - 30;
          const tx = clamp(right ? act.x + 56 : act.x - 56 - cw, 12, w - cw - 12);
          const ty = clamp(act.y - ch * 0.3, 70, Math.max(70, h - ch - 110));
          const c = a.card;
          if (!c.init) Object.assign(c, { x: tx, y: ty, init: true });
          const ease = a.reduced ? 1 : 0.16;
          c.x += (tx - c.x) * ease;
          c.y += (ty - c.y) * ease;
          cardEl.style.transform = `translate(${c.x}px, ${c.y}px)`;
        } else {
          cardEl.style.transform = "";
        }
      }
    }

    const turn = (delta: number) => {
      a.uyT += delta;
      setRot(Math.round(wrapDeg((a.uyT * 180) / Math.PI)));
    };
    const down = (e: PointerEvent) => {
      drag.on = true;
      drag.x = e.clientX;
      glCanvas.setPointerCapture(e.pointerId);
    };
    const up = () => {
      drag.on = false;
      glCanvas.style.cursor = a.hover >= 0 ? "pointer" : "grab";
    };
    // Hover only for a real mouse; on touch, scrolling drives the tree. Any glowing point of a
    // feature (its main node or any twig end) selects it. A wider radius once hovering keeps the
    // card from flickering.
    const move = (e: PointerEvent) => {
      if (drag.on) {
        turn((e.clientX - drag.x) * 0.009);
        drag.x = e.clientX;
        glCanvas.style.cursor = "grabbing";
        return;
      }
      if (e.pointerType !== "mouse") return;
      const r = glCanvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      a.px = x / r.width - 0.5;
      a.py = y / r.height - 0.5;
      let best = -1;
      let bd = Infinity;
      for (const hit of hits) {
        const reach = (a.hover === hit.i ? 40 : 28) ** 2;
        for (const p of hit.pts) {
          const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (dd < reach && dd < bd) {
            bd = dd;
            best = hit.i;
          }
        }
      }
      if (best !== a.hover) {
        a.hover = best;
        setHoverIdx(best >= 0 ? best : null);
      }
      glCanvas.style.cursor = best >= 0 ? "pointer" : "grab";
    };
    const leave = () => {
      a.px = a.py = 0;
      if (a.hover !== -1) {
        a.hover = -1;
        setHoverIdx(null);
      }
    };
    // Sideways wheel or trackpad scrolling turns the tree; vertical scrolling still moves the page.
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 && Math.abs(e.deltaX) > 1) {
        e.preventDefault();
        turn(e.deltaX * 0.004);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);
    glCanvas.addEventListener("pointerdown", down);
    glCanvas.addEventListener("pointerup", up);
    glCanvas.addEventListener("pointercancel", up);
    glCanvas.addEventListener("pointermove", move);
    glCanvas.addEventListener("pointerleave", leave);
    wrap.addEventListener("wheel", wheel, { passive: false });
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      glCanvas.removeEventListener("pointerdown", down);
      glCanvas.removeEventListener("pointerup", up);
      glCanvas.removeEventListener("pointercancel", up);
      glCanvas.removeEventListener("pointermove", move);
      glCanvas.removeEventListener("pointerleave", leave);
      wrap.removeEventListener("wheel", wheel);
      disposeScene(scene);
      sharp.dispose();
      glow.dispose();
      renderer.dispose();
    };
  }, []);

  function go(i: number) {
    const el = outerRef.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top + ((i + 0.5) / N) * (el.offsetHeight - window.innerHeight);
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }

  const s = treeStages[active];
  const col = `rgb(${s.color})`;

  const detail = (
    <div key={active} className="fade-in">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {pad(active + 1)} / {pad(N)} &middot; <span style={{ color: col }}>{s.agent}</span>
      </p>
      <h3 className="font-display mt-1.5 text-2xl font-medium leading-tight">{s.title}</h3>
      <p className="mt-2 text-sm text-muted">{s.does}</p>
      <ul className="mt-3 hidden space-y-1 text-sm min-[1100px]:block">
        {s.details.map((dd) => (
          <li key={dd} className="flex gap-2">
            <span aria-hidden style={{ color: col }}>&#10003;</span>
            {dd}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <span className="font-mono text-xs uppercase text-warn">You approve </span>
        {s.gate}
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {s.tech.map((tg) => (
          <li key={tg} className="rounded-md border px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: `rgba(${s.color},0.5)`, color: col }}>
            {tg}
          </li>
        ))}
        {s.outputs.map((o) => (
          <li key={o} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
            {o}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      ref={outerRef}
      aria-label="The nine features, one branch each"
      className="relative overscroll-x-contain"
      style={{ height: `${N * 30 + 100}vh` }}
    >
      <div className="sticky top-20 h-[calc(100svh-5rem)] w-full overflow-hidden">
        <div ref={wrapRef} className="absolute inset-0">
          <canvas
            ref={glRef}
            role="img"
            aria-label={`Tree of nine features, one per branch. Current: ${s.title}. Drag sideways to turn it.`}
            className="absolute inset-0 h-full w-full cursor-grab"
            style={{ touchAction: "pan-y" }}
          />
          {/* A short label on every branch. */}
          {treeStages.map((st, i) => (
            <div
              key={st.short}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 max-w-[10.5rem] rounded-md bg-background/55 px-1.5 py-0.5 leading-tight backdrop-blur-[2px] transition-opacity duration-200"
              style={{ transform: "translate(-300px,-300px)" }}
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-wide sm:text-xs" style={{ color: `rgb(${st.color})` }}>
                {pad(i + 1)} {st.short}
              </p>
              <p className="mt-0.5 hidden text-xs text-muted min-[1100px]:block">{st.tagline}</p>
            </div>
          ))}
        </div>

        <div className="absolute left-6 top-3 z-10 min-[1100px]:left-10">
          <p className="font-mono text-xs uppercase tracking-wider text-accent sm:text-sm">Plan to production</p>
          <h2 className="hidden text-xl font-medium tracking-tight sm:block sm:text-2xl">Nine features. Nine agents. You approve.</h2>
        </div>
        <a
          href="#products"
          className="absolute right-6 top-3 z-10 rounded-full border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur transition-colors hover:border-accent hover:text-foreground min-[1100px]:right-16"
        >
          Skip journey &darr;
        </a>

        {/* Wide screens: the agent's flashcard, floating beside the point you hover. */}
        <aside
          ref={cardRef}
          aria-live="polite"
          className="absolute left-0 top-0 z-20 hidden w-[22rem] rounded-2xl border bg-surface/95 p-5 shadow-2xl backdrop-blur min-[1100px]:block"
          style={{ borderColor: `rgba(${s.color},0.6)`, boxShadow: `0 20px 60px -20px rgba(${s.color},0.35)` }}
        >
          {detail}
        </aside>

        {/* Smaller screens: the same details in a card at the bottom. */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3 min-[1100px]:hidden">
          <aside aria-live="polite" className="max-h-[38svh] overflow-y-auto rounded-2xl border bg-surface/95 p-4 backdrop-blur" style={{ borderColor: `rgba(${s.color},0.5)` }}>
            {detail}
          </aside>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Features">
            {treeStages.map((st, i) => (
              <button
                key={st.short}
                aria-current={i === active ? "step" : undefined}
                onClick={() => go(i)}
                className="shrink-0 whitespace-nowrap rounded-full border bg-background/70 px-3 py-1 text-xs"
                style={i === active ? { borderColor: col, color: col } : { borderColor: "var(--border)", color: "var(--muted)" }}
              >
                <span className="font-mono opacity-70">{pad(i + 1)}</span> {st.short}
              </button>
            ))}
          </div>
        </div>

        {/* Wide screens: the nine features as a strip, how to explore, and a control to turn the tree. */}
        <div className="absolute inset-x-0 bottom-3 z-10 hidden flex-col items-center gap-2.5 px-6 min-[1100px]:flex">
          <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Features" onMouseLeave={() => setHoverIdx(null)}>
            {treeStages.map((st, i) => (
              <button
                key={st.short}
                aria-current={i === active ? "step" : undefined}
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                onClick={() => go(i)}
                className="whitespace-nowrap rounded-full border bg-background/70 px-3 py-1 text-xs backdrop-blur transition-colors"
                style={i === active ? { borderColor: `rgb(${st.color})`, background: `rgba(${st.color},0.12)`, color: `rgb(${st.color})` } : { borderColor: "var(--border)", color: "var(--muted)" }}
              >
                <span className="font-mono opacity-70">{pad(i + 1)}</span> {st.short}
              </button>
            ))}
          </div>
          {noGl ? (
            <p className="text-sm text-muted">Your browser cannot draw the 3D tree; the features are listed above.</p>
          ) : (
            <ul className="flex items-center gap-6 text-sm text-muted">
              {legend.map((l) => (
                <li key={l.text} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={l.icon} />
                  </svg>
                  {l.text}
                </li>
              ))}
              <li>
                <label className="flex items-center gap-2 font-mono text-xs">
                  <span>Turn</span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={rot}
                    onChange={(e) => {
                      const deg = Number(e.target.value);
                      anim.current.uyT = (deg * Math.PI) / 180;
                      setRot(deg);
                    }}
                    aria-label="Turn the tree"
                    className="w-36 accent-[var(--accent)]"
                  />
                </label>
              </li>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
