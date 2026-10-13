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
import { drawSplat, makeSplat, type Splat } from "@/lib/splat";

type Rng = () => number;
type Anim = {
  active: number;
  scrollIdx: number;
  hover: number;
  yaw: number;
  targetYaw: number;
  px: number;
  py: number;
  cam: number;
  flight: { from: number; to: number; start: number } | null;
  queue: { i: number; big: boolean }[];
  lastSplat: number[];
  reduced: boolean;
};
type Cloud = { pos: number[]; col: number[]; bPos: number[]; bCol: number[] };

const N = treeStages.length;
const FLIGHT_MS = 1300;
const WIDE_W = 1100; // at this width and above: stage list on the left, text on the right
const FOV = 34;
const TREE_X = 0.4; // where the tree sits across a wide screen (leaves room for the text on the right)
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AMBER = new Color(1, 0.62, 0.26);
const pad = (n: number) => String(n).padStart(2, "0");
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

const trunkAt = (y: number) => new Vector3(0.025 * Math.sin(y * 3.2), y, -0.02 * Math.cos(y * 2.4));

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

/** Fine twigs that fork off a curve, and smaller twigs off those. */
function twigs(c: Cloud, curve: CatmullRomCurve3, n: number, len: number, color: Color, r: Rng, depth: number) {
  for (let k = 0; k < n; k++) {
    const u = 0.2 + 0.75 * r();
    const base = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const dir = new Vector3(tan.x + (r() - 0.5) * 1.4, tan.y + 0.15 + (r() - 0.3) * 0.6, tan.z + (r() - 0.5) * 1.4).normalize();
    const L = len * (0.6 + 0.8 * r());
    const mid = base.clone().addScaledVector(dir, L * 0.5).add(new Vector3((r() - 0.5) * L * 0.3, (r() - 0.5) * L * 0.2, (r() - 0.5) * L * 0.3));
    const end = base.clone().addScaledVector(dir, L).add(new Vector3(0, L * 0.1, 0));
    const cur = new CatmullRomCurve3([base, mid, end]);
    shell(c, cur, Math.round(50 + L * 450), 0.0055, 0.0015, color, r);
    if (depth > 0) twigs(c, cur, 2, L * 0.55, color, r, depth - 1);
  }
}

function foliage(c: Cloud, centre: Vector3, radius: number, count: number, color: Color, r: Rng) {
  for (let k = 0; k < count; k++) {
    const u = r() * Math.PI * 2;
    const v = Math.acos(2 * r() - 1);
    const d = radius * Math.pow(r(), 0.55);
    emit(c, new Vector3(centre.x + d * Math.sin(v) * Math.cos(u), centre.y + d * Math.cos(v) * 0.7, centre.z + d * Math.sin(v) * Math.sin(u)), color, r);
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
  const body = new Mesh(new SphereGeometry(0.014, 12, 8), mat);
  body.scale.set(1.25, 0.8, 0.8);
  group.add(body);
  const wing = (sign: number) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute([0, 0.004, 0, sign * 0.062, 0.016, 0, sign * 0.032, -0.012, 0], 3));
    const pivot = new Group();
    pivot.add(new Mesh(g, mat));
    group.add(pivot);
    return pivot;
  };
  const wingL = wing(-1);
  const wingR = wing(1);
  const halo = new Sprite(new SpriteMaterial({ map: glow, color, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.4 }));
  halo.scale.setScalar(0.08);
  group.add(halo);
  return { group, wingL, wingR, halo, mat };
}

function buildTree(sharp: CanvasTexture, glow: CanvasTexture) {
  const r = rng(7);
  const root = new Group();

  // Trunk and roots
  const trunkPts = Array.from({ length: 12 }, (_, k) => trunkAt(-1.05 + (k * 1.95) / 11));
  const trunkCloud = newCloud();
  shell(trunkCloud, new CatmullRomCurve3(trunkPts), 6500, 0.06, 0.017, new Color(0.55, 0.68, 0.86), r);
  layers(trunkCloud, sharp, 0.02, root);
  const rootCloud = newCloud();
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + r() * 0.4;
    const len = 0.5 + r() * 0.3;
    const pts = new QuadraticBezierCurve3(trunkAt(-1.0), new Vector3(Math.cos(a) * 0.2, -1.1, Math.sin(a) * 0.2), new Vector3(Math.cos(a) * len, -1.16, Math.sin(a) * len)).getPoints(8);
    const cur = new CatmullRomCurve3(pts);
    shell(rootCloud, cur, 700, 0.032, 0.005, new Color(0.45, 0.56, 0.72), r);
    twigs(rootCloud, cur, 4, 0.14, new Color(0.45, 0.56, 0.72), r, 1);
  }
  layers(rootCloud, sharp, 0.018, root);

  // One branch per stage, each its own colour and its own glowing node.
  const branches = treeStages.map((stage, i) => {
    const col = rgb(stage.color);
    const tint = col.clone().lerp(new Color(1, 1, 1), 0.1);
    const h = -0.72 + i * 0.17;
    const th = i * 2.39996; // golden angle: branches spiral evenly around the trunk
    const R = 0.72 + (i % 3) * 0.09;
    const base = trunkAt(h);
    const ctrl = new Vector3(Math.cos(th) * R * 0.45, h + 0.04, -Math.sin(th) * R * 0.45);
    const tip = new Vector3(Math.cos(th) * R, h + 0.3, -Math.sin(th) * R);
    const pts = new QuadraticBezierCurve3(base, ctrl, tip).getPoints(14);
    const curve = new CatmullRomCurve3(pts);

    const c = newCloud();
    shell(c, curve, 1300, 0.022, 0.006, tint, r);
    twigs(c, curve, 10, 0.22, tint, r, 1);
    foliage(c, tip, 0.17, 500, tint, r);
    const mats = layers(c, sharp, 0.02, root);

    const node = new Sprite(new SpriteMaterial({ map: glow, color: col, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.9 }));
    node.position.copy(tip);
    root.add(node);
    const core = new Sprite(new SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.95 }));
    core.scale.setScalar(0.035);
    core.position.copy(tip);
    root.add(core);

    const bird = makeBird(col, glow);
    root.add(bird.group);
    const path = [...trunkPts.filter((p) => p.y < h), ...pts];
    return { tip, col, mats, node, core, bird, path, perch: new Vector3(tip.x, tip.y + 0.09, tip.z) };
  });

  // Crown
  const crown = newCloud();
  foliage(crown, new Vector3(0, 0.98, 0), 0.2, 700, new Color(0.45, 0.75, 1), r);
  layers(crown, sharp, 0.02, root);

  // Sap: telemetry flowing up the trunk and out to each stage.
  const sapN = 30;
  const sap = Array.from({ length: sapN }, (_, k) => ({ b: k % N, u: Math.random(), speed: 0.003 + Math.random() * 0.004 }));
  const sapGeo = new BufferGeometry();
  sapGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(sapN * 3), 3));
  sapGeo.setAttribute("color", new Float32BufferAttribute(new Float32Array(sapN * 3), 3));
  root.add(new Points(sapGeo, new PointsMaterial({ map: glow, vertexColors: true, size: 0.05, transparent: true, depthWrite: false, blending: AdditiveBlending })));

  // Dust drifting around the tree.
  const moteN = 70;
  const motes = Array.from({ length: moteN }, (_, k) => ({
    p: new Vector3((r() - 0.5) * 3, -1.1 + r() * 2.3, (r() - 0.5) * 3),
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

  // Trail behind the lead bird while it flies between stages.
  const trailN = 18;
  const trailGeo = new BufferGeometry();
  trailGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(trailN * 3), 3));
  trailGeo.setAttribute("color", new Float32BufferAttribute(new Float32Array(trailN * 3), 3));
  const trail = new Points(trailGeo, new PointsMaterial({ map: glow, vertexColors: true, size: 0.05, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  trail.visible = false;
  root.add(trail);

  const lead = makeBird(new Color(1, 1, 1), glow);
  lead.group.scale.setScalar(1.5);
  lead.group.visible = false;
  root.add(lead.group);

  return { root, branches, sap, sapGeo, motes, moteGeo, trail, trailGeo, trailN, lead };
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

function queueSplat(a: Anim, i: number, big: boolean) {
  const now = performance.now();
  if (!big && (a.reduced || now - a.lastSplat[i] < 1500)) return;
  a.lastSplat[i] = now;
  a.queue.push({ i, big });
}

/**
 * Full-bleed point-cloud tree on WebGL (three.js). The section pins to the screen; scrolling climbs
 * the tree one stage at a time. On a wide screen the stages are listed on the left and the active
 * stage's text sits on the right. Hovering a glowing node previews its stage. The pointer tilts
 * the view, and a 2D layer behind the tree paints a splash on each stage.
 */
export function SdlcTree() {
  const outerRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const medalRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [noGl, setNoGl] = useState(false);
  const reduced = useReducedMotion();
  const active = hoverIdx ?? scrollIdx;

  const anim = useRef<Anim>({
    active: 0,
    scrollIdx: 0,
    hover: -1,
    yaw: -Math.PI / 4,
    targetYaw: -Math.PI / 4,
    px: 0,
    py: 0,
    cam: 0,
    flight: null,
    queue: [],
    lastSplat: Array(N).fill(-1e9),
    reduced: false,
  });

  useEffect(() => {
    anim.current.reduced = reduced;
  }, [reduced]);

  useEffect(() => {
    anim.current.active = active;
  }, [active]);

  // Scrolling to a new stage: turn to face it, fly the lead bird there, and splash its colour.
  useEffect(() => {
    const a = anim.current;
    if (a.scrollIdx !== scrollIdx && !a.reduced) a.flight = { from: a.scrollIdx, to: scrollIdx, start: performance.now() };
    a.scrollIdx = scrollIdx;
    queueSplat(a, scrollIdx, true);
    let target = -Math.PI / 4 - scrollIdx * 2.39996;
    target += Math.PI * 2 * Math.round((a.yaw - target) / (Math.PI * 2));
    a.targetYaw = target;
    if (a.reduced) a.yaw = target;
  }, [scrollIdx]);

  // Scroll position -> stage.
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
    const fxCanvas = fxRef.current;
    const wrap = wrapRef.current;
    const fx = fxCanvas?.getContext("2d");
    if (!glCanvas || !fxCanvas || !wrap || !fx) return;

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
    let pxPerUnit = 300;
    let raf = 0;
    let visible = true;
    let pitch = 0.2;
    let hits: { i: number; x: number; y: number }[] = [];
    let splats: { i: number; s: Splat }[] = [];
    const flightHist: Vector3[] = [];
    const tmp = new Vector3();
    const qInv = new Quaternion();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap!.clientWidth;
      h = wrap!.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      fxCanvas!.width = w * dpr;
      fxCanvas!.height = h * dpr;
      fx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fit the whole tree: on a wide screen it sits left of centre, leaving room for the text.
      const wide = w >= WIDE_W;
      const top = wide ? 72 : 96;
      const bottom = wide ? 64 : h * 0.44;
      const band = Math.max(160, h - top - bottom);
      const tanH = Math.tan((FOV * Math.PI) / 360);
      const dH = 2.75 / ((band / h) * 2 * tanH);
      const dW = (wide ? 3.7 : 2.1) / ((w / h) * 2 * tanH);
      d = Math.max(dH, dW);
      pxPerUnit = h / (2 * tanH * d);
      cam.aspect = w / h;
      cam.setViewOffset(w, h, wide ? w * (0.5 - TREE_X) : 0, -(top + band / 2 - h / 2), w, h);
      cam.updateProjectionMatrix();
      scene.fog = new Fog(0x05070a, d - 0.9, d + 2.8);
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
      const t = a.reduced ? 0 : now / 1000;
      const px = a.reduced ? 0 : a.px;
      const py = a.reduced ? 0 : a.py;

      // Camera: ease toward the scroll stage, drift a little, and tilt with the pointer.
      a.yaw += (a.targetYaw - a.yaw) * 0.05;
      tree.root.rotation.y = a.yaw + px * 0.5;
      pitch += (0.17 + py * 0.22 - pitch) * 0.08;
      const camTarget = tree.branches[a.scrollIdx].tip.y * 0.1;
      a.cam += (camTarget - a.cam) * (a.reduced ? 1 : 0.045);
      cam.position.set(0, a.cam + Math.sin(pitch) * d, Math.cos(pitch) * d);
      cam.lookAt(0, a.cam, 0);
      cam.updateMatrixWorld(true);
      tree.root.updateMatrixWorld(true);

      // The active branch brightens and swells; passed branches stay lit.
      tree.branches.forEach((b, i) => {
        const on = i === a.active;
        const seen = i <= a.scrollIdx;
        const op = on ? 0.95 : seen ? 0.7 : 0.42;
        const sz = on ? 1.25 : 1;
        b.mats.fine.opacity += (op - b.mats.fine.opacity) * 0.1;
        b.mats.bright.opacity += (op - b.mats.bright.opacity) * 0.1;
        b.mats.fine.size += (0.02 * sz - b.mats.fine.size) * 0.1;
        b.mats.bright.size += (0.04 * sz - b.mats.bright.size) * 0.1;
        const pulse = 1 + 0.18 * Math.sin(t * 2.4 + i);
        b.node.scale.setScalar((on ? 0.24 : 0.1) * pulse);
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
          if (m.p.y < -1.1) m.p.y = 1.15;
          if (m.p.y > 1.2) m.p.y = -1.05;
        }
        mp.setXYZ(k, m.p.x, m.p.y, m.p.z);
      });
      mp.needsUpdate = true;

      // Birds (billboarded so the wings always face the viewer) perched above each node.
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
        const s2 = toScreen(b.tip);
        hits.push({ i, x: s2.x, y: s2.y });
      });

      // The medallion sits on the trunk, like the reference's centre circle.
      const medal = medalRef.current;
      if (medal) {
        const m = toScreen(new Vector3(0, -0.05, 0));
        const half = medal.offsetWidth / 2;
        medal.style.transform = `translate(${m.x - half}px, ${m.y - half}px)`;
      }

      // Lead agent flying the flow from the previous stage to the next.
      if (flight) {
        const p = Math.min(1, (now - flight.start) / FLIGHT_MS);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const A = tree.branches[flight.from].perch;
        const B = tree.branches[flight.to].perch;
        const pos = new Vector3().lerpVectors(A, B, e);
        pos.y += Math.sin(Math.PI * e) * 0.35;
        tree.lead.group.visible = true;
        tree.lead.group.position.copy(pos);
        tree.lead.group.quaternion.copy(qInv);
        const flap = Math.sin(now / 55) * 0.6;
        tree.lead.wingL.rotation.z = flap;
        tree.lead.wingR.rotation.z = -flap;
        const col = tree.branches[flight.to].col;
        tree.lead.mat.color.copy(col);
        (tree.lead.halo.material as SpriteMaterial).color.copy(col);
        flightHist.push(pos.clone());
        if (flightHist.length > tree.trailN) flightHist.shift();
        const tp = tree.trailGeo.getAttribute("position");
        const tc = tree.trailGeo.getAttribute("color");
        for (let k = 0; k < tree.trailN; k++) {
          const hp = flightHist[Math.min(k, flightHist.length - 1)] ?? pos;
          const fade = (k / tree.trailN) * 0.8;
          tp.setXYZ(k, hp.x, hp.y, hp.z);
          tc.setXYZ(k, col.r * fade, col.g * fade, col.b * fade);
        }
        tp.needsUpdate = true;
        tc.needsUpdate = true;
        tree.trail.visible = true;
      } else {
        tree.lead.group.visible = false;
        tree.trail.visible = false;
        flightHist.length = 0;
      }

      renderer.render(scene, cam);

      // 2D layer behind the tree: paint splashes.
      fx!.clearRect(0, 0, w, h);
      fx!.globalCompositeOperation = "lighter";
      for (const q of a.queue.splice(0)) {
        splats.push({ i: q.i, s: makeSplat(q.big, now) });
        const bigOnes = splats.filter((s) => s.s.big);
        if (bigOnes.length > 9) splats = splats.filter((s) => s !== bigOnes[0]);
      }
      splats = splats.filter((s) => s.s.big || a.reduced || now - s.s.born < 2600);
      for (const sp2 of splats) {
        const age = a.reduced ? 0.7 : (now - sp2.s.born) / 1000;
        const at = toScreen(tree.branches[sp2.i].tip);
        drawSplat(fx!, sp2.s, at.x, at.y, (sp2.s.big ? 0.3 : 0.16) * pxPerUnit, age, treeStages[sp2.i].color, sp2.s.big ? 10 : 2.6, sp2.s.big ? 0.16 : 0, 0.8);
      }
      fx!.globalCompositeOperation = "source-over";
    }

    // Hover only for a real mouse; on touch, scrolling drives the tree. A wider radius once
    // hovering keeps the preview from flickering at the edge of a node.
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = glCanvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      a.px = x / r.width - 0.5;
      a.py = y / r.height - 0.5;
      let best = -1;
      let bd = (a.hover >= 0 ? 44 : 32) ** 2;
      for (const hit of hits) {
        const dd = (hit.x - x) ** 2 + (hit.y - y) ** 2;
        if (dd < bd) {
          bd = dd;
          best = hit.i;
        }
      }
      if (best !== a.hover) {
        a.hover = best;
        setHoverIdx(best >= 0 ? best : null);
        if (best >= 0) queueSplat(a, best, false);
      }
      glCanvas.style.cursor = best >= 0 ? "pointer" : "default";
    };
    const leave = () => {
      a.px = a.py = 0;
      if (a.hover !== -1) {
        a.hover = -1;
        setHoverIdx(null);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);
    glCanvas.addEventListener("pointermove", move);
    glCanvas.addEventListener("pointerleave", leave);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      glCanvas.removeEventListener("pointermove", move);
      glCanvas.removeEventListener("pointerleave", leave);
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

  function preview(i: number | null) {
    setHoverIdx(i);
    if (i !== null) queueSplat(anim.current, i, false);
  }

  const s = treeStages[active];
  const col = `rgb(${s.color})`;

  return (
    <section
      ref={outerRef}
      aria-label="Plan to production in nine stages"
      className="relative"
      style={{ height: `${N * 30 + 100}vh` }}
    >
      <div className="sticky top-20 h-[calc(100svh-5rem)] w-full overflow-hidden">
        <div ref={wrapRef} className="absolute inset-0">
          <canvas ref={fxRef} aria-hidden className="absolute inset-0 h-full w-full" />
          <canvas
            ref={glRef}
            role="img"
            aria-label={`3D tree of nine SDLC stages. Current stage ${active + 1}: ${s.title}.`}
            className="absolute inset-0 h-full w-full"
          />
          <div
            ref={medalRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 flex h-16 w-16 flex-col items-center justify-center rounded-full border bg-black/80 text-center backdrop-blur-sm min-[1100px]:h-32 min-[1100px]:w-32"
            style={{ transform: "translate(-300px,-300px)", borderColor: `rgba(${s.color},0.6)`, boxShadow: `0 0 36px rgba(${s.color},0.25)` }}
          >
            <span key={active} className="fade-in font-mono text-xl font-light min-[1100px]:text-3xl" style={{ color: col }}>{pad(active + 1)}</span>
            <span className="mt-0.5 hidden px-2 font-mono text-[10px] leading-tight text-muted min-[1100px]:block">{s.agent}</span>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_52%,transparent_42%,var(--background)_100%)]" aria-hidden />

        <div className="absolute left-6 top-3 z-10 min-[1100px]:left-10">
          <p className="font-mono text-xs text-accent sm:text-sm">Plan to production</p>
          <h2 className="hidden text-xl font-medium tracking-tight sm:block sm:text-2xl">Nine stages. Nine agents. You approve.</h2>
        </div>
        <a
          href="#products"
          className="absolute right-6 top-3 z-10 rounded-full border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur transition-colors hover:border-accent hover:text-foreground min-[1100px]:right-16"
        >
          Skip journey &darr;
        </a>

        {/* Wide screens: the stage list. The active one is bright and the rest fade. */}
        <ul className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 min-[1100px]:left-10 min-[1100px]:block" aria-label="Stages" onMouseLeave={() => setHoverIdx(null)}>
          {treeStages.map((st, i) => {
            const dist = Math.abs(i - active);
            return (
              <li key={st.short}>
                <button
                  onMouseEnter={() => preview(i)}
                  onFocus={() => preview(i)}
                  onBlur={() => setHoverIdx(null)}
                  onClick={() => go(i)}
                  aria-current={i === active ? "step" : undefined}
                  className="group relative flex items-baseline gap-3 py-[7px] pl-4 text-left transition-all duration-300"
                  style={{ opacity: Math.max(0.28, 1 - dist * 0.15) }}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full transition-all duration-300"
                    style={{ height: i === active ? 22 : 0, background: `rgb(${st.color})` }}
                  />
                  <span className="font-mono text-xs text-muted">{pad(i + 1)}</span>
                  <span className={`transition-all duration-300 ${i === active ? "text-xl font-medium text-foreground" : "text-base text-muted group-hover:text-foreground"}`}>{st.short}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Wide screens: large, light text on the right, with no box around it. */}
        <aside aria-live="polite" className="absolute right-[5%] top-1/2 z-10 hidden w-[24rem] -translate-y-1/2 min-[1100px]:block min-[1500px]:right-[7%]">
          <div key={active} className="fade-in">
            <p className="font-mono text-xs text-muted">
              Stage {pad(active + 1)} of {pad(N)} &middot; <span style={{ color: col }}>{s.agent}</span>
            </p>
            <h3 className="mt-2 text-5xl font-light leading-[1.05] tracking-tight">{s.title}</h3>
            <p className="mt-4 text-base text-muted">{s.does}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              {s.details.map((dd) => (
                <li key={dd} className="flex gap-2">
                  <span aria-hidden style={{ color: col }}>&#10003;</span>
                  {dd}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm">
              <span className="font-mono text-xs text-warn">YOU APPROVE </span>
              {s.gate}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {s.outputs.map((o) => (
                <li key={o} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: `rgba(${s.color},0.5)` }}>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Smaller screens: the same text in a card at the bottom, and the stages as a scrolling strip. */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3 min-[1100px]:hidden">
          <aside aria-live="polite" className="max-h-[38svh] overflow-y-auto rounded-2xl border bg-surface/90 p-4 backdrop-blur" style={{ borderColor: `rgba(${s.color},0.5)` }}>
            <div key={active} className="fade-in">
              <p className="font-mono text-xs text-muted">
                {pad(active + 1)} / {pad(N)} &middot; <span style={{ color: col }}>{s.agent}</span>
              </p>
              <h3 className="mt-1 text-xl font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.does}</p>
              <p className="mt-2 text-sm">
                <span className="font-mono text-xs text-warn">YOU APPROVE </span>
                {s.gate}
              </p>
            </div>
          </aside>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Stages">
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

        <p className="pointer-events-none absolute inset-x-0 bottom-5 z-10 hidden px-6 text-center text-sm text-muted min-[1100px]:block">
          {noGl ? "Your browser cannot draw the 3D tree; the stages are listed on the left." : "Start scrolling, or hover a glowing point, to meet each agent"}
        </p>
      </div>
    </section>
  );
}
