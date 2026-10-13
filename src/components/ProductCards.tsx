"use client";

import { useRef } from "react";
import { products } from "@/app/content";

/** Line drawings that redraw themselves on hover. */
const glyphs: Record<string, React.ReactNode> = {
  "secure-delivery": (
    <>
      <path d="M28 6 L48 14 V28 C48 40 39 48 28 52 C17 48 8 40 8 28 V14 Z" />
      <polyline points="19,29 26,36 38,22" />
    </>
  ),
  resilience: <polyline points="4,30 14,30 20,14 28,46 35,22 40,30 52,30" />,
  "ai-monitor": (
    <>
      <rect x="8" y="30" width="8" height="18" />
      <rect x="24" y="16" width="8" height="32" />
      <rect x="40" y="24" width="8" height="24" />
    </>
  ),
  cloudops: <path d="M16 42 C6 42 6 28 17 28 C18 16 38 14 40 28 C52 27 52 42 42 42 Z" />,
};

function Card({ p }: { p: (typeof products)[number] }) {
  const ref = useRef<HTMLElement>(null);

  // Tilt toward the pointer and move the light with it.
  function move(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }
  function reset() {
    const el = ref.current;
    if (!el) return;
    for (const k of ["--rx", "--ry"]) el.style.setProperty(k, "0deg");
  }

  return (
    <article
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      className="tilt group relative overflow-hidden rounded-2xl border border-border bg-surface p-6"
      style={{ "--c": p.color } as React.CSSProperties}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(${p.color},0.2), transparent 65%)` }}
      />
      <svg
        viewBox="0 0 56 56"
        className="glyph relative h-14 w-14"
        fill="none"
        stroke={`rgb(${p.color})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {glyphs[p.id]}
      </svg>
      <h3 className="relative mt-4 text-xl font-semibold">{p.name}</h3>
      <p className="relative mt-1.5 text-sm text-muted">{p.line}</p>
      <ul className="relative mt-4 flex flex-wrap gap-1.5">
        {p.tags.map((t) => (
          <li key={t} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted transition-colors group-hover:border-[rgba(var(--c),0.6)] group-hover:text-foreground">
            {t}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ProductCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <Card key={p.id} p={p} />
      ))}
    </div>
  );
}
