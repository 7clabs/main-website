"use client";

/* eslint-disable react-hooks/immutability -- react-three-fiber frame loops update three.js objects imperatively, by design */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MeshPhysicalMaterial, type Group, type Mesh } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PRODUCTS_ORIGIN } from "@/lib/journey";
import { productsState } from "@/lib/products";

const ACCENT = new Color("#4dd8e6");

/**
 * The Products backdrop: one object per product, all in the same material family. The active tab's object
 * fades up while the others sink away, and the camera (see lib/journey.ts) orbits to a new angle.
 * The delivery demo flashes the first object each time a gate passes.
 */
export function ProductsScene({ low }: { low: boolean }) {
  const group = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const mix = useRef([1, 0, 0, 0]);

  const mats = useMemo(
    () => Array.from({ length: 4 }, () => new MeshPhysicalMaterial({ color: "#3a4048", metalness: 1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, emissive: ACCENT.clone(), emissiveIntensity: 0.12, transparent: true })),
    [],
  );
  const box = useMemo(() => new RoundedBoxGeometry(1.7, 1.7, 1.7, 5, 0.36), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const ps = productsState;
    g.visible = ps.vis > 0.003;
    if (!g.visible) return;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    ps.pulse = Math.max(0, ps.pulse - dt * 2.4);
    const k = 1 - Math.exp(-dt * 5);
    for (let i = 0; i < 4; i++) {
      mix.current[i] += ((i === ps.tab ? 1 : 0) - mix.current[i]) * k;
      const m = meshes.current[i];
      if (!m) continue;
      const a = mix.current[i];
      m.visible = a > 0.01;
      m.scale.setScalar((0.55 + 0.45 * a) * 0.62);
      m.rotation.y = t * 0.1 + i;
      m.rotation.x = Math.sin(t * 0.13 + i) * 0.25;
      m.position.y = Math.sin(t * 0.3 + i * 2) * 0.12 - (1 - a) * 0.8;
      const mat = mats[i];
      mat.opacity = ps.vis * a;
      const pulse = i === 0 ? ps.pulse : 0;
      mat.emissiveIntensity = 0.08 + pulse * 0.35; // a gate passing brightens the accent; no second colour here
    }
  });

  return (
    <group ref={group} position={PRODUCTS_ORIGIN} visible={false}>
      <mesh ref={(m) => { meshes.current[0] = m; }} material={mats[0]}>
        <icosahedronGeometry args={[1.25, low ? 0 : 1]} />
      </mesh>
      <mesh ref={(m) => { meshes.current[1] = m; }} material={mats[1]}>
        <torusGeometry args={[1.05, 0.38, low ? 24 : 48, low ? 64 : 128]} />
      </mesh>
      <mesh ref={(m) => { meshes.current[2] = m; }} material={mats[2]}>
        <octahedronGeometry args={[1.45, 0]} />
      </mesh>
      <mesh ref={(m) => { meshes.current[3] = m; }} material={mats[3]} geometry={box} />
    </group>
  );
}
