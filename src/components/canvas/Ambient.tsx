"use client";

/* eslint-disable react-hooks/immutability -- react-three-fiber frame loops update three.js objects imperatively, by design */

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Vector3 } from "three";
import { particlesFrag, particlesVert } from "@/shaders/particles.glsl";

const _dir = new Vector3();

/**
 * Slow dust through the whole page. Full strength around the hero, a quiet presence everywhere else,
 * so the sections below read as the same world rather than a plain page.
 */
export function Ambient({ count, reduced }: { count: number; reduced: boolean }) {
  const { geometry, uniforms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * 14;
      pos[i * 3 + 1] = (rnd() - 0.5) * 8;
      pos[i * 3 + 2] = (rnd() - 0.5) * 8;
      seed[i] = rnd();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return {
      geometry: g,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 3.5 },
        uFade: { value: 1 },
        uColor: { value: new Color("#8a8f98") },
        uCenter: { value: new Vector3() },
        uBox: { value: new Vector3(7, 4, 4) },
      },
    };
  }, [count]);

  useFrame((state) => {
    uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime;
    const heroP = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    const dark = document.documentElement.dataset.theme !== "light";
    // Additive dust is invisible on white, so on the light theme it only shows over the dark scenes.
    uniforms.uFade.value = dark ? Math.max(0.22, 1 - heroP) : 1 - heroP;
    // The dust box sits five units in front of the camera.
    state.camera.getWorldDirection(_dir);
    uniforms.uCenter.value.copy(state.camera.position).addScaledVector(_dir, 5);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={particlesVert}
        fragmentShader={particlesFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
