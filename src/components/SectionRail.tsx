"use client";

import { useEffect, useState } from "react";
import { jumpTo } from "@/lib/nav";

const sections = [
  { id: "top", label: "Start" },
  { id: "journey", label: "Journey" },
  { id: "products", label: "Products" },
  { id: "trust", label: "Trust" },
  { id: "services", label: "Services" },
  { id: "about", label: "About us" },
  { id: "contact", label: "Contact" },
];

/** A slim dot rail that shows where you are on the page and jumps straight to any section. */
export function SectionRail() {
  const [current, setCurrent] = useState("top");

  useEffect(() => {
    const seen = new Map<string, boolean>();
    // A section counts as current while it crosses the middle band of the screen.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = sections.find((s) => seen.get(s.id));
        if (first) setCurrent(first.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const go = (id: string) => jumpTo(id);

  return (
    <nav aria-label="Page sections" className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-1 min-[1100px]:flex">
      {sections.map((s) => {
        const on = s.id === current;
        return (
          <button key={s.id} onClick={() => go(s.id)} aria-label={`Go to ${s.label}`} aria-current={on ? "true" : undefined} className="group flex items-center gap-3 py-1.5 pl-3">
            <span
              className={`rounded-md bg-surface/90 px-2 py-0.5 font-mono text-xs backdrop-blur transition-all duration-200 ${
                on ? "translate-x-0 text-foreground opacity-100" : "translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            >
              {s.label}
            </span>
            <span className={`block rounded-full transition-all duration-300 ${on ? "h-3 w-3 bg-accent shadow-[0_0_12px_var(--accent)]" : "h-2 w-2 bg-muted/50 group-hover:bg-foreground"}`} />
          </button>
        );
      })}
    </nav>
  );
}
