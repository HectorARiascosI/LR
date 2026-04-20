"use client";
import { useRef, Suspense, useMemo } from "react";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import ParticleSystem from "./ParticleSystem";
import type { Phase } from "@/hooks/useAnimationPhase";
import { createHeartShape, generateTreePositions } from "@/lib/forestGeometry";

/* ── Luz principal pulsante ── */
function PulsingLight({ phase }: { phase: Phase }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  const isBeating = ["heartbeat","letter_1","letter_2","letter_3","letter_4","final"].includes(phase);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    if (isBeating) {
      const beat = Math.sin(t.current * 1.2 * Math.PI * 2);
      lightRef.current.intensity = 0.7 + beat * 0.4;
      lightRef.current.color.setHSL(0.78 + beat * 0.04, 0.7, 0.6);
    } else {
      lightRef.current.intensity = 0.3 + Math.sin(t.current * 0.3) * 0.1;
    }
  });

  return <pointLight ref={lightRef} position={[0, 0, 3]} intensity={0.4} color="#b48ee8" distance={14} />;
}

/* ── Luz acento rosa ── */
function AccentLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    lightRef.current.position.x = Math.sin(t.current * 0.2) * 5;
    lightRef.current.position.y = Math.cos(t.current * 0.15) * 3;
    lightRef.current.intensity = 0.2 + Math.sin(t.current * 0.4) * 0.1;
  });
  return <pointLight ref={lightRef} position={[3, 2, 2]} intensity={0.25} color="#f0a8c8" distance={12} />;
}

/* ── Luz dorada divina ── */
function DivineLight({ phase }: { phase: Phase }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  const active = ["letter_4","final","awakening"].includes(phase);
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    const target = active ? 0.5 + Math.sin(t.current * 0.6) * 0.2 : 0;
    lightRef.current.intensity += (target - lightRef.current.intensity) * 0.05;
  });
  return <pointLight ref={lightRef} position={[0, 3, 1]} intensity={0} color="#f5d98a" distance={10} />;
}

/* ── Corazón 3D extruido ── */
function Heart3D({ phase }: { phase: Phase }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const visible = ["heartbeat","letter_1","letter_2","letter_3","letter_4","final"].includes(phase);

  const geometry = useMemo(() => {
    const shape = createHeartShape();
    const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.06, bevelThickness: 0.06 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.scale(0.55, 0.55, 0.55);
    return geo;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d4b8ff"),
    emissive: new THREE.Color("#7a2060"),
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0,
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.85 : 0;
    material.opacity += (targetOpacity - material.opacity) * 0.04;

    if (visible) {
      const beat = Math.sin(t.current * 1.2 * Math.PI * 2);
      const scale = 1 + beat * 0.06;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y = Math.sin(t.current * 0.3) * 0.4;
      meshRef.current.rotation.z = Math.sin(t.current * 0.2) * 0.05;
      material.emissiveIntensity = 0.5 + beat * 0.4;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} position={[0, 0.2, 0]} />;
}

/* ── Árbol anime estilizado ── */
function AnimeTree({ x, z, scale, rotation, phase }: {
  x: number; z: number; scale: number; rotation: number; phase: Phase;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const visible = ["formation","heartbeat","letter_1","letter_2","letter_3","letter_4","final","awakening"].includes(phase);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.1, 1.2, 6), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#3d2010", roughness: 0.9, metalness: 0,
  }), []);

  // Capas de follaje (estilo anime — esferas apiladas)
  const foliageLayers = useMemo(() => [
    { y: 1.0, r: 0.55, color: "#1a5c2a" },
    { y: 1.45, r: 0.45, color: "#226b34" },
    { y: 1.82, r: 0.32, color: "#2d8040" },
    { y: 2.1,  r: 0.18, color: "#3a9950" },
  ], []);

  const foliageGeos = useMemo(() =>
    foliageLayers.map(l => new THREE.SphereGeometry(l.r, 7, 5)), [foliageLayers]);

  const foliageMats = useMemo(() =>
    foliageLayers.map(l => new THREE.MeshStandardMaterial({
      color: l.color,
      emissive: new THREE.Color(l.color).multiplyScalar(0.15),
      roughness: 0.8,
      transparent: true,
      opacity: 0,
    })), [foliageLayers]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.92 : 0;
    foliageMats.forEach(m => {
      m.opacity += (targetOpacity - m.opacity) * 0.03;
    });
    // Balanceo suave del árbol
    groupRef.current.rotation.z = Math.sin(t.current * 0.4 + rotation) * 0.025;
    groupRef.current.rotation.x = Math.sin(t.current * 0.3 + rotation * 0.5) * 0.015;
  });

  return (
    <group ref={groupRef} position={[x, -2.2, z]} scale={[scale, scale, scale]} rotation={[0, rotation, 0]}>
      <mesh geometry={trunkGeo} material={trunkMat} position={[0, 0.6, 0]} />
      {foliageLayers.map((l, i) => (
        <mesh key={i} geometry={foliageGeos[i]} material={foliageMats[i]} position={[0, l.y, 0]} />
      ))}
    </group>
  );
}

/* ── Bosque de árboles ── */
function Forest({ phase }: { phase: Phase }) {
  const trees = useMemo(() => generateTreePositions(14), []);
  return (
    <>
      {trees.map((tree, i) => (
        <AnimeTree key={i} {...tree} phase={phase} />
      ))}
    </>
  );
}

/* ── Mano 3D estilizada (dedos como cilindros) ── */
function StylizedHand({ phase, side }: { phase: Phase; side: "left" | "right" }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);
  const visible = ["letter_2","letter_3","letter_4","final"].includes(phase);
  const xPos = side === "left" ? -2.8 : 2.8;

  const palmGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.55, 0.12, 2, 2, 1), []);
  const fingerGeo = useMemo(() => new THREE.CylinderGeometry(0.055, 0.065, 0.38, 6), []);
  const thumbGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.07, 0.28, 6), []);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c8956a",
    roughness: 0.7,
    metalness: 0.05,
    transparent: true,
    opacity: 0,
  }), []);

  const fingerPositions = useMemo(() => [
    [-0.18, 0.46, 0], [-0.06, 0.50, 0], [0.06, 0.50, 0], [0.18, 0.46, 0],
  ], []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.88 : 0;
    mat.opacity += (targetOpacity - mat.opacity) * 0.04;

    if (visible) {
      groupRef.current.rotation.z = (side === "left" ? 1 : -1) * (0.3 + Math.sin(t.current * 0.5) * 0.08);
      groupRef.current.rotation.x = Math.sin(t.current * 0.3) * 0.06;
      groupRef.current.position.y = -1.2 + Math.sin(t.current * 0.4) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[xPos, -1.2, -1]} scale={[1.1, 1.1, 1.1]}>
      <mesh geometry={palmGeo} material={mat} />
      {fingerPositions.map((pos, i) => (
        <mesh key={i} geometry={fingerGeo} material={mat} position={pos as [number,number,number]} />
      ))}
      <mesh
        geometry={thumbGeo}
        material={mat}
        position={[side === "left" ? -0.32 : 0.32, 0.1, 0]}
        rotation={[0, 0, (side === "left" ? 1 : -1) * 0.9]}
      />
    </group>
  );
}

/* ── Partículas de hojas flotantes ── */
function FloatingLeaves({ phase }: { phase: Phase }) {
  const meshRef = useRef<THREE.Points>(null);
  const t = useRef(0);
  const visible = ["formation","heartbeat","letter_1","letter_2","letter_3","letter_4","final","awakening"].includes(phase);

  const { geo, mat } = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 14;
      positions[i*3+1] = (Math.random() - 0.5) * 8;
      positions[i*3+2] = (Math.random() - 0.5) * 6 - 2;
      // Verde con variación
      colors[i*3]   = 0.2 + Math.random() * 0.3;
      colors[i*3+1] = 0.6 + Math.random() * 0.4;
      colors[i*3+2] = 0.2 + Math.random() * 0.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const m = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.7 : 0;
    mat.opacity += (targetOpacity - mat.opacity) * 0.03;

    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < 120; i++) {
      pos[i*3+1] += delta * (0.15 + Math.sin(t.current * 0.5 + i) * 0.08);
      pos[i*3]   += Math.sin(t.current * 0.3 + i * 0.5) * delta * 0.1;
      if (pos[i*3+1] > 4) pos[i*3+1] = -4;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points ref={meshRef} geometry={geo} material={mat} />;
}

/* ── Estrellas de fondo (Dios / universo) ── */
function StarField() {
  const { geo, mat } = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 + Math.random() * 5;
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      size: 0.04,
      color: "#f5d98a",
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

interface Props { phase: Phase; }

export default function Scene3D({ phase }: Props) {
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }) as React.RefObject<{ x: number; y: number }>;

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    const mref = mouseRef as { current: { x: number; y: number } };
    mref.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    };
  };

  const bloomIntensity =
    (phase === "heartbeat" || phase === "final") ? 1.8 :
    (phase === "letter_4" || phase === "awakening") ? 1.4 :
    phase.startsWith("letter_") ? 1.2 : 0.8;

  return (
    <div className="fixed inset-0 z-0" onMouseMove={handleMouseMove}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 1.5]}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.06} color="#1a0a2e" />
          <PulsingLight phase={phase} />
          <AccentLight />
          <DivineLight phase={phase} />

          <StarField />
          <Forest phase={phase} />
          <FloatingLeaves phase={phase} />
          <Heart3D phase={phase} />
          <StylizedHand phase={phase} side="left" />
          <StylizedHand phase={phase} side="right" />
          <ParticleSystem phase={phase} mouseRef={mouseRef} />

          <EffectComposer multisampling={0}>
            <Bloom
              intensity={bloomIntensity}
              luminanceThreshold={0.08}
              luminanceSmoothing={0.9}
              mipmapBlur
              radius={0.6}
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.0008, 0.0008)}
            />
            <Vignette offset={0.3} darkness={0.8} eskil={false} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
