"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { treeStages } from "@/app/content";

type V = { x: number; y: number; z: number };
type Leaf = V & { ph: number };
type Branch = { pts: V[]; twigs: V[][]; leaves: Leaf[]; tip: V; color: string; path: V[] };
type P = { x: number; y: number; z: number; s: number };

const N = treeStages.length;
const FLIGHT_MS = 1300;
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const pad = (n: number) => String(n).padStart(2, "0");

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
    cloud(r, tip, 0.17, 24, leaves);
    twigs.forEach((tw) => cloud(r, tw[1], 0.07, 5, leaves));
    return { pts, twigs, leaves, tip, color: stage.color, path: [...trunk.filter((p) => p.y < h), ...pts] };
  });

  const crown: Leaf[] = [];
  cloud(r, { x: 0, y: 0.98, z: 0 }, 0.2, 26, crown);

  const roots = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * Math.PI * 2 + r() * 0.4;
    const len = 0.45 + r() * 0.25;
    return bezier(trunkAt(-1.0), { x: Math.cos(a) * 0.18, y: -1.1, z: Math.sin(a) * 0.18 }, { x: Math.cos(a) * len, y: -1.16, z: Math.sin(a) * len }, 10);
  });

  return { trunk, branches, crown, roots };
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
 * Scroll-driven 3D tree. The section pins to the screen and scrolling walks up the tree, one stage
 * per step. Hovering a bird (or a stage name) previews that stage. The pointer tilts the view.
 */
export function SdlcTree() {
  const outerRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const active = hoverIdx ?? scrollIdx;

  // Shared with the animation loop without re-running it.
  const anim = useRef({
    active: 0,
    scrollIdx: 0,
    hover: -1,
    yaw: -Math.PI / 4,
    targetYaw: -Math.PI / 4,
    px: 0,
    py: 0,
    flight: null as { from: number; to: number; start: number } | null,
    reduced: false,
  });

  useEffect(() => {
    anim.current.reduced = reduced;
  }, [reduced]);

  useEffect(() => {
    anim.current.active = active;
  }, [active]);

  // Scrolling to a new stage: turn the tree to face it and fly the lead bird there.
  useEffect(() => {
    const a = anim.current;
    if (a.scrollIdx !== scrollIdx && !a.reduced) a.flight = { from: a.scrollIdx, to: scrollIdx, start: performance.now() };
    a.scrollIdx = scrollIdx;
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
    const trail: { x: number; y: number }[] = [];
    const sap = Array.from({ length: 22 }, (_, k) => ({ b: k % N, u: Math.random(), speed: 0.003 + Math.random() * 0.004 }));

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

      // Ease toward the scroll stage; the pointer adds a gentle parallax tilt.
      a.yaw += (a.targetYaw - a.yaw) * 0.05;
      const yaw = a.yaw + (a.reduced ? 0 : a.px * 0.45);
      pitch += (0.2 + (a.reduced ? 0 : a.py * 0.22) - pitch) * 0.08;

      const scale = Math.min(w * 0.5, h * 0.42);
      const cx = w / 2;
      const cy = h / 2 - 0.05 * scale;
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
      const P = (p: V): P => {
        const x = p.x * cosY - p.z * sinY;
        const z = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosP - z * sinP;
        const z2 = p.y * sinP + z * cosP;
        const s = 3 / (3 + z2);
        return { x: cx + x * scale * s, y: cy - y2 * scale * s, z: z2, s };
      };

      ctx!.clearRect(0, 0, w, h);
      ctx!.lineCap = "round";

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
        ctx!.shadowColor = `rgb(${b.color})`;
        ctx!.shadowBlur = on ? 14 : 0;
        line(b.pts, 4.5, 1.3, `rgba(${b.color},${on ? 0.95 : 0.42})`);
        for (const tw of b.twigs) line(tw, 1.4, 0.6, `rgba(${b.color},${on ? 0.8 : 0.3})`);
        ctx!.shadowBlur = 0;
        for (const l of b.leaves) {
          const q = P(l);
          const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + l.ph);
          ctx!.fillStyle = `rgba(${b.color},${(on ? 0.55 : 0.22) + tw * 0.3})`;
          ctx!.beginPath();
          ctx!.arc(q.x, q.y, (1.1 + tw * 1.1) * q.s * 1.3, 0, Math.PI * 2);
          ctx!.fill();
        }
      };

      // Painter's order: branches behind the trunk, the trunk, then branches in front.
      const order = tree.branches.map((b, i) => ({ i, z: P(b.tip).z })).sort((m, n) => n.z - m.z);
      order.filter((o) => o.z > 0).forEach((o) => drawBranch(o.i));
      line(tree.trunk, 11, 3, "rgba(154,163,173,0.55)");
      for (const l of tree.crown) {
        const q = P(l);
        ctx!.fillStyle = `rgba(56,189,248,${0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.3 + l.ph))})`;
        ctx!.beginPath();
        ctx!.arc(q.x, q.y, 1.6 * q.s, 0, Math.PI * 2);
        ctx!.fill();
      }
      order.filter((o) => o.z <= 0).forEach((o) => drawBranch(o.i));

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

      // Agents perched on each branch.
      const flight = a.flight && now - a.flight.start < FLIGHT_MS ? a.flight : null;
      if (!flight) a.flight = null;
      hits = [];
      ctx!.font = `11px ${mono}`;
      const birds = tree.branches
        .map((b, i) => ({ i, q: P({ x: b.tip.x, y: b.tip.y + 0.08 + 0.012 * Math.sin(t * 2 + i), z: b.tip.z }) }))
        .sort((m, n) => n.q.z - m.q.z);
      for (const { i, q } of birds) {
        hits.push({ i, x: q.x, y: q.y });
        const on = i === a.active;
        if (!(flight && flight.to === i)) {
          drawBird(ctx!, q.x, q.y, 8 * q.s * (on ? 1.5 : 1), 0.35 + 0.2 * Math.sin(t * 3 + i * 1.7), tree.branches[i].color, on ? 18 : 6);
        }
        ctx!.fillStyle = `rgba(237,237,237,${on ? 0.95 : 0.45})`;
        ctx!.fillText(pad(i + 1), q.x + 12 * q.s, q.y + 4);
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

      // Name tag on the hovered stage.
      if (a.hover >= 0) {
        const hit = hits.find((x) => x.i === a.hover);
        if (hit) {
          const label = treeStages[a.hover].title;
          ctx!.font = `12px ${mono}`;
          const tw = ctx!.measureText(label).width;
          const lx = Math.min(w - tw - 20, Math.max(8, hit.x - tw / 2 - 8));
          ctx!.fillStyle = "rgba(11,15,20,0.9)";
          ctx!.strokeStyle = `rgba(${treeStages[a.hover].color},0.8)`;
          ctx!.beginPath();
          ctx!.roundRect(lx, hit.y - 42, tw + 16, 24, 6);
          ctx!.fill();
          ctx!.stroke();
          ctx!.fillStyle = "#ededed";
          ctx!.fillText(label, lx + 8, hit.y - 26);
        }
      }
    }

    // Hover only for a real mouse; on touch, scrolling drives the tree. Wider radius once hovering
    // so the preview does not flicker at the edge of a bird.
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      a.px = x / r.width - 0.5;
      a.py = y / r.height - 0.5;
      let best = -1;
      let bd = (a.hover >= 0 ? 38 : 28) ** 2;
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

  const s = treeStages[active];

  return (
    <section
      ref={outerRef}
      id="journey"
      aria-label="Plan to production in nine stages"
      className="relative border-t border-border"
      style={{ height: `${N * 48 + 100}vh` }}
    >
      <div className="sticky top-14 flex h-[calc(100svh-3.5rem)] flex-col justify-center overflow-hidden px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-sm text-accent">Plan to production</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">Nine stages. Nine agents. You approve.</h2>
            </div>
            <p className="hidden font-mono text-xs text-muted sm:block">scroll to climb &middot; hover a bird to preview</p>
          </div>

          <div className="mt-3 grid items-center gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div ref={wrapRef} className="relative h-[38svh] overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.10),transparent_65%)] sm:h-[52svh]">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`3D tree of nine SDLC stages. Current stage ${active + 1}: ${s.title}.`}
                className="h-full w-full"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-border">
                <span ref={barRef} className="block h-full origin-left bg-gradient-to-r from-accent to-accent2" style={{ transform: "scaleX(0)" }} />
              </span>
            </div>

            <aside aria-live="polite" className="rounded-2xl border border-border bg-surface/90 p-5 backdrop-blur">
              <div key={active} className="fade-in">
                <div className="flex items-center justify-between font-mono text-xs text-muted">
                  <span>{pad(active + 1)} / {pad(N)}</span>
                  <span style={{ color: `rgb(${s.color})` }}>&#9679; {s.agent}</span>
                </div>
                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted sm:text-base">{s.does}</p>
                <p className="mt-3 text-sm">
                  <span className="font-mono text-xs text-warn">YOU APPROVE </span>
                  {s.gate}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {s.outputs.map((o) => (
                    <li key={o} className="rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: `rgba(${s.color},0.5)` }}>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          {/* All nine in one glance. Hover or focus previews; click jumps there. */}
          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap" role="group" aria-label="Stages" onMouseLeave={() => setHoverIdx(null)}>
            {treeStages.map((st, i) => (
              <button
                key={st.short}
                aria-current={i === active ? "step" : undefined}
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                onClick={() => go(i)}
                className="shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors"
                style={
                  i === active
                    ? { borderColor: `rgb(${st.color})`, background: `rgba(${st.color},0.12)`, color: `rgb(${st.color})` }
                    : { borderColor: "var(--border)", color: "var(--muted)" }
                }
              >
                <span className="font-mono opacity-70">{pad(i + 1)}</span> {st.short}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
