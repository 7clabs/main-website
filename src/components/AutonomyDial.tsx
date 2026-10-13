"use client";

import { useEffect, useState } from "react";
import { levels } from "@/app/content";

/** Three autonomy levels. Cycles on its own; hovering or focusing a level takes over. */
export function AutonomyDial() {
  const [auto, setAuto] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const idx = held ?? auto;

  useEffect(() => {
    if (held !== null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAuto((x) => (x + 1) % levels.length), 3200);
    return () => clearInterval(id);
  }, [held]);

  return (
    <div onMouseLeave={() => setHeld(null)}>
      <div className="relative grid grid-cols-3 rounded-full border border-border bg-surface p-1" role="group" aria-label="Autonomy level">
        <span
          aria-hidden
          className="absolute inset-y-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-r from-accent/30 to-accent2/30 ring-1 ring-accent/60 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${idx * 100}%)` }}
        />
        {levels.map((l, i) => (
          <button
            key={l.name}
            onMouseEnter={() => setHeld(i)}
            onFocus={() => setHeld(i)}
            onBlur={() => setHeld(null)}
            aria-pressed={i === idx}
            className={`relative z-10 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${i === idx ? "text-foreground" : "text-muted"}`}
          >
            <span className="mr-1 font-mono text-xs opacity-60">L{i + 1}</span>
            {l.name}
          </button>
        ))}
      </div>
      <p key={idx} aria-live="polite" className="fade-in mt-4 min-h-12 text-center text-lg text-muted sm:text-xl">
        {levels[idx].text}
      </p>
    </div>
  );
}
