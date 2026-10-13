"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; state: 0 | 1 | 2; timer: number };
type Packet = { a: number; b: number; t: number; speed: number; violet: boolean };

const LINK = 150;
const CYAN = "56,189,248";
const VIOLET = "129,140,248";
const RED = "255,92,92";
const GREEN = "62,207,110";

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

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.max(28, Math.floor((w * h) / 18000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.4 + Math.random() * 1.8,
        state: 0,
        timer: 0,
      }));
      packets = [];
    }

    function frame() {
      tick++;
      ctx!.clearRect(0, 0, w, h);
      const fade = Math.max(0.3, 1 - window.scrollY / 1100);
      ctx!.globalAlpha = fade;

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
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.state ? n.r + 1.6 : n.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      ctx!.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    const move = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const leave = () => { mouse.x = mouse.y = -9999; };

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
