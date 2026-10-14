"use client";

import { useEffect, useRef } from "react";

/**
 * The header reacts to how you scroll: it stretches a touch and lifts away when you scroll fast, and settles
 * when you stop. Speed comes from the real scroll position, so it works with or without smooth scrolling.
 * Kept small on purpose; the scene should dominate, not the chrome.
 */
export function NavPhysics({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = window.scrollY;
    let v = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = window.scrollY;
      v += (y - last - v) * 0.2;
      last = y;
      const s = Math.min(1, Math.abs(v) / 70);
      if (s < 0.004) {
        if (el.style.transform) {
          el.style.transform = "";
          el.style.opacity = "";
        }
        return;
      }
      const down = v > 0;
      el.style.transform = `translate3d(0, ${down ? -s * 7 : 0}px, 0) scale(${1 + s * 0.025}, ${1 - s * 0.05})`;
      el.style.opacity = String(1 - s * 0.4);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} className={className} style={{ willChange: "transform, opacity" }}>{children}</div>;
}
