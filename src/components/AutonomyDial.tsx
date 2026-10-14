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
      <div className="relative grid grid-cols-3 border-y border-border" role="group" aria-label="Autonomy level">
        <span
          aria-hidden
          className="absolute -top-px h-0.5 w-1/3 bg-accent transition-transform duration-500 [transition-timing-function:var(--ease-in-out)]"
          style={{ transform: `translateX(${idx * 100}%)` }}
        />
        {levels.map((l, i) => (
          <button
            key={l.name}
            onMouseEnter={() => setHeld(i)}
            onFocus={() => setHeld(i)}
            onBlur={() => setHeld(null)}
            aria-pressed={i === idx}
            className={`relative z-10 px-3 py-4 text-sm font-medium transition-colors ${i === idx ? "text-foreground" : "text-muted"}`}
          >
            <span className="mr-1 font-mono text-xs text-muted">L{i + 1}</span>
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
