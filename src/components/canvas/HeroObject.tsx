"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshPhysicalMaterial, PointLight } from "three";
import { pointer } from "@/lib/pointer";

/**
 * The hero identity object: a reflective, iridescent knot. It turns a fraction of a degree per frame,
 * the surface shimmers, two lights breathe, and the cursor nudges it. Scrolling past the hero shrinks it away.
 */
export function HeroObject({ reduced, low }: { reduced: boolean; low: boolean }) {
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const mat = useRef<MeshPhysicalMaterial>(null);
  const cool = useRef<PointLight>(null);
  const warm = useRef<PointLight>(null);

  useFrame((state, dt) => {
    const g = group.current;
    const m = mesh.current;
    if (!g || !m) return;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const heroP = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    const wide = state.size.width / state.size.height > 1.1;

    const k = 1 - Math.exp(-dt * 3.2); // frame-rate independent follow
    const tx = wide ? 1.9 : 1.2;
    const ty = (wide ? 0 : 2.3) + heroP * 2.4 + (reduced ? 0 : pointer.y * 0.18);
    g.position.x += (tx + (reduced ? 0 : pointer.x * 0.25) - g.position.x) * k;
    g.position.y += (ty - g.position.y) * k;
    g.scale.setScalar(Math.max(0.001, (1 - heroP * 0.5) * (wide ? 0.62 : 0.4)));
    g.visible = heroP < 0.98;

    if (!reduced) {
      m.rotation.y = t * 0.12;
      m.rotation.x = 0.35 + Math.sin(t * 0.21) * 0.06 + pointer.y * 0.2;
      m.rotation.z = Math.sin(t * 0.17) * 0.05 + pointer.x * 0.12;
    }
    if (mat.current) mat.current.iridescenceThicknessRange = [180, 520 + Math.sin(t * 0.4) * 120];
    if (cool.current) {
      cool.current.position.set(Math.cos(t * 0.23) * 3, Math.sin(t * 0.19) * 2, 2.5);
      cool.current.intensity = 22 + Math.sin(t * 0.5) * 5;
    }
    if (warm.current) {
      warm.current.position.set(Math.cos(t * 0.17 + 2) * -3, Math.sin(t * 0.13) * 2 - 1, 2);
      warm.current.intensity = 6 + Math.sin(t * 0.35 + 1) * 2;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <torusKnotGeometry args={[0.9, 0.3, low ? 140 : 280, low ? 24 : 48, 2, 3]} />
        <meshPhysicalMaterial
          ref={mat}
          color="#ffffff"
          metalness={1}
          roughness={0.14}
          iridescence={1}
          iridescenceIOR={1.7}
          iridescenceThicknessRange={[180, 520]}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={0.8}
        />
      </mesh>
      <pointLight ref={cool} color="#4dd8e6" distance={9} decay={2} />
      <pointLight ref={warm} color="#e8a33d" distance={8} decay={2} />
    </group>
  );
}
