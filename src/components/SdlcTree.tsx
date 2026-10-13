"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { treeStages } from "@/app/content";

type V = { x: number; y: number; z: number };
type Leaf = V & { ph: number };
type Branch = { pts: V[]; twigs: V[][]; leaves: Leaf[]; tip: V; color: string; path: V[] };
type P = { x: number; y: number; z: number; s: number };

const N = treeStages.length;
const FLIGHT_MS = 1400;
const STEP_MS = 4600;
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

export function SdlcTree() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();
  const autoplay = playing && !reduced;

  // Shared with the animation loop without re-running it.
  const anim = useRef({
    active: 0,
    hover: -1,
    yaw: 0,
    pitch: 0.2,
    targetYaw: null as number | null,
    flight: null as { from: number; to: number; start: number } | null,
    reduced: false,
  });

  useEffect(() => {
    anim.current.reduced = reduced;
  }, [reduced]);

  // When the stage changes: launch the lead bird and turn the tree to face the branch.
  useEffect(() => {
    const a = anim.current;
    if (a.active !== active && !a.reduced) a.flight = { from: a.active, to: active, start: performance.now() };
    a.active = active;
    const th = active * 2.39996;
    let target = -Math.PI / 4 - th;
    target += Math.PI * 2 * Math.round((a.yaw - target) / (Math.PI * 2));
    a.targetYaw = target;
    if (a.reduced) {
      a.yaw = target;
      a.targetYaw = null;
    }
  }, [active]);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => setActive((x) => (x + 1) % N), STEP_MS);
    return () => clearInterval(id);
  }, [autoplay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;

    const tree = buildTree();
    const a = anim.current;
    a.yaw = -Math.PI / 4;
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono-jb") || "monospace";
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let hits: { i: number; x: number; y: number }[] = [];
    const trail: { x: number; y: number }[] = [];
    const sap = Array.from({ length: 22 }, (_, k) => ({ b: k % N, u: Math.random(), speed: 0.003 + Math.random() * 0.004 }));
    const drag = { on: false, x: 0, y: 0, moved: 0 };

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

      if (!drag.on && a.targetYaw !== null) {
        a.yaw += (a.targetYaw - a.yaw) * 0.045;
        if (Math.abs(a.targetYaw - a.yaw) < 0.002) a.targetYaw = null;
      } else if (!drag.on && !a.reduced) {
        a.yaw += 0.0012;
      }

      const scale = Math.min(w * 0.5, h * 0.4);
      const cx = w / 2;
      const cy = h / 2 - 0.05 * scale;
      const cosY = Math.cos(a.yaw), sinY = Math.sin(a.yaw);
      const cosP = Math.cos(a.pitch), sinP = Math.sin(a.pitch);
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
        const on = i === a.active || i === a.hover;
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
        ctx!.fillStyle = `rgba(237,237,237,${on || i === a.hover ? 0.95 : 0.45})`;
        ctx!.fillText(String(i + 1).padStart(2, "0"), q.x + 12 * q.s, q.y + 4);
      }

      // Lead agent flying the flow from the previous stage to the current one.
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

      // Label for the hovered stage.
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

    const pick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      let best = -1;
      let bd = 28 * 28;
      for (const hit of hits) {
        const d = (hit.x - x) ** 2 + (hit.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = hit.i;
        }
      }
      return best;
    };
    const down = (e: PointerEvent) => {
      Object.assign(drag, { on: true, x: e.clientX, y: e.clientY, moved: 0 });
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (drag.on) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        a.yaw += dx * 0.008;
        a.pitch = Math.min(0.6, Math.max(-0.05, a.pitch + dy * 0.004));
        a.targetYaw = null;
        Object.assign(drag, { x: e.clientX, y: e.clientY });
        return;
      }
      a.hover = pick(e);
      canvas.style.cursor = a.hover >= 0 ? "pointer" : "grab";
    };
    const up = (e: PointerEvent) => {
      if (drag.on && drag.moved < 6) {
        const i = pick(e);
        if (i >= 0) {
          setPlaying(false);
          setActive(i);
        }
      }
      drag.on = false;
    };
    const leave = () => {
      a.hover = -1;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", leave);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, []);

  const s = treeStages[active];
  const next = treeStages[(active + 1) % N];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.10),transparent_65%)]">
        <div ref={wrapRef} className="h-[480px] w-full touch-none sm:h-[600px]">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Interactive 3D tree of nine SDLC stages. Selected: stage ${active + 1}, ${s.title}. Use the stage buttons below to choose a stage.`}
            className="h-full w-full cursor-grab"
          />
        </div>
        <div className="pointer-events-none absolute left-4 top-4 font-mono text-xs text-muted">
          drag to rotate &middot; click a bird to open its stage
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          disabled={reduced}
          className="absolute right-4 top-4 rounded-full border border-border bg-surface/80 px-3 py-1 font-mono text-xs backdrop-blur hover:border-accent disabled:opacity-50"
        >
          {autoplay ? "❚❚ Pause flow" : "▶ Play flow"}
        </button>
      </div>

      <aside aria-live="polite" className="flex flex-col rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur">
        <div className="flex items-center justify-between font-mono text-xs text-muted">
          <span>Stage {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
          <span style={{ color: `rgb(${s.color})` }}>&#9679; {s.agent}</span>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {treeStages.map((st, i) => (
            <span
              key={st.short}
              className="h-1 flex-1 rounded-full transition-colors duration-500"
              style={{ background: i <= active ? `rgb(${st.color})` : "var(--border)" }}
            />
          ))}
        </div>

        <div key={active} className="fade-in mt-6 flex-1">
          <h3 className="text-2xl font-semibold">{s.title}</h3>
          <p className="mt-3 text-muted">{s.does}</p>

          <p className="mt-5 text-sm">
            <span className="font-mono text-xs text-warn">HUMAN GATE</span>
            <span className="mt-1 block">{s.gate}</span>
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {s.outputs.map((o) => (
              <li key={o} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: `rgba(${s.color},0.5)` }}>
                {o}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg border border-border bg-background/60 p-3 font-mono text-xs leading-6">
            {s.log.map((l, i) => (
              <p key={l} className="fade-in" style={{ animationDelay: `${i * 350}ms` }}>
                <span style={{ color: `rgb(${s.color})` }}>›</span> {l}
              </p>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted">
          Hands off to <span className="text-foreground">{active === N - 1 ? "Architecture design (next cycle)" : next.title}</span>
        </p>
      </aside>

      <div className="flex flex-wrap gap-2 lg:col-span-2" role="group" aria-label="SDLC stages">
        {treeStages.map((st, i) => (
          <button
            key={st.short}
            aria-pressed={i === active}
            onClick={() => {
              setPlaying(false);
              setActive(i);
            }}
            className="rounded-full border px-3 py-1.5 text-sm transition-colors"
            style={
              i === active
                ? { borderColor: `rgb(${st.color})`, background: `rgba(${st.color},0.12)`, color: `rgb(${st.color})` }
                : { borderColor: "var(--border)" }
            }
          >
            <span className="font-mono text-xs opacity-70">{String(i + 1).padStart(2, "0")}</span> {st.short}
          </button>
        ))}
      </div>
    </div>
  );
}
