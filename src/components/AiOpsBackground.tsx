"use client";

import { useEffect, useRef } from "react";
import { drawHexCluster, hexPath, makeHexCluster, TECH, type HexCluster } from "@/lib/hex";

type Node = { x: number; y: number; vx: number; vy: number; r: number; state: 0 | 1 | 2; timer: number; tag: string };
type Packet = { a: number; b: number; t: number; speed: number; violet: boolean };

const LINK = 150;
// Colours follow the theme. Dark: bright on slate. Light: deeper tones that read on white.
const PALETTE = {
  dark: { net: "91,140,255", alt: "139,125,255", bad: "248,113,113", good: "52,211,153", clusters: ["91,140,255", "34,211,238", "139,125,255", "52,211,153"] },
  light: { net: "31,79,216", alt: "109,40,217", bad: "198,40,40", good: "21,128,61", clusters: ["31,79,216", "8,145,178", "109,40,217", "21,128,61"] },
};

/**
 * Full-page "AIOps" view: services drift as a network, telemetry packets travel the links,
 * and now and then a service raises an incident that is detected (red) and self-heals (green).
 */
export function AiOpsBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    const mouse = { x: -9999, y: -9999 };
    let nextIncident = 120;
    let tick = 0;
    let raf = 0;
    let CYAN = PALETTE.dark.net;
    let VIOLET = PALETTE.dark.alt;
    let RED = PALETTE.dark.bad;
    let GREEN = PALETTE.dark.good;
    let clusterCols = PALETTE.dark.clusters;
    let dark = true;

    // Hexagonal tech clusters (K8s, IaC, SBOM, OPA, SLO...) appear at the page edge each time you
    // scroll to a new screen, and a smaller one wherever you click on empty space.
    let clusters: { c: HexCluster; x: number; y: number; size: number; col: number }[] = [];
    let band = -1;
    const spawn = (x: number, y: number, size: number, big: boolean) => {
      if (reduced) return;
      clusters.push({ c: makeHexCluster(big, performance.now()), x, y, size, col: Math.floor(Math.random() * 4) });
      if (clusters.length > 2) clusters.shift();
    };
    const onScroll = () => {
      const b = Math.floor(window.scrollY / (window.innerHeight * 0.8));
      if (b === band) return;
      const first = band === -1;
      band = b;
      if (first) return;
      // Inside the tree section the tree draws its own hexagons, so keep the page background quiet there.
      const j = document.getElementById("journey")?.getBoundingClientRect();
      if (j && j.top < h * 0.5 && j.bottom > h * 0.5) return;
      const size = w < 700 ? 20 : 30;
      const half = size * 2.2;
      const left = Math.random() < 0.5;
      spawn(left ? 16 + half : w - 16 - half, h * (0.2 + Math.random() * 0.6), size, true);
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest("a,button,input,textarea,select,summary,label,canvas,[role=dialog]")) return;
      const size = w < 700 ? 16 : 22;
      const half = size * 1.8;
      spawn(Math.min(w - half, Math.max(half, e.clientX)), e.clientY, size, false);
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const widthChanged = Math.abs(window.innerWidth - w) > 40;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mobile browsers fire resize when the address bar hides; keep the network unless the width really changed.
      if (!widthChanged && nodes.length) {
        if (reduced) frame();
        return;
      }
      const count = Math.min(90, Math.max(28, Math.floor((w * h) / 18000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.4 + Math.random() * 1.8,
        state: 0,
        timer: 0,
        tag: Math.random() < 0.2 ? TECH[Math.floor(Math.random() * TECH.length)] : "",
      }));
      packets = [];
      if (reduced) frame();
    }

    function frame() {
      tick++;
      dark = document.documentElement.dataset.theme !== "light";
      const pal = dark ? PALETTE.dark : PALETTE.light;
      CYAN = pal.net;
      VIOLET = pal.alt;
      RED = pal.bad;
      GREEN = pal.good;
      clusterCols = pal.clusters;
      ctx!.clearRect(0, 0, w, h);
      const fade = Math.max(0.3, 1 - window.scrollY / 1100);
      ctx!.globalAlpha = fade;

      // Hexagon clusters sit behind the network.
      if (clusters.length) {
        const now = performance.now();
        clusters = clusters.filter((q) => now - q.c.born < (q.c.big ? 9000 : 4000));
        ctx!.globalAlpha = 1;
        for (const q of clusters) drawHexCluster(ctx!, q.c, q.x, q.y, q.size, (now - q.c.born) / 1000, clusterCols[q.col], q.c.big ? 9 : 4, dark, 0, dark ? 0.65 : 0.45);
        ctx!.globalAlpha = fade;
      }

      // Move nodes, nudge them away from the pointer.
      for (const n of nodes) {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120 && d2 > 1) {
            const f = (1 - Math.sqrt(d2) / 120) * 0.6;
            n.x += (dx / Math.sqrt(d2)) * f;
            n.y += (dy / Math.sqrt(d2)) * f;
          }
        }
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
        if (n.timer > 0 && --n.timer === 0) {
          if (n.state === 1) { n.state = 2; n.timer = 90; } else n.state = 0;
        }
      }

      // Links and adjacency.
      const adj: number[][] = nodes.map(() => []);
      ctx!.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            adj[i].push(j);
            adj[j].push(i);
            ctx!.strokeStyle = `rgba(${CYAN},${(1 - d / LINK) * 0.22})`;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
        // Pointer link
        const md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        if (md < 180) {
          ctx!.strokeStyle = `rgba(${VIOLET},${(1 - md / 180) * 0.5})`;
          ctx!.beginPath();
          ctx!.moveTo(nodes[i].x, nodes[i].y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.stroke();
        }
      }

      // Telemetry packets.
      if (!reduced && tick % 7 === 0 && packets.length < 70) {
        const a = Math.floor(Math.random() * nodes.length);
        if (adj[a].length) {
          packets.push({ a, b: adj[a][Math.floor(Math.random() * adj[a].length)], t: 0, speed: 0.012 + Math.random() * 0.016, violet: Math.random() < 0.35 });
        }
      }
      packets = packets.filter((p) => {
        p.t += p.speed;
        if (p.t >= 1) {
          const next = adj[p.b]?.filter((k) => k !== p.a);
          if (next && next.length && Math.random() < 0.6) {
            p.a = p.b;
            p.b = next[Math.floor(Math.random() * next.length)];
            p.t = 0;
            return true;
          }
          return false;
        }
        const A = nodes[p.a];
        const B = nodes[p.b];
        const x = A.x + (B.x - A.x) * p.t;
        const y = A.y + (B.y - A.y) * p.t;
        const col = p.violet ? VIOLET : CYAN;
        ctx!.fillStyle = `rgba(${col},0.95)`;
        ctx!.shadowColor = `rgb(${col})`;
        ctx!.shadowBlur = 10;
        ctx!.beginPath();
        ctx!.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
        return true;
      });

      // Incidents: detect (red), self-heal (green).
      if (!reduced && --nextIncident <= 0) {
        const n = nodes[Math.floor(Math.random() * nodes.length)];
        if (n.state === 0) { n.state = 1; n.timer = 110; }
        nextIncident = 200 + Math.random() * 240;
      }

      // Nodes.
      for (const n of nodes) {
        const col = n.state === 1 ? RED : n.state === 2 ? GREEN : CYAN;
        if (n.state !== 0) {
          const phase = n.state === 1 ? 110 - n.timer : 90 - n.timer;
          const ring = 6 + phase * 0.45;
          ctx!.strokeStyle = `rgba(${col},${Math.max(0, 0.7 - phase / 130)})`;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, ring, 0, Math.PI * 2);
          ctx!.stroke();
        }
        ctx!.fillStyle = `rgba(${col},${n.state ? 1 : 0.75})`;
        ctx!.shadowColor = `rgb(${col})`;
        ctx!.shadowBlur = n.state ? 16 : 6;
        hexPath(ctx!, n.x, n.y, (n.state ? n.r + 1.6 : n.r) * 2.3);
        ctx!.fill();
        ctx!.shadowBlur = 0;
        if (n.tag) {
          ctx!.font = "10px ui-monospace, Menlo, Consolas, monospace";
          ctx!.fillStyle = `rgba(${col},0.7)`;
          ctx!.fillText(n.tag, n.x + n.r * 2.3 + 5, n.y + 3.5);
        }
      }

      ctx!.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    const move = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    // window never fires pointerleave; pointerout with no relatedTarget means the pointer left the page.
    const leave = (e: PointerEvent) => {
      if (!e.relatedTarget) mouse.x = mouse.y = -9999;
    };

    resize();
    if (!reduced) frame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerout", leave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onDown);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", leave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
