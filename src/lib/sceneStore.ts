import type Lenis from "lenis";
import { create } from "zustand";
import type { SceneName } from "./tokens";

type SceneState = {
  scene: SceneName;
  /** Smoothed page scroll, 0 to 1. */
  progress: number;
  /** Signed scroll velocity in px per frame-ish units from Lenis. */
  velocity: number;
  direction: 1 | -1 | 0;
  /** Index of the active agent in the journey (0-8), or -1. */
  activeAgent: number;
  lenis: Lenis | null;
  /** Whether the 3D layer is running. "off" means no WebGL, reduced motion or a lost context: static page. */
  gl: "unknown" | "on" | "off";
  /** The 3D layer was dropped because the device could not keep up, or the context was lost. */
  failed: boolean;
  /** Journey node under the pointer or focus, or -1. */
  hovered: number;
  /** The agent detail overlay is open. */
  detailOpen: boolean;
  /** The 3D layer has drawn its first frame (or is not available), so the loader may lift. */
  ready: boolean;
  /** The loader has lifted and the camera move into the hero has started. */
  booted: boolean;
  setFailed: () => void;
  setGl: (g: "on" | "off") => void;
  setHovered: (i: number) => void;
  setDetail: (open: boolean) => void;
  setReady: () => void;
  setBooted: () => void;
  setScene: (s: SceneName) => void;
  setScroll: (p: number, v: number, d: 1 | -1 | 0) => void;
  setActiveAgent: (i: number) => void;
  setLenis: (l: Lenis | null) => void;
};

export const useScene = create<SceneState>((set) => ({
  scene: "BOOT",
  progress: 0,
  velocity: 0,
  direction: 0,
  activeAgent: -1,
  lenis: null,
  gl: "unknown",
  failed: false,
  hovered: -1,
  detailOpen: false,
  ready: false,
  booted: false,
  setFailed: () => set({ failed: true, gl: "off" }),
  setGl: (gl) => set({ gl }),
  setHovered: (hovered) => set({ hovered }),
  setDetail: (detailOpen) => set((s) => ({ detailOpen, scene: detailOpen ? "AGENT_DETAIL" : s.scene === "AGENT_DETAIL" ? "JOURNEY" : s.scene })),
  setReady: () => set({ ready: true }),
  setBooted: () => set({ booted: true, scene: "HERO" }),
  setScene: (scene) => set({ scene }),
  setScroll: (progress, velocity, direction) => set({ progress, velocity, direction }),
  setActiveAgent: (activeAgent) => set({ activeAgent }),
  setLenis: (lenis) => set({ lenis }),
}));
