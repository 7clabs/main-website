"use client";

import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { loadMotion, whenIdle } from "@/lib/motionLib";
import { useScene } from "@/lib/sceneStore";
import { motion, SECTION_SCENES } from "@/lib/tokens";

/**
 * Scroll drives a timeline: wheel and touch set a target, Lenis smooths it with exponential decay
 * (frame-rate independent), and the smoothed value goes into the scene store and ScrollTrigger.
 * Lenis and GSAP load after the page is idle. With reduced motion the page keeps native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let dispose: (() => void) | undefined;
    let dead = false;

    const cancelIdle = whenIdle(async () => {
      const [{ gsap, ScrollTrigger }, { default: Lenis }] = await Promise.all([loadMotion(), import("lenis")]);
      if (dead) return;
      const { setScroll, setLenis } = useScene.getState();
      const lenis = new Lenis({ lerp: motion.scrollLerp, smoothWheel: true, syncTouch: false, autoRaf: false });
      setLenis(lenis);
      lenis.on("scroll", (l) => {
        ScrollTrigger.update();
        setScroll(l.progress, l.velocity, l.direction as 1 | -1 | 0);
      });

      // One clock for everything: GSAP's ticker drives Lenis, and it sleeps with the tab.
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      // The Journey changes the page height once 3D is on, so trigger positions are measured again whenever it moves.
      let refreshTimer: ReturnType<typeof setTimeout> | undefined;
      const ro = new ResizeObserver(() => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
      });
      ro.observe(document.body);

      dispose = () => {
        ro.disconnect();
        clearTimeout(refreshTimer);
        gsap.ticker.remove(tick);
        lenis.destroy();
        setLenis(null);
      };
    });

    return () => {
      dead = true;
      cancelIdle();
      dispose?.();
    };
  }, []);

  // The scene follows the section in the middle band of the screen. Re-created for each page.
  const pathname = usePathname();
  useEffect(() => {
    const { setScene } = useScene.getState();
    if (pathname.startsWith("/careers")) {
      setScene("CAREERS");
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let dead = false;
    let kill: (() => void) | undefined;
    const cancelIdle = whenIdle(async () => {
      const { ScrollTrigger } = await loadMotion();
      if (dead) return;
      const triggers = SECTION_SCENES.map(({ id, scene }) => {
        const el = document.getElementById(id);
        if (!el) return null;
        return ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setScene(scene) });
      });
      kill = () => triggers.forEach((t) => t?.kill());
    });
    return () => {
      dead = true;
      cancelIdle();
      kill?.();
    };
  }, [pathname]);

  return null;
}
