"use client";

import { useEffect, useRef, useState } from "react";
import { features } from "@/app/content";

const N = features.length;
const R = 36; // polygon radius, in % of the square
const pad = (n: number) => String(n).padStart(2, "0");

const vertices = features.map((_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
  return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a), cos: Math.cos(a), sin: Math.sin(a) };
});
const outline = vertices.map((v) => `${v.x},${v.y}`).join(" ");
const inner = vertices.map((v) => `${50 + (v.x - 50) * 0.55},${50 + (v.y - 50) * 0.55}`).join(" ");

/**
 * Scroll-driven feature map: the section pins to the screen and each step of scrolling
 * moves to the next point of the polygon. Clicking a point scrolls to it.
 */
export function FeaturePolygon() {
  const outerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<SVGPolygonElement>(null);
  const [active, setActive] = useState(0);

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
        progressRef.current?.setAttribute("stroke-dashoffset", String(1 - p));
        const i = Math.min(N - 1, Math.floor(p * N));
        setActive((prev) => (prev === i ? prev : i));
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

  function go(i: number) {
    const el = outerRef.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top + ((i + 0.5) / N) * (el.offsetHeight - window.innerHeight);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }

  const f = features[active];

  return (
    <section
      ref={outerRef}
      id="features"
      aria-label="Platform features"
      className="relative border-t border-border"
      style={{ height: `${N * 55 + 100}vh` }}
    >
      <div className="sticky top-14 flex h-[calc(100svh-3.5rem)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-4 px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div>
            <p className="font-mono text-sm text-accent">Everything in one view</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Nine things the platform does for you.
            </h2>
            <p className="mt-2 hidden text-muted sm:block">Scroll to walk around the shape, or pick any point.</p>

            {/* The polygon */}
            <div className="relative mx-auto mt-4 aspect-square w-full max-w-[min(100%,46vh)] lg:max-w-[520px]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="0.3" strokeDasharray="1 2" className="spin-slow" />
                <polygon points={inner} fill="rgba(56,189,248,0.03)" stroke="var(--border)" strokeWidth="0.25" />
                {vertices.map((v, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={v.x}
                    y2={v.y}
                    stroke={i === active ? `rgb(${features[i].color})` : "var(--border)"}
                    strokeWidth={i === active ? 0.5 : 0.25}
                    className="transition-[stroke] duration-500"
                  />
                ))}
                <polygon points={outline} fill="rgba(56,189,248,0.04)" stroke="var(--border)" strokeWidth="0.5" />
                <polygon
                  ref={progressRef}
                  points={outline}
                  fill="none"
                  stroke="url(#poly-grad)"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
                <defs>
                  <linearGradient id="poly-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent2)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Centre */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span key={active} className="fade-in font-mono text-4xl font-semibold sm:text-5xl" style={{ color: `rgb(${f.color})` }}>
                  {pad(active + 1)}
                </span>
                <span className="mt-1 font-mono text-xs text-muted">of {pad(N)}</span>
              </div>

              {/* Points and labels */}
              {vertices.map((v, i) => {
                const on = i === active;
                const done = i < active;
                const c = features[i].color;
                const align = v.cos > 0.25 ? "left" : v.cos < -0.25 ? "right" : "center";
                const lx = 50 + (R + 6) * v.cos;
                const ly = 50 + (R + 6.5) * v.sin;
                return (
                  <div key={features[i].tag}>
                    <button
                      onClick={() => go(i)}
                      aria-label={`Feature ${i + 1}: ${features[i].title}`}
                      aria-current={on ? "step" : undefined}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
                      style={{
                        left: `${v.x}%`,
                        top: `${v.y}%`,
                        width: on ? 22 : 13,
                        height: on ? 22 : 13,
                        background: on || done ? `rgb(${c})` : "var(--background)",
                        border: `2px solid rgb(${c})`,
                        boxShadow: on ? `0 0 0 6px rgba(${c},0.18), 0 0 24px rgba(${c},0.8)` : "none",
                      }}
                    />
                    <button
                      tabIndex={-1}
                      aria-hidden
                      onClick={() => go(i)}
                      className={`absolute whitespace-nowrap font-mono text-[10px] transition-colors duration-500 sm:text-xs ${on ? "text-foreground" : "text-muted hover:text-foreground"}`}
                      style={{
                        left: `${lx}%`,
                        top: `${ly}%`,
                        transform: `translate(${align === "left" ? "0" : align === "right" ? "-100%" : "-50%"}, -50%)`,
                      }}
                    >
                      {features[i].tag}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail card */}
          <div aria-live="polite" className="rounded-2xl border border-border bg-surface/90 p-5 backdrop-blur sm:p-7">
            <div key={active} className="fade-in">
              <div className="flex items-center justify-between font-mono text-xs text-muted">
                <span>Feature {pad(active + 1)} / {pad(N)}</span>
                <span style={{ color: `rgb(${f.color})` }}>&#9679; {f.tag}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold sm:text-2xl">{f.title}</h3>
              <p className="mt-3 text-sm text-muted sm:text-base">{f.benefit}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {f.how.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span aria-hidden style={{ color: `rgb(${f.color})` }}>&#10003;</span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">For</span>
                {f.who.map((w) => (
                  <span key={w} className="rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: `rgba(${f.color},0.5)` }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
              <a href={f.link.href} className="text-accent hover:underline">{f.link.label} &rarr;</a>
              <div className="flex gap-2">
                <button onClick={() => go(Math.max(0, active - 1))} disabled={active === 0} className="rounded-md border border-border px-3 py-1 disabled:opacity-40" aria-label="Previous feature">
                  &larr;
                </button>
                <button onClick={() => go(Math.min(N - 1, active + 1))} disabled={active === N - 1} className="rounded-md border border-border px-3 py-1 disabled:opacity-40" aria-label="Next feature">
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
