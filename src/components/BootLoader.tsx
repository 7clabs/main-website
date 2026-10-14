"use client";

import { useEffect, useState } from "react";
import { useScene } from "@/lib/sceneStore";
import { motion } from "@/lib/tokens";

/**
 * Boot sequence: three pulsing accent dots while the 3D layer loads, shown at least 600 ms so it never
 * flashes on a fast connection. When the layer is ready the curtain lifts and the camera moves into the hero.
 * A hard cap means a slow or failed load can never trap the page behind it.
 */
export function BootLoader() {
  const ready = useScene((s) => s.ready);
  const [elapsed, setElapsed] = useState(false);
  const [capped, setCapped] = useState(false);
  const [gone, setGone] = useState(false);
  const open = (ready && elapsed) || capped;

  useEffect(() => {
    const a = setTimeout(() => setElapsed(true), motion.loaderMinMs);
    const b = setTimeout(() => setCapped(true), 6000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    useScene.getState().setBooted();
    const id = setTimeout(() => setGone(true), motion.slowMs + 100);
    return () => clearTimeout(id);
  }, [open]);

  if (gone) return null;
  return (
    <div
      className="boot fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{ opacity: open ? 0 : 1, transition: `opacity ${motion.slowMs}ms var(--ease-in-out)`, pointerEvents: open ? "none" : "auto" }}
      role="status"
      aria-label="Loading"
    >
      <span className="flex gap-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <i key={i} className="boot-dot block h-2.5 w-2.5 rounded-full bg-accent" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
      </span>
    </div>
  );
}
