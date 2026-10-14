"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { detectQuality, isSoftwareRenderer, type Quality } from "@/lib/device";
import { whenIdle } from "@/lib/motionLib";
import { useScene } from "@/lib/sceneStore";

// The 3D chunk loads after first paint, and never on the server.
const SceneRoot = dynamic(() => import("./canvas/SceneRoot"), { ssr: false });

/** If the 3D layer throws (for example the browser refuses a WebGL context), drop it and keep the page. */
class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The single canvas behind the whole page. With no WebGL, or if the context is lost, it renders nothing
 * and the page is the normal styled document with every word intact.
 */
export function SceneLayer() {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [lost, setLost] = useState(false);
  const failed = useScene((s) => s.failed);

  useEffect(() => {
    const q = detectQuality();
    const store = useScene.getState();
    if (!q.webgl) {
      store.setGl("off");
      store.setReady();
      return;
    }
    if (q.reduced) store.setGl("off"); // reduced motion: the static page, with the still hero image
    // Everything 3D waits until the page has loaded and the main thread is idle. CPU-drawn WebGL is far too
    // slow for this layer, so that case gets the static page and the 3D chunk is never requested.
    return whenIdle(() => {
      if (isSoftwareRenderer()) {
        store.setGl("off");
        store.setReady();
        return;
      }
      if (!q.reduced) store.setGl("on");
      setQuality(q);
    }, 1200);
  }, []);

  // Context loss: drop the canvas and keep the content.
  useEffect(() => {
    const onLost = () => {
      setLost(true);
      useScene.getState().setGl("off");
      useScene.getState().setReady();
    };
    document.addEventListener("webglcontextlost", onLost, true);
    return () => document.removeEventListener("webglcontextlost", onLost, true);
  }, []);

  if (!quality || !quality.webgl || lost || failed) return null;
  return (
    <SceneBoundary onFail={() => { useScene.getState().setGl("off"); useScene.getState().setReady(); }}>
      <SceneRoot quality={quality} />
    </SceneBoundary>
  );
}
