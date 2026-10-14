"use client";

import { useEffect, useRef } from "react";
import { loadMotion, whenIdle } from "@/lib/motionLib";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** Runs a scrubbed scroll animation on `el` once GSAP has loaded. Returns a cleanup. */
function scrub(el: HTMLElement, make: (m: Awaited<ReturnType<typeof loadMotion>>) => { kill: () => void; scrollTrigger?: { kill: () => void } | null }) {
  let dead = false;
  let tween: { kill: () => void; scrollTrigger?: { kill: () => void } | null } | undefined;
  const cancelIdle = whenIdle(async () => {
    const m = await loadMotion();
    if (!dead && el.isConnected) tween = make(m);
  });
  return () => {
    dead = true;
    cancelIdle();
    tween?.scrollTrigger?.kill();
    tween?.kill();
  };
}

/**
 * Scroll-linked reveal: the element rises and fades in exactly as far as you have scrolled, and runs back
 * if you scroll up. It is not a timed animation. With reduced motion the content is simply there.
 */
export function ScrollReveal({
  children,
  className = "",
  y = 28,
  start = "top 92%",
  end = "top 64%",
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  start?: string;
  end?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia(REDUCED).matches) return;
    return scrub(el, ({ gsap }) => gsap.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: el, start, end, scrub: true } }));
  }, [y, start, end]);

  return <div ref={ref} className={className}>{children}</div>;
}

/** A hairline that draws itself across as you scroll to it (or down, with `vertical`). */
export function Hairline({ className = "", vertical = false, start = "top 92%", end = "top 60%", tone = "bg-border", scrubTo }: {
  className?: string;
  vertical?: boolean;
  start?: string;
  end?: string;
  tone?: string;
  /** Optional element id whose bottom ends the scrub, for lines that follow a long block. */
  scrubTo?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia(REDUCED).matches) return;
    const trigger = (scrubTo && document.getElementById(scrubTo)) || el;
    const from = vertical ? { scaleY: 0 } : { scaleX: 0 };
    const to = vertical ? { scaleY: 1 } : { scaleX: 1 };
    return scrub(el, ({ gsap }) => gsap.fromTo(el, from, { ...to, ease: "none", scrollTrigger: { trigger, start, end, scrub: true } }));
  }, [vertical, start, end, scrubTo]);

  return <div ref={ref} aria-hidden className={`${vertical ? "w-px origin-top" : "h-px w-full origin-left"} ${tone} ${className}`} />;
}
