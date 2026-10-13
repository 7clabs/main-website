"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { treeStages } from "@/app/content";

type V = { x: number; y: number; z: number };
type Leaf = V & { ph: number };
type Branch = { pts: V[]; twigs: V[][]; leaves: Leaf[]; tip: V; color: string; path: V[] };
type Proj = { x: number; y: number; z: number; s: number };
type Splat = {
  i: number;
  born: number;
  big: boolean;
  radii: number[];
  drops: { a: number; d: number; r: number }[];
  drips: { dx: number; len: number; w: number }[];
};
type Mote = V & { ph: number; leaf: boolean; c: string };
type Anim = {
  active: number;
  scrollIdx: number;
  hover: number;
  yaw: number;
  targetYaw: number;
  px: number;
  py: number;
  cam: number;
  zoom: number;
  card: { x: number; y: number; init: boolean };
  flight: { from: number; to: number; start: number } | null;
  queue: { i: number; big: boolean }[];
  lastSplat: number[];
  reduced: boolean;
};

const N = treeStages.length;
const FLIGHT_MS = 1300;
const FLOAT_MIN_W = 1100; // below this the detail card docks to the bottom instead of floating
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

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
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bezier(a: V, c: V, b: V, steps: number): V[] {
  return Array.from({ length: steps + 1 }, (_, k) => {
    const t = k / steps;
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      z: u * u * a.z + 2 * u * t * c.z + t * t * b.z,
    };
  });
}

const trunkAt = (y: number): V => ({ x: 0.025 * Math.sin(y * 3.2), y, z: 0.02 * Math.cos(y * 2.4) });

function cloud(r: () => number, c: V, radius: number, count: number, out: Leaf[]) {
  for (let k = 0; k < count; k++) {
    const u = r() * Math.PI * 2;
    const v = Math.acos(2 * r() - 1);
    const d = radius * Math.cbrt(r());
    out.push({
      x: c.x + d * Math.sin(v) * Math.cos(u),
      y: c.y + d * Math.cos(v) * 0.7,
      z: c.z + d * Math.sin(v) * Math.sin(u),
      ph: r() * Math.PI * 2,
    });
  }
}

function buildTree() {
  const r = rng(7);
  const trunk = Array.from({ length: 25 }, (_, k) => trunkAt(-1.05 + (k * 1.95) / 24));

  const branches: Branch[] = treeStages.map((stage, i) => {
    const h = -0.72 + i * 0.17;
    const th = i * 2.39996; // golden angle: branches spiral evenly around the trunk
    const R = 0.6 + (i % 3) * 0.07;
    const base = trunkAt(h);
    const ctrl = { x: Math.cos(th) * R * 0.45, y: h + 0.04, z: Math.sin(th) * R * 0.45 };
    const tip = { x: Math.cos(th) * R, y: h + 0.3, z: Math.sin(th) * R };
    const pts = bezier(base, ctrl, tip, 14);
    const twigs = [0.5, 0.7, 0.85].map((t) => {
      const p = pts[Math.round(t * 14)];
      const a = th + (r() - 0.5) * 1.6;
      const len = 0.1 + r() * 0.1;
      return [p, { x: p.x + Math.cos(a) * len, y: p.y + 0.06 + r() * 0.08, z: p.z + Math.sin(a) * len }];
    });
    const leaves: Leaf[] = [];
    cloud(r, tip, 0.17, 26, leaves);
    twigs.forEach((tw) => cloud(r, tw[1], 0.07, 6, leaves));
    return { pts, twigs, leaves, tip, color: stage.color, path: [...trunk.filter((p) => p.y < h), ...pts] };
  });

  const crown: Leaf[] = [];
  cloud(r, { x: 0, y: 0.98, z: 0 }, 0.2, 26, crown);

  const roots = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * Math.PI * 2 + r() * 0.4;
    const len = 0.45 + r() * 0.25;
    return bezier(trunkAt(-1.0), { x: Math.cos(a) * 0.18, y: -1.1, z: Math.sin(a) * 0.18 }, { x: Math.cos(a) * len, y: -1.16, z: Math.sin(a) * len }, 10);
  });

  // Fireflies drift up, leaves drift down, both at random depths around the tree.
  const motes: Mote[] = Array.from({ length: 46 }, (_, k) => ({
    x: (r() - 0.5) * 2.6,
    y: -1.1 + r() * 2.3,
    z: (r() - 0.5) * 2.6,
    ph: r() * Math.PI * 2,
    leaf: k % 3 === 0,
    c: treeStages[Math.floor(r() * N)].color,
  }));

  const trunkHi = trunk.map((p) => ({ ...p, x: p.x - 0.014 }));
  return { trunk, trunkHi, branches, crown, roots, motes };
}

function newSplat(i: number, big: boolean, now: number): Splat {
  const rand = Math.random;
  return {
    i,
    born: now,
    big,
    radii: Array.from({ length: 14 }, () => 0.7 + rand() * 0.6),
    drops: Array.from({ length: big ? 18 : 8 }, () => ({ a: rand() * Math.PI * 2, d: 1.3 + rand() * (big ? 2.4 : 1.3), r: 1 + rand() * (big ? 4.5 : 3) })),
    drips: Array.from({ length: big ? 4 : 2 }, () => ({ dx: (rand() - 0.5) * 1.3, len: 1 + rand() * 2.2, w: 1 + rand() * 2 })),
  };
}

function queueSplat(a: Anim, i: number, big: boolean) {
  const now = performance.now();
  if (!big && (a.reduced || now - a.lastSplat[i] < 1500)) return;
  a.lastSplat[i] = now;
  a.queue.push({ i, big });
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, flap: number, color: string, glow: number) {
  ctx.save();
  ctx.strokeStyle = `rgb(${color})`;
  ctx.fillStyle = `rgb(${color})`;
  ctx.lineWidth = Math.max(1.3, size * 0.2);
  ctx.lineCap = "round";
  ctx.shadowColor = `rgb(${color})`;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size * 0.55 * flap);
  ctx.quadraticCurveTo(x - size * 0.45, y - size * 0.12 - size * 0.5 * flap, x, y);
  ctx.quadraticCurveTo(x + size * 0.45, y - size * 0.12 - size * 0.5 * flap, x + size, y - size * 0.55 * flap);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.1, size * 0.24, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Full-bleed 3D tree. The section pins to the screen; scrolling climbs the tree (the camera rises,
 * the tree turns, paint bursts on each stage's branch). Hovering a bird or stage name opens its
 * detail card beside it. The pointer tilts the whole view.
 */
export function SdlcTree() {
  const outerRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
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
    zoom: 1,
    card: { x: 0, y: 0, init: false },
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
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
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
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;

    const tree = buildTree();
    const a = anim.current;
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono-jb") || "monospace";
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let hits: { i: number; x: number; y: number }[] = [];
    let pitch = 0.2;
    let splats: Splat[] = [];
    const trail: { x: number; y: number }[] = [];
    const sap = Array.from({ length: 24 }, (_, k) => ({ b: k % N, u: Math.random(), speed: 0.003 + Math.random() * 0.004 }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap!.clientWidth;
      h = wrap!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible || !w) return;
      const t = a.reduced ? 0 : now / 1000;

      // Camera: ease toward the scroll stage, rise with it, and add a pointer-driven tilt.
      a.yaw += (a.targetYaw - a.yaw) * 0.05;
      const yaw = a.yaw + (a.reduced ? 0 : a.px * 0.5);
      pitch += (0.2 + (a.reduced ? 0 : a.py * 0.24) - pitch) * 0.08;
      // The whole tree always fits between the heading and the stage strip; the camera only drifts a little.
      const camTarget = tree.branches[a.scrollIdx].tip.y * 0.1;
      a.cam += (camTarget - a.cam) * (a.reduced ? 1 : 0.045);

      const compact = w < FLOAT_MIN_W;
      const top = compact ? 84 : 112;
      const bottom = compact ? h * 0.46 : 64; // on small screens the detail card sits below the tree
      const band = Math.max(160, h - top - bottom);
      const scale = Math.min(w * (compact ? 0.4 : 0.27), band / 2.7);
      const cx = w / 2;
      const cy = top + band / 2 + a.cam * scale;
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
      const P = (p: V): Proj => {
        const x = p.x * cosY - p.z * sinY;
        const z = p.x * sinY + p.z * cosY;
        const yy = p.y - a.cam;
        const y2 = yy * cosP - z * sinP;
        const z2 = yy * sinP + z * cosP;
        const s = 3 / (3 + z2);
        return { x: cx + x * scale * s, y: cy - y2 * scale * s, z: z2, s };
      };

      ctx!.clearRect(0, 0, w, h);
      ctx!.lineCap = "round";

      // Light shafts and ground glow set the scene.
      ctx!.globalCompositeOperation = "lighter";
      for (const k of [0, 1]) {
        const x0 = w * (0.14 + 0.24 * k) + Math.sin(t * 0.3 + k) * 22;
        const g = ctx!.createLinearGradient(x0, 0, x0 + w * 0.25, h);
        g.addColorStop(0, "rgba(56,189,248,0.07)");
        g.addColorStop(1, "rgba(56,189,248,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(x0, 0);
        ctx!.lineTo(x0 + w * 0.12, 0);
        ctx!.lineTo(x0 + w * 0.45, h);
        ctx!.lineTo(x0 + w * 0.28, h);
        ctx!.closePath();
        ctx!.fill();
      }
      const gp = P({ x: 0, y: -1.08, z: 0 });
      ctx!.save();
      ctx!.translate(gp.x, gp.y);
      ctx!.scale(1, 0.28);
      const gg = ctx!.createRadialGradient(0, 0, 0, 0, 0, scale * 1.4);
      gg.addColorStop(0, "rgba(56,189,248,0.22)");
      gg.addColorStop(1, "rgba(56,189,248,0)");
      ctx!.fillStyle = gg;
      ctx!.beginPath();
      ctx!.arc(0, 0, scale * 1.4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      // Paint splashes burst on the stage's branch, then settle and fade behind the tree.
      for (const q of a.queue.splice(0)) {
        splats.push(newSplat(q.i, q.big, now));
        const bigOnes = splats.filter((s) => s.big);
        if (bigOnes.length > 9) splats = splats.filter((s) => s !== bigOnes[0]);
      }
      splats = splats.filter((s) => s.big || a.reduced || now - s.born < 2600);
      for (const s of splats) {
        const age = a.reduced ? 0.7 : (now - s.born) / 1000;
        const burst = easeOut(Math.min(1, age / 0.55));
        const alpha = s.big ? Math.max(0.16, 1 - age / 10) : Math.max(0, 1 - age / 2.6);
        const b = tree.branches[s.i];
        const an = P({ x: b.tip.x, y: b.tip.y + 0.08, z: b.tip.z });
        const R = (s.big ? 78 : 40) * (scale / 260) * an.s * burst;
        const col = b.color;
        const n = s.radii.length;
        const pts = s.radii.map((rr, k) => ({
          x: an.x + Math.cos((k / n) * Math.PI * 2) * R * rr,
          y: an.y + Math.sin((k / n) * Math.PI * 2) * R * rr * 0.85,
        }));
        const blob = (shrink: number, fill: string) => {
          ctx!.fillStyle = fill;
          ctx!.beginPath();
          const at = (k: number) => ({ x: an.x + (pts[k % n].x - an.x) * shrink, y: an.y + (pts[k % n].y - an.y) * shrink });
          const m0 = { x: (at(n - 1).x + at(0).x) / 2, y: (at(n - 1).y + at(0).y) / 2 };
          ctx!.moveTo(m0.x, m0.y);
          for (let k = 0; k < n; k++) {
            const p0 = at(k);
            const p1 = at(k + 1);
            ctx!.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
          }
          ctx!.fill();
        };
        blob(1, `rgba(${col},${0.2 * alpha})`);
        blob(0.55, `rgba(${col},${0.3 * alpha})`);
        for (const d of s.drops) {
          const fall = age * age * 10 * an.s;
          ctx!.fillStyle = `rgba(${col},${0.55 * alpha})`;
          ctx!.beginPath();
          ctx!.arc(an.x + Math.cos(d.a) * R * d.d, an.y + Math.sin(d.a) * R * d.d * 0.85 + fall, Math.max(0.6, d.r * burst * an.s * 1.4), 0, Math.PI * 2);
          ctx!.fill();
        }
        const dripGrow = Math.min(1, age / 2.2);
        for (const d of s.drips) {
          const x = an.x + d.dx * R * 0.5;
          const y0 = an.y + R * 0.55;
          const y1 = y0 + d.len * R * 0.5 * dripGrow;
          ctx!.strokeStyle = `rgba(${col},${0.4 * alpha})`;
          ctx!.lineWidth = d.w * an.s * 1.6;
          ctx!.beginPath();
          ctx!.moveTo(x, y0);
          ctx!.lineTo(x, y1);
          ctx!.stroke();
          ctx!.fillStyle = `rgba(${col},${0.5 * alpha})`;
          ctx!.beginPath();
          ctx!.arc(x, y1, d.w * an.s * 1.4, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.globalCompositeOperation = "source-over";

      // Ground rings
      for (const rad of [0.45, 0.85, 1.25]) {
        ctx!.strokeStyle = `rgba(56,189,248,${0.16 - rad * 0.06})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        for (let k = 0; k <= 72; k++) {
          const ang = (k / 72) * Math.PI * 2;
          const q = P({ x: Math.cos(ang) * rad, y: -1.08, z: Math.sin(ang) * rad });
          if (k) ctx!.lineTo(q.x, q.y);
          else ctx!.moveTo(q.x, q.y);
        }
        ctx!.stroke();
      }

      const line = (pts: V[], w0: number, w1: number, style: string) => {
        ctx!.strokeStyle = style;
        for (let k = 0; k < pts.length - 1; k++) {
          const p = P(pts[k]);
          const q = P(pts[k + 1]);
          ctx!.lineWidth = (w0 + (w1 - w0) * (k / (pts.length - 1))) * p.s;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(q.x, q.y);
          ctx!.stroke();
        }
      };

      for (const root of tree.roots) line(root, 4, 0.8, "rgba(154,163,173,0.22)");

      const drawBranch = (i: number) => {
        const b = tree.branches[i];
        const on = i === a.active;
        const seen = i <= a.scrollIdx;
        const fog = 1 - Math.max(0, P(b.tip).z) * 0.32; // far branches fade into the background
        ctx!.shadowColor = `rgb(${b.color})`;
        ctx!.shadowBlur = on ? 14 : 0;
        line(b.pts, 4.5, 1.3, `rgba(${b.color},${(on ? 0.95 : seen ? 0.55 : 0.34) * fog})`);
        for (const tw of b.twigs) line(tw, 1.4, 0.6, `rgba(${b.color},${(on ? 0.8 : seen ? 0.4 : 0.26) * fog})`);
        ctx!.shadowBlur = 0;
        for (const l of b.leaves) {
          const q = P(l);
          const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + l.ph);
          ctx!.fillStyle = `rgba(${b.color},${((on ? 0.6 : seen ? 0.36 : 0.18) + tw * 0.3) * fog})`;
          ctx!.beginPath();
          ctx!.arc(q.x, q.y, (1.1 + tw * 1.1) * q.s * (on ? 1.7 : 1.3), 0, Math.PI * 2);
          ctx!.fill();
        }
      };

      // Painter's order: branches behind the trunk, the trunk, then branches in front.
      const order = tree.branches.map((b, i) => ({ i, z: P(b.tip).z })).sort((m, n) => n.z - m.z);
      order.filter((o) => o.z > 0).forEach((o) => drawBranch(o.i));
      line(tree.trunk, 14, 4, "rgba(30,38,48,0.95)");
      line(tree.trunk, 10, 2.6, "rgba(120,130,142,0.55)");
      line(tree.trunkHi, 2.6, 0.8, "rgba(255,255,255,0.2)");
      for (const l of tree.crown) {
        const q = P(l);
        ctx!.fillStyle = `rgba(56,189,248,${0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.3 + l.ph))})`;
        ctx!.beginPath();
        ctx!.arc(q.x, q.y, 1.6 * q.s, 0, Math.PI * 2);
        ctx!.fill();
      }
      order.filter((o) => o.z <= 0).forEach((o) => drawBranch(o.i));

      // Flow thread: the order of the stages, lit up to the current one.
      for (let i = 0; i < N - 1; i++) {
        const A = tree.branches[i].tip;
        const B = tree.branches[i + 1].tip;
        const pa = P({ x: A.x, y: A.y + 0.08, z: A.z });
        const pb = P({ x: B.x, y: B.y + 0.08, z: B.z });
        const lit = i < a.active;
        ctx!.strokeStyle = lit ? `rgba(${tree.branches[i + 1].color},0.75)` : "rgba(255,255,255,0.08)";
        ctx!.lineWidth = lit ? 1.8 : 1;
        ctx!.setLineDash(lit ? [] : [3, 5]);
        ctx!.beginPath();
        ctx!.moveTo(pa.x, pa.y);
        ctx!.quadraticCurveTo(cx + (pa.x + pb.x - 2 * cx) * 0.25, (pa.y + pb.y) / 2, pb.x, pb.y);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);

      // Sap: telemetry flowing up the trunk and out to each stage.
      if (!a.reduced) {
        for (const s of sap) {
          s.u += s.speed;
          if (s.u >= 1) Object.assign(s, { u: 0, b: Math.floor(Math.random() * N) });
          const path = tree.branches[s.b].path;
          const f = s.u * (path.length - 1);
          const k = Math.floor(f);
          const p0 = path[k];
          const p1 = path[Math.min(k + 1, path.length - 1)];
          const q = P({ x: p0.x + (p1.x - p0.x) * (f - k), y: p0.y + (p1.y - p0.y) * (f - k), z: p0.z + (p1.z - p0.z) * (f - k) });
          ctx!.fillStyle = `rgb(${tree.branches[s.b].color})`;
          ctx!.shadowColor = ctx!.fillStyle;
          ctx!.shadowBlur = 8;
          ctx!.beginPath();
          ctx!.arc(q.x, q.y, 1.8 * q.s, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.shadowBlur = 0;
      }

      // Fireflies and falling leaves, sized and dimmed by depth.
      for (const m of tree.motes) {
        if (!a.reduced) {
          m.y += m.leaf ? -0.0009 : 0.0007;
          m.x += Math.sin(t * 0.6 + m.ph) * 0.0008;
          if (m.y < -1.1) m.y = 1.15;
          if (m.y > 1.2) m.y = -1.05;
        }
        const q = P(m);
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + m.ph);
        ctx!.fillStyle = `rgba(${m.c},${(0.25 + tw * 0.5) * (1 - clamp(q.z, 0, 1) * 0.35)})`;
        ctx!.beginPath();
        if (m.leaf) ctx!.ellipse(q.x, q.y, 3.2 * q.s, 1.5 * q.s, m.ph + t * 0.8, 0, Math.PI * 2);
        else {
          ctx!.shadowColor = `rgb(${m.c})`;
          ctx!.shadowBlur = 6;
          ctx!.arc(q.x, q.y, 1.5 * q.s, 0, Math.PI * 2);
        }
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // Agents perched on each branch.
      const flight = a.flight && now - a.flight.start < FLIGHT_MS ? a.flight : null;
      if (!flight) a.flight = null;
      hits = [];
      const birds = tree.branches
        .map((b, i) => ({ i, q: P({ x: b.tip.x, y: b.tip.y + 0.08 + 0.012 * Math.sin(t * 2 + i), z: b.tip.z }) }))
        .sort((m, n) => n.q.z - m.q.z);
      for (const { i, q } of birds) {
        hits.push({ i, x: q.x, y: q.y });
        const on = i === a.active;
        if (!(flight && flight.to === i)) {
          drawBird(ctx!, q.x, q.y, 8 * q.s * (on ? 1.6 : 1), 0.35 + 0.2 * Math.sin(t * 3 + i * 1.7), tree.branches[i].color, on ? 20 : 6);
        }
        ctx!.font = `${on ? 12 : 10}px ${mono}`;
        ctx!.fillStyle = `rgba(237,237,237,${on ? 0.98 : 0.5 * (1 - clamp(q.z, 0, 1) * 0.4)})`;
        ctx!.fillText(`${pad(i + 1)} ${treeStages[i].short}`, q.x + 13 * q.s, q.y + 4);
      }

      // Lead agent flying the flow from the previous stage to the next.
      if (flight) {
        const p = Math.min(1, (now - flight.start) / FLIGHT_MS);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const A = tree.branches[flight.from].tip;
        const B = tree.branches[flight.to].tip;
        const q = P({
          x: A.x + (B.x - A.x) * e,
          y: A.y + (B.y - A.y) * e + 0.08 + Math.sin(Math.PI * e) * 0.35,
          z: A.z + (B.z - A.z) * e,
        });
        trail.push({ x: q.x, y: q.y });
        if (trail.length > 16) trail.shift();
        trail.forEach((pt, k) => {
          ctx!.fillStyle = `rgba(${tree.branches[flight.to].color},${(k / trail.length) * 0.6})`;
          ctx!.beginPath();
          ctx!.arc(pt.x, pt.y, 2 * (k / trail.length) + 0.5, 0, Math.PI * 2);
          ctx!.fill();
        });
        drawBird(ctx!, q.x, q.y, 12 * q.s, Math.sin(now / 55), tree.branches[flight.to].color, 20);
      } else {
        trail.length = 0;
      }

      // The detail card glides to the gutter nearest the active bird, joined to it by a line.
      const cardEl = cardRef.current;
      const hit = hits.find((x) => x.i === a.active);
      if (cardEl && hit) {
        if (w >= FLOAT_MIN_W) {
          const cw = cardEl.offsetWidth;
          const ch = cardEl.offsetHeight;
          const onLeft = hit.x < w / 2;
          const tx = onLeft ? 28 : w - cw - 28;
          const ty = clamp(hit.y - ch / 2, 78, Math.max(78, h - ch - 70));
          const c = a.card;
          if (!c.init) Object.assign(c, { x: tx, y: ty, init: true });
          const ease = a.reduced ? 1 : 0.14;
          c.x += (tx - c.x) * ease;
          c.y += (ty - c.y) * ease;
          cardEl.style.transform = `translate(${c.x}px, ${c.y}px)`;

          const ex = onLeft ? c.x + cw : c.x;
          const ey = clamp(hit.y, c.y + 18, c.y + ch - 18);
          const col = tree.branches[a.active].color;
          ctx!.strokeStyle = `rgba(${col},0.7)`;
          ctx!.lineWidth = 1.2;
          ctx!.beginPath();
          ctx!.moveTo(hit.x, hit.y);
          ctx!.quadraticCurveTo((hit.x + ex) / 2, hit.y, ex, ey);
          ctx!.stroke();
          ctx!.fillStyle = `rgb(${col})`;
          ctx!.beginPath();
          ctx!.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          cardEl.style.transform = "";
        }
      }
    }

    // Hover only for a real mouse; on touch, scrolling drives the tree. A wider radius once
    // hovering keeps the preview from flickering at the edge of a bird.
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      a.px = x / r.width - 0.5;
      a.py = y / r.height - 0.5;
      let best = -1;
      let bd = (a.hover >= 0 ? 42 : 30) ** 2;
      for (const hit of hits) {
        const d = (hit.x - x) ** 2 + (hit.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = hit.i;
        }
      }
      if (best !== a.hover) {
        a.hover = best;
        setHoverIdx(best >= 0 ? best : null);
        if (best >= 0) queueSplat(a, best, false);
      }
      canvas.style.cursor = best >= 0 ? "pointer" : "default";
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
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
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

  return (
    <section
      ref={outerRef}
      id="journey"
      aria-label="Plan to production in nine stages"
      className="relative border-t border-border"
      style={{ height: `${N * 48 + 100}vh` }}
    >
      <div className="sticky top-14 h-[calc(100svh-3.5rem)] w-full overflow-hidden">
        <div ref={wrapRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`3D tree of nine SDLC stages. Current stage ${active + 1}: ${s.title}.`}
            className="h-full w-full"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_45%,var(--background)_100%)]" aria-hidden />

        <div className="pointer-events-none absolute left-0 top-0 z-10 px-6 pt-4">
          <p className="font-mono text-sm text-accent">Plan to production</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">Nine stages. Nine agents. You approve.</h2>
          <p className="mt-1 hidden font-mono text-xs text-muted sm:block">scroll to climb &middot; hover a bird to open it</p>
        </div>

        <aside
          ref={cardRef}
          aria-live="polite"
          className="absolute z-10 max-h-[46svh] w-[min(92%,22rem)] overflow-y-auto rounded-2xl border bg-surface/90 p-5 shadow-2xl backdrop-blur max-[1099px]:bottom-16 max-[1099px]:left-1/2 max-[1099px]:-translate-x-1/2 min-[1100px]:left-0 min-[1100px]:top-0 min-[1100px]:w-[17.5rem]"
          style={{ borderColor: `rgba(${s.color},0.55)`, boxShadow: `0 0 40px rgba(${s.color},0.12)` }}
        >
          <div key={active} className="fade-in">
            <div className="flex items-center justify-between font-mono text-xs text-muted">
              <span>{pad(active + 1)} / {pad(N)}</span>
              <span style={{ color: `rgb(${s.color})` }}>&#9679; {s.agent}</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.does}</p>
            <ul className="mt-3 hidden space-y-1.5 text-sm min-[1100px]:block">
              {s.details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden style={{ color: `rgb(${s.color})` }}>&#10003;</span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <span className="font-mono text-xs text-warn">YOU APPROVE </span>
              {s.gate}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {s.outputs.map((o) => (
                <li key={o} className="rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: `rgba(${s.color},0.5)` }}>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* All nine in one glance. Hover or focus opens a stage; click jumps there. */}
        <div className="absolute inset-x-0 bottom-3 z-10 px-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1 min-[1100px]:flex-wrap min-[1100px]:justify-center" role="group" aria-label="Stages" onMouseLeave={() => setHoverIdx(null)}>
            {treeStages.map((st, i) => (
              <button
                key={st.short}
                aria-current={i === active ? "step" : undefined}
                onMouseEnter={() => preview(i)}
                onFocus={() => preview(i)}
                onBlur={() => setHoverIdx(null)}
                onClick={() => go(i)}
                className="shrink-0 whitespace-nowrap rounded-full border bg-background/70 px-3 py-1 text-xs backdrop-blur transition-colors"
                style={
                  i === active
                    ? { borderColor: `rgb(${st.color})`, background: `rgba(${st.color},0.14)`, color: `rgb(${st.color})` }
                    : { borderColor: "var(--border)", color: "var(--muted)" }
                }
              >
                <span className="font-mono opacity-70">{pad(i + 1)}</span> {st.short}
              </button>
            ))}
          </div>
        </div>

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-border" aria-hidden>
          <span ref={barRef} className="block h-full origin-left bg-gradient-to-r from-accent to-accent2" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </section>
  );
}
