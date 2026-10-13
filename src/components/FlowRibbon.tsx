"use client";

import { useEffect, useState } from "react";
import { treeStages } from "@/app/content";

const N = treeStages.length;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The whole lifecycle on one line. A pulse walks through the nine stages on its own;
 * hovering or focusing a stage takes over and shows what its agent does and who approves.
 */
export function FlowRibbon() {
  const [auto, setAuto] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const idx = held ?? auto;
  const s = treeStages[idx];

  useEffect(() => {
    if (held !== null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAuto((x) => (x + 1) % N), 2400);
    return () => clearInterval(id);
  }, [held]);

  return (
    <div onMouseLeave={() => setHeld(null)} className="rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur sm:p-6">
      {/* Padding gives the glow ring and the enlarged active circle room, so the scroll box never clips them. */}
      <div className="-mx-2 overflow-x-auto px-2 pb-2 pt-7">
        <ol className="flex min-w-[700px] items-start" aria-label="The nine stages of the lifecycle">
          {treeStages.map((st, i) => {
            const lit = i <= idx;
            const on = i === idx;
            return (
              <li key={st.short} className="relative flex flex-1 flex-col items-center">
                {i > 0 && (
                  // The line runs from one circle's edge to the next, with a small gap, so it never touches them.
                  <span
                    aria-hidden
                    className="absolute top-[21px] h-0.5 rounded-full transition-colors duration-500"
                    style={{
                      right: "calc(50% + 31px)",
                      width: "calc(100% - 62px)",
                      background: i <= idx ? `rgb(${st.color})` : "var(--border)",
                    }}
                  />
                )}
                <button
                  onMouseEnter={() => setHeld(i)}
                  onFocus={() => setHeld(i)}
                  onBlur={() => setHeld(null)}
                  aria-current={on ? "step" : undefined}
                  aria-label={`Stage ${i + 1}: ${st.title}`}
                  className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 font-mono text-sm transition-all duration-300"
                  style={{
                    borderColor: `rgb(${st.color})`,
                    background: lit ? `rgb(${st.color})` : "var(--background)",
                    color: lit ? "var(--background)" : `rgb(${st.color})`,
                    transform: on ? "scale(1.18)" : "scale(1)",
                    boxShadow: on ? `0 0 0 6px rgba(${st.color},0.2), 0 0 22px rgba(${st.color},0.7)` : "none",
                  }}
                >
                  {pad(i + 1)}
                </button>
                <span className={`mt-2 text-center text-xs transition-colors ${on ? "text-foreground" : "text-muted"}`}>{st.short}</span>
              </li>
            );
          })}
        </ol>

        {/* The lifecycle is a loop: what we learn in production feeds the next design. */}
        <div className="mt-2 min-w-[700px] px-[5.5%]" aria-hidden>
          <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="h-5 w-full">
            <path d="M100 0 C100 14, 0 14, 0 0" fill="none" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="flow" />
          </svg>
          <p className="-mt-1 text-center font-mono text-[11px] text-muted">lessons from production feed the next design</p>
        </div>
      </div>

      <div key={idx} className="fade-in mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-6">
        <div>
          <p className="font-mono text-xs" style={{ color: `rgb(${s.color})` }}>&#9679; {s.agent} does</p>
          <p className="mt-1 text-sm sm:text-base">{s.does}</p>
        </div>
        <span aria-hidden className="hidden text-2xl text-muted sm:block">&rarr;</span>
        <div>
          <p className="font-mono text-xs text-warn">YOU APPROVE</p>
          <p className="mt-1 text-sm sm:text-base">{s.gate}</p>
        </div>
      </div>
    </div>
  );
}
