"use client";

/* eslint-disable react-hooks/immutability -- react-three-fiber frame loops update three.js objects imperatively, by design */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import type { PerspectiveCamera } from "three";
import { journeyLayout, journeyState, placeCamera } from "@/lib/journey";
import { productsState } from "@/lib/products";
import { routeState } from "@/lib/route";
import { pointer } from "@/lib/pointer";
import { useScene } from "@/lib/sceneStore";
import { motion } from "@/lib/tokens";
import type { Quality } from "@/lib/device";
import { Ambient } from "./Ambient";
import { CursorTrail } from "./CursorTrail";
import { HeroObject } from "./HeroObject";
import { JourneyScene } from "./JourneyScene";
import { ProductsScene } from "./ProductsScene";

const CAM_FAR = 9.5;
// Test hook: automated runs on software rendering are slow on purpose and must not trip the watchdog.
const NO_DEGRADE = () => { try { return localStorage.getItem("7c-no-degrade") === "1"; } catch { return false; } };
const CAM_HERO = 5.4;

/**
 * Keeps the frame loop honest. The canvas renders on demand: it runs while the hero is on screen, while the
 * camera is moving or the cursor trail is alive, and otherwise sleeps with zero GPU work.
 */
function Driver({ quality, trailActive, onFirstFrame, onDegrade }: { quality: Quality; trailActive: React.RefObject<boolean>; onFirstFrame: () => void; onDegrade: (level: number) => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const renderer = useThree((s) => s.gl);
  const rig = useRef<{ z: number; moving: boolean; first: boolean; timer?: ReturnType<typeof setTimeout>; ema: number; level: number; since: number }>({ z: quality.reduced ? CAM_HERO : CAM_FAR, moving: false, first: false, ema: 16, level: 0, since: 0 });

  // Pointer (mouse or touch) -> shared state, and wake the loop.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.moved = true;
      invalidate();
    };
    const wake = () => invalidate();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", wake);
    };
  }, [invalidate]);

  // The loader has lifted: the camera travels into the hero.
  useEffect(() => {
    const unsub = useScene.subscribe((s, prev) => {
      if (s.booted && !prev.booted) {
        if (quality.reduced) {
          rig.current.z = CAM_HERO;
          invalidate();
          return;
        }
        rig.current.moving = true;
        gsap.to(rig.current, {
          z: CAM_HERO,
          duration: motion.bootCameraMs / 1000,
          ease: motion.cameraEase,
          onUpdate: invalidate,
          onComplete: () => {
            rig.current.moving = false;
          },
        });
      }
    });
    return unsub;
  }, [invalidate, quality.reduced]);

  useFrame((state, delta) => {
    placeCamera(camera, rig.current.z, window.scrollY);
    // The journey is always set in a dark space: on the light theme the canvas turns black while it is in view.
    renderer.setClearColor(0x000000, document.documentElement.dataset.theme === "light" ? journeyState.vis : 0);
    if (!rig.current.first) {
      rig.current.first = true;
      onFirstFrame();
    }
    const y = window.scrollY;
    const heroVisible = y < window.innerHeight * 1.05;
    const inJourney = journeyLayout.on && y > journeyLayout.top - journeyLayout.vh && y < journeyLayout.top + journeyLayout.height + journeyLayout.vh;
    const inProducts = productsState.on && y > productsState.top - productsState.vh && y < productsState.top + productsState.height + productsState.vh;
    if (quality.reduced) return;
    const continuous = heroVisible || inJourney || inProducts || rig.current.moving || routeState.moving || trailActive.current;
    if (continuous) {
      invalidate();
      // Watchdog: if frames stay slow, lower the quality; if they still are, drop to the static page.
      const p = rig.current;
      p.ema += (Math.min(delta * 1000, 250) - p.ema) * 0.05;
      const now = performance.now();
      if (p.ema > 45 && state.clock.elapsedTime > 6 && now - p.since > 4000 && !NO_DEGRADE()) {
        p.level += 1;
        p.since = now;
        p.ema = 20;
        onDegrade(p.level);
      }
    }
    else if (!rig.current.timer) {
      // Elsewhere on the page the dust keeps drifting, at a gentle 20 frames a second.
      rig.current.timer = setTimeout(() => {
        rig.current.timer = undefined;
        if (!document.hidden) invalidate();
      }, 50);
    }
  });
  return null;
}

export default function SceneRoot({ quality }: { quality: Quality }) {
  const setReady = useScene((s) => s.setReady);
  const setFailed = useScene((s) => s.setFailed);
  const [level, setLevel] = useState(0); // 0 full, 1 lighter, 2 static page
  const trailActive = useRef(false);
  const bloom = !quality.reduced && !quality.low && level === 0;
  const onDegrade = (l: number) => {
    if (l >= 2) setFailed();
    else setLevel(l);
  };

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, level > 0 ? 1 : quality.dprMax]}
      camera={{ fov: 35, position: [0, 0, quality.reduced ? CAM_HERO : CAM_FAR], near: 0.1, far: 60 }}
      gl={{ antialias: !quality.low, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none" }}
      aria-hidden
    >
      <Driver quality={quality} trailActive={trailActive} onFirstFrame={setReady} onDegrade={onDegrade} />
      {/* A studio made of soft light panels: no network fetch, and the reflections are ours. */}
      <Environment resolution={128} background={false}>
        <Lightformer form="rect" intensity={1.3} color="#ffffff" position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#4dd8e6" position={[-5, 0, 2]} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#e8a33d" position={[5, -2, 1]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={0.6} color="#ffffff" position={[0, 0, -5]} scale={6} />
      </Environment>
      <HeroObject reduced={quality.reduced} low={quality.low} />
      <JourneyScene low={quality.low} />
      <ProductsScene low={quality.low} />
      <Ambient count={quality.low ? 160 : 520} reduced={quality.reduced} />
      {!quality.reduced && <TrailBridge flag={trailActive} />}
      {bloom && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.95} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function TrailBridge({ flag }: { flag: React.RefObject<boolean> }) {
  return <CursorTrail onActive={(a) => { flag.current = a; }} />;
}
