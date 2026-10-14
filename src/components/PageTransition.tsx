"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { loadMotion } from "@/lib/motionLib";
import { routeState } from "@/lib/route";
import { useScene } from "@/lib/sceneStore";
import { motion } from "@/lib/tokens";

const OUT_MS = 520;

function animateCamera(toCareers: boolean) {
  routeState.moving = true;
  void loadMotion().then(({ gsap }) =>
    gsap.to(routeState, {
      careers: toCareers ? 1 : 0,
      duration: motion.slowMs / 1000,
      ease: motion.cameraEase,
      overwrite: true,
      onComplete: () => {
        routeState.moving = false;
      },
    }),
  );
}

/**
 * Navigating between pages is a camera move, not a document swap. The canvas never unmounts: when you follow
 * an internal link the page dissolves while the camera starts to travel, the new route mounts, and its content
 * resolves in. Back and forward get the same arrival. With reduced motion it is a normal instant navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const wrap = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Intercept same-site link clicks that change page.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const samePage = url.pathname === window.location.pathname;
      if (samePage) return; // hashes and same-page links are handled by the page itself
      e.preventDefault();
      e.stopPropagation();
      const el = wrap.current;
      if (el) {
        el.style.transition = `opacity ${OUT_MS}ms var(--ease-in-out), filter ${OUT_MS}ms var(--ease-in-out)`;
        el.style.opacity = "0";
        el.style.filter = "blur(6px)";
      }
      animateCamera(url.pathname.startsWith("/careers"));
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), OUT_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // A new route arrived: resolve the content in, and make sure the camera is where the route belongs.
  useEffect(() => {
    const el = wrap.current;
    const toCareers = pathname.startsWith("/careers");
    if (first.current) {
      first.current = false;
      routeState.careers = toCareers ? 1 : 0;
      return;
    }
    animateCamera(toCareers);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.filter = "blur(6px)";
    const id = requestAnimationFrame(() => {
      el.style.transition = `opacity ${motion.slowMs}ms var(--ease-out), filter ${motion.slowMs}ms var(--ease-out)`;
      el.style.opacity = "1";
      el.style.filter = "none";
    });
    // Leave no transform or filter behind: they would break sticky and fixed positioning inside the page.
    const done = window.setTimeout(() => {
      el.style.transition = "";
      el.style.opacity = "";
      el.style.filter = "";
    }, motion.slowMs + 80);
    useScene.getState().setDetail(false);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(done);
    };
  }, [pathname]);

  return <div ref={wrap}>{children}</div>;
}
