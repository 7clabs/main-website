"use client";

import { useCallback, useEffect, useRef } from "react";
import { treeStages } from "@/app/content";
import { journeyDom, journeyLayout, journeyState, NODES, scrollForNode } from "@/lib/journeyState";
import { useScene } from "@/lib/sceneStore";
import { motion, power3InOut } from "@/lib/tokens";

const pad = (n: number) => String(n).padStart(2, "0");

/** All nine steps as plain content. Visible on its own when 3D is off; read by screen readers when it is on. */
function StepList({ visible }: { visible: boolean }) {
  return (
    <ol className={visible ? "mx-auto grid w-full max-w-[var(--page-max)] gap-px px-[var(--gutter)] py-20" : "sr-only"} aria-label={visible ? undefined : "The nine stages"}>
      {treeStages.map((s, i) => (
        <li key={s.short} className="border-t border-border py-8 first:border-t-0">
          <div className="grid gap-6 md:grid-cols-[6rem_1fr_1fr]">
            <span className="font-mono text-sm text-accent">{pad(i + 1)}</span>
            <div>
              <h2 className="text-[length:var(--text-h3)]">{s.title}</h2>
              <p className="label mt-3 text-muted">{s.tagline}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {s.details.map((d) => (
                  <li key={d} className="flex gap-2"><span aria-hidden className="text-accent">&#10003;</span>{d}</li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2">
                {s.tech.map((t) => <li key={t} className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-accent">{t}</li>)}
                {s.outputs.map((o) => <li key={o} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">{o}</li>)}
              </ul>
            </div>
            <div>
              <p className="label text-accent">&#9679; {s.agent} does</p>
              <p className="mt-1">{s.does}</p>
              <p className="label mt-5 text-warn">YOU APPROVE</p>
              <p className="mt-1">{s.gate}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * The Journey. With 3D on, this section is pinned: scrolling travels the camera from node 01 to node 09 and the
 * text for the active agent is anchored beside its node. With 3D off (no WebGL, reduced motion) it is a plain list.
 */
export function JourneySection() {
  const gl = useScene((s) => s.gl);
  const active = useScene((s) => s.activeAgent);
  const hovered = useScene((s) => s.hovered);
  const detailOpen = useScene((s) => s.detailOpen);
  const on = gl === "on";
  const sec = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const loop = useRef<HTMLParagraphElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Tell the scene where this section is in the page, and hand it the elements it positions.
  useEffect(() => {
    if (!on) return;
    const measure = () => {
      const el = sec.current;
      if (!el) return;
      journeyLayout.top = el.getBoundingClientRect().top + window.scrollY;
      journeyLayout.height = el.offsetHeight;
      journeyLayout.vh = window.innerHeight;
    };
    measure();
    journeyLayout.on = true;
    journeyDom.overlay = overlay.current;
    journeyDom.label = label.current;
    journeyDom.loop = loop.current;
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      journeyLayout.on = false;
      journeyDom.overlay = journeyDom.label = journeyDom.loop = null;
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      document.body.style.cursor = "";
    };
  }, [on]);

  const goTo = useCallback((i: number, thenOpen: boolean) => {
    const { lenis, setDetail } = useScene.getState();
    const y = scrollForNode(Math.max(0, Math.min(NODES - 1, i)));
    if (lenis) lenis.scrollTo(y, { duration: motion.cameraMs / 1000, easing: power3InOut, lock: true, force: true });
    else window.scrollTo(0, y);
    if (thenOpen) window.setTimeout(() => setDetail(true), motion.cameraMs + 40);
    else setDetail(false);
  }, []);

  // Click a node in the scene: the camera eases to it and the detail opens.
  useEffect(() => {
    if (!on) return;
    const onClick = (e: MouseEvent) => {
      const st = useScene.getState();
      if (st.hovered < 0 || st.detailOpen) return;
      if ((e.target as HTMLElement | null)?.closest("button, a, [role='dialog']")) return;
      opener.current = null;
      goTo(st.hovered, true);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [on, goTo]);

  // The detail locks scrolling while open; Escape closes it and returns focus.
  const close = useCallback(() => {
    useScene.getState().setDetail(false);
    useScene.getState().lenis?.start();
    opener.current?.focus();
  }, []);
  useEffect(() => {
    if (!detailOpen) return;
    useScene.getState().lenis?.stop();
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailOpen, close]);

  const onRailKey = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : null;
    if (next === null || next < 0 || next >= NODES) return;
    e.preventDefault();
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
    goTo(next, false);
  };

  if (!on) {
    return (
      <section aria-label="Plan to production in nine stages">
        <StepList visible />
      </section>
    );
  }

  const idx = active < 0 ? 0 : active;
  const s = treeStages[idx];
  const hv = hovered >= 0 ? treeStages[hovered] : null;

  return (
    <section ref={sec} aria-label="Plan to production in nine stages" className="relative text-white" style={{ height: "1000vh" }}>
      <StepList visible={false} />
      <div className="pointer-events-none sticky top-0 h-svh overflow-hidden">
        {/* The active agent, anchored beside its node. */}
        <div
          ref={overlay}
          className="absolute left-0 top-0 hidden w-[24rem] opacity-0 transition-opacity duration-500 min-[900px]:block"
          style={{ willChange: "transform, opacity" }}
        >
          <Step i={idx} onOpen={(el) => { opener.current = el; goTo(idx, true); }} />
        </div>

        {/* Narrow screens: the same text as a sheet at the bottom. */}
        <div className="absolute inset-x-0 bottom-32 px-5 sm:bottom-20 min-[900px]:hidden" style={{ opacity: active >= 0 ? 1 : 0, transition: "opacity 500ms" }}>
          <div className="rounded-xl border border-white/10 bg-black/70 p-4 backdrop-blur-sm">
            <Step i={idx} onOpen={(el) => { opener.current = el; goTo(idx, true); }} />
          </div>
        </div>

        {/* Hover label. */}
        <div ref={label} className="absolute left-0 top-0 opacity-0 transition-opacity duration-200" aria-hidden>
          {hv && <span className="label whitespace-nowrap text-white">{pad(hovered + 1)} &middot; {hv.short}</span>}
        </div>

        {/* The loop back to the start. */}
        <p ref={loop} className="absolute inset-x-0 top-24 text-center sm:bottom-24 sm:top-auto font-mono text-[11px] text-white/60 opacity-0" aria-hidden>
          lessons from production feed the next design
        </p>

        {/* Keyboard path: every node is reachable here. */}
        <nav aria-label="Journey stages" className="pointer-events-auto absolute inset-x-0 bottom-20 flex justify-center gap-1 px-3 sm:bottom-6 sm:gap-1.5 sm:px-4">
          {treeStages.map((st, i) => (
            <button
              key={st.short}
              aria-label={`${pad(i + 1)} ${st.title}`}
              aria-current={i === active ? "step" : undefined}
              onFocus={() => { journeyState.railHover = i; }}
              onBlur={() => { journeyState.railHover = -1; }}
              onMouseEnter={() => { journeyState.railHover = i; }}
              onMouseLeave={() => { journeyState.railHover = -1; }}
              onKeyDown={(e) => onRailKey(e, i)}
              onClick={(e) => { opener.current = e.currentTarget; goTo(i, true); }}
              className={`h-8 min-w-8 rounded-full px-1 font-mono text-[11px] transition-colors sm:h-9 sm:min-w-9 sm:px-2 sm:text-xs ${i === active ? "bg-accent text-black" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
            >
              {pad(i + 1)}
            </button>
          ))}
        </nav>

        {/* Detail overlay. */}
        {detailOpen && (
          <div
            role="dialog"
            aria-label={`${s.title} detail`}
            className="pointer-events-auto absolute bottom-4 right-4 top-20 w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-white/10 bg-black/85 p-6 backdrop-blur-sm fade-in"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="label text-white/60">Stage {pad(idx + 1)} of {pad(NODES)} &middot; {s.short}</p>
              <button ref={closeBtn} onClick={close} className="label rounded-full border border-white/20 px-3 py-1 hover:border-accent">Close</button>
            </div>
            <h3 className="mt-3 text-2xl">{s.title}</h3>
            <p className="label mt-2 text-accent">{s.agent}</p>
            <p className="mt-3 text-white/70">{s.does}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {s.details.map((d) => (
                <li key={d} className="flex gap-2"><span aria-hidden className="text-accent">&#10003;</span>{d}</li>
              ))}
            </ul>
            <p className="label mt-5 text-warn">YOU APPROVE</p>
            <p className="mt-1">{s.gate}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {s.tech.map((t) => <li key={t} className="rounded-md border border-accent/50 px-2 py-0.5 font-mono text-[11px] text-accent">{t}</li>)}
              {s.outputs.map((o) => <li key={o} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/60">{o}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/** The short text for one agent: what it does, and what you approve. */
function Step({ i, onOpen }: { i: number; onOpen: (el: HTMLElement) => void }) {
  const s = treeStages[i];
  return (
    <div key={i} className="fade-in">
      <p className="label text-white/60">{pad(i + 1)} &middot; {s.short}</p>
      <h3 className="mt-1.5 text-[length:var(--text-h3)]">{s.title}</h3>
      <p className="label mt-4 text-accent">&#9679; {s.agent} does</p>
      <p className="mt-1 text-white/80">{s.does}</p>
      <p className="label mt-4 text-warn">YOU APPROVE</p>
      <p className="mt-1 text-white/80">{s.gate}</p>
      <button
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={`Open details: ${s.title}`}
        className="label pointer-events-auto mt-4 rounded-full border border-white/20 px-3 py-1.5 hover:border-accent"
      >
        {s.tagline}
      </button>
    </div>
  );
}
