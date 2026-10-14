"use client";

/* eslint-disable react-hooks/immutability -- react-three-fiber frame loops update three.js objects imperatively, by design */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CatmullRomCurve3,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Raycaster,
  ShaderMaterial,
  Sphere,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
} from "three";
import { journeyDom, journeyState, nodePos, NODES, ORIGIN, path } from "@/lib/journey";
import { pointer } from "@/lib/pointer";
import { useScene } from "@/lib/sceneStore";
import { motion } from "@/lib/tokens";
import { connectorFrag, connectorVert, loopFrag } from "@/shaders/connector.glsl";
import { nodeParticlesFrag, nodeParticlesVert } from "@/shaders/nodeParticles.glsl";

const ACCENT = new Color("#4dd8e6");
const WARM = new Color("#e8a33d");
const BASE = new Color("#8a8f98");
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

// Preallocated scratch values for the frame loop.
const _ray = new Raycaster();
const _ndc = new Vector2();
const _sphere = new Sphere();
const _hit = new Vector3();
const _p = new Vector3();

/**
 * The nine agents as nine nodes in one connected structure. The camera (see lib/journey.ts) travels node to
 * node as the page scrolls. The active node lights up and its neighbours dim; connections fill with light in
 * sequence; a loop arcs from the last node back to the first.
 */
export function JourneyScene({ low }: { low: boolean }) {
  const group = useRef<Group>(null);
  const core = useRef<(Mesh | null)[]>([]);
  const rings = useRef<(Mesh | null)[]>([]);
  const gates = useRef<(Mesh | null)[]>([]);
  const size = useThree((s) => s.size);

  const built = useMemo(() => {
    const perNode = low ? 36 : 80;
    const count = NODES * perNode;
    const pos = new Float32Array(count * 3);
    const off = new Float32Array(count * 3);
    const node = new Float32Array(count);
    const seed = new Float32Array(count);
    let s = 5;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < NODES; n++) {
      for (let k = 0; k < perNode; k++) {
        const i = n * perNode + k;
        const r = 0.7 + rnd() * 1.1;
        const th = rnd() * Math.PI * 2;
        const ph = Math.acos(2 * rnd() - 1);
        pos[i * 3] = nodePos[n].x;
        pos[i * 3 + 1] = nodePos[n].y;
        pos[i * 3 + 2] = nodePos[n].z;
        off[i * 3] = r * Math.sin(ph) * Math.cos(th);
        off[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        off[i * 3 + 2] = r * Math.cos(ph);
        node[i] = n;
        seed[i] = rnd();
      }
    }
    const pg = new BufferGeometry();
    pg.setAttribute("position", new BufferAttribute(pos, 3));
    pg.setAttribute("aOffset", new BufferAttribute(off, 3));
    pg.setAttribute("aNode", new BufferAttribute(node, 1));
    pg.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const particleUniforms = {
      uTime: { value: 0 },
      uVis: { value: 0 },
      uSize: { value: 5 },
      uColor: { value: ACCENT.clone() },
      uHover: { value: new Array<number>(NODES).fill(0) },
      uAct: { value: new Array<number>(NODES).fill(0) },
    };

    // Connectors between consecutive nodes, cut from the same smooth path the camera follows.
    const connectors = Array.from({ length: NODES - 1 }, (_, i) => {
      const pts = Array.from({ length: 12 }, (_, k) => path.getPoint((i + k / 11) / (NODES - 1)));
      const geo = new TubeGeometry(new CatmullRomCurve3(pts), 40, 0.018, 6, false);
      const mat = new ShaderMaterial({
        vertexShader: connectorVert,
        fragmentShader: connectorFrag,
        uniforms: { uLit: { value: 0 }, uTime: { value: 0 }, uVis: { value: 0 }, uColor: { value: ACCENT.clone() }, uBase: { value: BASE.clone() } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      return { geo, mat };
    });

    // The loop: out from the last node, around the whole structure, back into the first.
    const a = nodePos[NODES - 1], b = nodePos[0];
    const loopCurve = new CatmullRomCurve3(
      [
        a.clone(),
        a.clone().add(new Vector3(1.2, 2.2, -1.2)),
        new Vector3(a.x * 0.5, ORIGIN.y + 4.6, -2.4),
        new Vector3(0, ORIGIN.y + 5.4, -2.8),
        new Vector3(b.x * 0.5, ORIGIN.y + 4.6, -2.4),
        b.clone().add(new Vector3(-1.2, 2.2, -1.2)),
        b.clone(),
      ],
      false,
      "catmullrom",
      0.5,
    );
    const loopGeo = new TubeGeometry(loopCurve, 160, 0.02, 6, false);
    const loopMat = new ShaderMaterial({
      vertexShader: connectorVert,
      fragmentShader: loopFrag,
      uniforms: { uOn: { value: 0 }, uTime: { value: 0 }, uVis: { value: 0 }, uColor: { value: WARM.clone() } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const coreMats = nodePos.map(() => new MeshPhysicalMaterial({ color: "#2b3038", metalness: 1, roughness: 0.28, emissive: ACCENT.clone(), emissiveIntensity: 0, clearcoat: 1, clearcoatRoughness: 0.2, transparent: true }));
    const ringMats = nodePos.map(() => new MeshBasicMaterial({ color: ACCENT.clone(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
    const gateMats = nodePos.map(() => new MeshBasicMaterial({ color: WARM.clone(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
    return { pg, particleUniforms, connectors, loopGeo, loopMat, coreMats, ringMats, gateMats };
  }, [low]);

  const sm = useRef({ act: new Float32Array(NODES), hov: new Float32Array(NODES), hoveredIdx: -1 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const g = group.current;
    if (!g) return;
    const { u, vis, enter } = journeyState;
    g.visible = vis > 0.003;
    if (!g.visible) {
      if (useScene.getState().hovered !== -1) useScene.getState().setHovered(-1);
      return;
    }
    const t = state.clock.elapsedTime;
    const store = useScene.getState();
    const cam = state.camera;

    // Which node is active: the nearest to the scroll position.
    const active = enter > 0.6 ? Math.min(NODES - 1, Math.max(0, Math.round(u))) : -1;
    if (active !== store.activeAgent) store.setActiveAgent(active);

    // Hover: the pointer ray against a sphere around each node, or the keyboard / rail focus.
    let hit = journeyState.railHover;
    if (hit < 0 && pointer.moved && vis > 0.6 && !store.detailOpen) {
      _ndc.set(pointer.x, pointer.y);
      _ray.setFromCamera(_ndc, cam);
      let best = Infinity;
      for (let i = 0; i < NODES; i++) {
        _sphere.set(nodePos[i], 0.8);
        if (_ray.ray.intersectSphere(_sphere, _hit)) {
          const d = _hit.distanceToSquared(_ray.ray.origin);
          if (d < best) {
            best = d;
            hit = i;
          }
        }
      }
    }
    if (hit !== sm.current.hoveredIdx) {
      sm.current.hoveredIdx = hit;
      store.setHovered(hit);
      document.body.style.cursor = hit >= 0 ? "pointer" : "";
    }

    const k = 1 - Math.exp(-dt * 7);
    const U = built.particleUniforms;
    for (let i = 0; i < NODES; i++) {
      const actT = Math.pow(clamp01(1 - Math.abs(u - i) * 1.15), 1.4);
      sm.current.act[i] += (actT - sm.current.act[i]) * k;
      sm.current.hov[i] += ((hit === i ? 1 : 0) - sm.current.hov[i]) * (1 - Math.exp(-dt * 10));
      const a = sm.current.act[i], h = sm.current.hov[i];

      const c = core.current[i];
      if (c) c.scale.setScalar((1 + 0.1 * a) * (1 + (motion.nodeHoverScale - 1) * h));
      const cm = built.coreMats[i];
      cm.emissiveIntensity = a * 0.5 + h * 0.15;
      cm.opacity = vis * (0.35 + 0.65 * Math.max(a, 0.45 + 0.55 * h));
      const r = rings.current[i];
      if (r) {
        r.rotation.z = t * 0.25 * (i % 2 ? -1 : 1);
        r.rotation.x = 1.15 + Math.sin(t * 0.3 + i) * 0.08;
      }
      built.ringMats[i].opacity = vis * (0.28 + 0.6 * a + 0.2 * h);
      const gt = gates.current[i];
      if (gt) gt.rotation.z = -t * 0.4;
      built.gateMats[i].opacity = vis * a * 0.85;
      U.uAct.value[i] = a;
      U.uHover.value[i] = h;
    }
    U.uTime.value = t;
    U.uVis.value = vis;

    for (let i = 0; i < NODES - 1; i++) {
      const m = built.connectors[i].mat.uniforms;
      m.uLit.value = clamp01(u - i);
      m.uTime.value = t;
      m.uVis.value = vis;
    }
    built.loopMat.uniforms.uOn.value = 0.3 + 0.4 * smooth(clamp01((u - 6.2) / 1.6));
    built.loopMat.uniforms.uTime.value = t;
    built.loopMat.uniforms.uVis.value = vis;

    // Anchor the DOM overlay to the active node, and the hover label to the hovered one.
    const wide = size.width >= 900;
    const ov = journeyDom.overlay;
    if (ov) {
      if (active >= 0 && wide) {
        _p.copy(nodePos[active]).project(cam);
        const x = (_p.x * 0.5 + 0.5) * size.width;
        const y = (-_p.y * 0.5 + 0.5) * size.height;
        const w = ov.offsetWidth;
        const left = Math.max(24, Math.min(x - w / 2, size.width - w - 24));
        ov.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(y + 120)}px, 0)`;
      }
      ov.style.opacity = active >= 0 && enter > 0.8 && vis > 0.7 ? "1" : "0";
    }
    const lb = journeyDom.label;
    if (lb) {
      if (hit >= 0 && wide && hit !== active) {
        _p.copy(nodePos[hit]).project(cam);
        const x = (_p.x * 0.5 + 0.5) * size.width;
        const y = (-_p.y * 0.5 + 0.5) * size.height;
        lb.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y - 92)}px, 0) translateX(-50%)`;
        lb.style.opacity = "1";
      } else lb.style.opacity = "0";
    }
    const lp = journeyDom.loop;
    if (lp) lp.style.opacity = String(Math.max(0, (u - 7.2) / 0.8) * vis);
  });

  return (
    <group ref={group} visible={false}>
      {nodePos.map((p, i) => (
        <group key={i} position={p}>
          <mesh ref={(m) => { core.current[i] = m; }} material={built.coreMats[i]}>
            <icosahedronGeometry args={[0.42, low ? 2 : 3]} />
          </mesh>
          <mesh ref={(m) => { rings.current[i] = m; }} material={built.ringMats[i]}>
            <torusGeometry args={[0.72, 0.012, 8, 96]} />
          </mesh>
          <mesh ref={(m) => { gates.current[i] = m; }} material={built.gateMats[i]} rotation={[1.15, 0.4, 0]}>
            <torusGeometry args={[0.98, 0.008, 8, 72, Math.PI * 1.5]} />
          </mesh>
        </group>
      ))}
      {built.connectors.map((c, i) => (
        <mesh key={i} geometry={c.geo} material={c.mat} frustumCulled={false} />
      ))}
      <mesh geometry={built.loopGeo} material={built.loopMat} frustumCulled={false} />
      <points geometry={built.pg} frustumCulled={false}>
        <shaderMaterial
          vertexShader={nodeParticlesVert}
          fragmentShader={nodeParticlesFrag}
          uniforms={built.particleUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
