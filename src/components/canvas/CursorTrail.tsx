"use client";

/* eslint-disable react-hooks/immutability -- react-three-fiber frame loops update three.js objects imperatively, by design */

import { useFrame, type RootState } from "@react-three/fiber";
import { useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PerspectiveCamera } from "three";
import { pointer } from "@/lib/pointer";
import { trailFrag, trailVert } from "@/shaders/trail.glsl";

const N = 30; // points along the ribbon

/**
 * The cursor as part of the world: a ribbon that follows the pointer through the scene, wobbles with
 * noise and fades along its length. It collapses to nothing when the pointer rests. Buffers are allocated
 * once; nothing is created per frame.
 */
export function CursorTrail({ onActive }: { onActive: (active: boolean) => void }) {
  const { geometry, pos, normal, chain, uniforms } = useMemo(() => {
    const pos = new Float32Array(N * 2 * 3);
    const normal = new Float32Array(N * 2 * 3);
    const age = new Float32Array(N * 2);
    const index: number[] = [];
    for (let i = 0; i < N; i++) {
      age[i * 2] = age[i * 2 + 1] = i / (N - 1);
      if (i < N - 1) {
        const a = i * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3).setUsage(35048));
    g.setAttribute("normal", new BufferAttribute(normal, 3).setUsage(35048));
    g.setAttribute("aAge", new BufferAttribute(age, 1));
    g.setIndex(index);
    return {
      geometry: g,
      pos,
      normal,
      chain: new Float32Array(N * 2),
      uniforms: { uTime: { value: 0 }, uColor: { value: new Color("#4dd8e6") }, uIntensity: { value: 2.2 } },
    };
  }, []);

  useFrame((state: RootState, delta) => {
    const dt = Math.min(delta, 1 / 30); // a slow frame must not snap the whole ribbon to the cursor
    const cam = state.camera as PerspectiveCamera;
    // Pointer to world coordinates on the z = 0.6 plane.
    const dist = cam.position.z - 0.6;
    const h = 2 * Math.tan((cam.fov * Math.PI) / 360) * dist;
    const hx = pointer.x * 0.5 * h * cam.aspect;
    const hy = pointer.y * 0.5 * h;

    // Head follows the pointer; each point follows the one before it (frame-rate independent).
    const kHead = 1 - Math.exp(-dt * 18);
    chain[0] += (hx - chain[0]) * kHead;
    chain[1] += (hy - chain[1]) * kHead;
    const kTail = 1 - Math.exp(-dt * 14);
    let length = 0;
    for (let i = 1; i < N; i++) {
      const px = chain[(i - 1) * 2], py = chain[(i - 1) * 2 + 1];
      const dx = px - chain[i * 2], dy = py - chain[i * 2 + 1];
      chain[i * 2] += dx * kTail;
      chain[i * 2 + 1] += dy * kTail;
      length += Math.abs(dx) + Math.abs(dy);
    }

    const energy = Math.min(1, length * 1.6);
    for (let i = 0; i < N; i++) {
      const j = Math.min(N - 1, i + 1), p = Math.max(0, i - 1);
      let tx = chain[j * 2] - chain[p * 2];
      let ty = chain[j * 2 + 1] - chain[p * 2 + 1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const w = Math.pow(1 - i / (N - 1), 1.3) * 0.06 * energy;
      const nx = -ty, ny = tx;
      const o = i * 2 * 3;
      pos[o] = chain[i * 2] + nx * w;
      pos[o + 1] = chain[i * 2 + 1] + ny * w;
      pos[o + 2] = 0.6;
      pos[o + 3] = chain[i * 2] - nx * w;
      pos[o + 4] = chain[i * 2 + 1] - ny * w;
      pos[o + 5] = 0.6;
      normal[o] = nx;
      normal[o + 1] = ny;
      normal[o + 3] = nx;
      normal[o + 4] = ny;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    uniforms.uTime.value = state.clock.elapsedTime;
    onActive(energy > 0.01);
  });

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={5}>
      <shaderMaterial
        vertexShader={trailVert}
        fragmentShader={trailFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
