"use client";
import { useRef, Suspense, useMemo } from "react";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import ParticleSystem from "./ParticleSystem";
import type { Phase } from "@/hooks/useAnimationPhase";
import { createHeartShape, generateTreePositions } from "@/lib/forestGeometry";

// Geometrías y materiales compartidos — creados UNA sola vez fuera de componentes
const SHARED_TRUNK_GEO = new THREE.CylinderGeometry(0.06, 0.1, 1.2, 5);
const SHARED_TRUNK_MAT = new THREE.MeshStandardMaterial({ color: "#3d2010", roughness: 0.9, metalness: 0 });

const FOLIAGE_LAYERS = [
  { y: 1.0, r: 0.55, color: "#1a5c2a" },
  { y: 1.45, r: 0.45, color: "#226b34" },
  { y: 1.82, r: 0.32, color: "#2d8040" },
  { y: 2.1,  r: 0.18, color: "#3a9950" },
];
const SHARED_FOLIAGE_GEOS = FOLIAGE_LAYERS.map(l => new THREE.SphereGeometry(l.r, 6, 4));
const SHARED_FOLIAGE_MATS = FOLIAGE_LAYERS.map(l => new THREE.MeshStandardMaterial({
  color: l.color, roughness: 0.8,
}));

const SHARED_PALM_GEO   = new THREE.BoxGeometry(0.5, 0.55, 0.12, 1, 1, 1);
const SHARED_FINGER_GEO = new THREE.CylinderGeometry(0.055, 0.065, 0.38, 5);
const SHARED_THUMB_GEO  = new THREE.CylinderGeometry(0.06, 0.07, 0.28, 5);
const HAND_MAT_L = new THREE.MeshStandardMaterial({ color: "#c8956a", roughness: 0.7, metalness: 0.05, transparent: true, opacity: 0 });
const HAND_MAT_R = new THREE.MeshStandardMaterial({ color: "#c8956a", roughness: 0.7, metalness: 0.05, transparent: true, opacity: 0 });

const FINGER_POSITIONS: [number, number, number][] = [
  [-0.18, 0.46, 0], [-0.06, 0.50, 0], [0.06, 0.50, 0], [0.18, 0.46, 0],
];

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
    } else {
      lightRef.current.intensity = 0.3 + Math.sin(t.current * 0.3) * 0.1;
    }
  });

  return <pointLight ref={lightRef} position={[0, 0, 3]} intensity={0.4} color="#b48ee8" distance={14} />;
}

/* ── Luz acento rosa — órbita lenta ── */
function AccentLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    lightRef.current.position.x = Math.sin(t.current * 0.18) * 5;
    lightRef.current.position.y = Math.cos(t.current * 0.13) * 3;
  });
  return <pointLight ref={lightRef} position={[3, 2, 2]} intensity={0.22} color="#f0a8c8" distance={12} />;
}

/* ── Luz dorada divina ── */
function DivineLight({ phase }: { phase: Phase }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  const active = ["letter_4","final","awakening"].includes(phase);
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    const target = active ? 0.45 + Math.sin(t.current * 0.5) * 0.15 : 0;
    lightRef.current.intensity += (target - lightRef.current.intensity) * 0.04;
  });
  return <pointLight ref={lightRef} position={[0, 3, 1]} intensity={0} color="#f5d98a" distance={10} />;
}

/* ── Corazón 3D — geometría compartida ── */
const HEART_GEO = (() => {
  const shape = createHeartShape();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05,
  });
  geo.center();
  geo.scale(0.52, 0.52, 0.52);
  return geo;
})();

const HEART_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#d4b8ff"),
  emissive: new THREE.Color("#7a2060"),
  emissiveIntensity: 0.6,
  metalness: 0.3,
  roughness: 0.4,
  transparent: true,
  opacity: 0,
});

function Heart3D({ phase }: { phase: Phase }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const visible = ["heartbeat","letter_1","letter_2","letter_3","letter_4","final"].includes(phase);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.82 : 0;
    HEART_MAT.opacity += (targetOpacity - HEART_MAT.opacity) * 0.04;
    if (visible) {
      const beat = Math.sin(t.current * 1.2 * Math.PI * 2);
      meshRef.current.scale.setScalar(1 + beat * 0.055);
      meshRef.current.rotation.y = Math.sin(t.current * 0.28) * 0.38;
      HEART_MAT.emissiveIntensity = 0.5 + beat * 0.35;
    }
  });

  return <mesh ref={meshRef} geometry={HEART_GEO} material={HEART_MAT} position={[0, 0.2, 0]} />;
}

/* ── Árbol anime — usa geometrías/materiales COMPARTIDOS ── */
function AnimeTree({ x, z, scale, rotation, phase }: {
  x: number; z: number; scale: number; rotation: number; phase: Phase;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const opacityRef = useRef(0);
  const visible = ["formation","heartbeat","letter_1","letter_2","letter_3","letter_4","final","awakening"].includes(phase);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta;
    // Fade in/out controlado por ref local — no toca materiales compartidos
    opacityRef.current += ((visible ? 1 : 0) - opacityRef.current) * 0.03;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t.current * 0.38 + rotation) * 0.022;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, -2.2, z]}
      scale={[scale, scale, scale]}
      rotation={[0, rotation, 0]}
    >
      <mesh geometry={SHARED_TRUNK_GEO} material={SHARED_TRUNK_MAT} position={[0, 0.6, 0]} />
      {FOLIAGE_LAYERS.map((l, i) => (
        <mesh key={i} geometry={SHARED_FOLIAGE_GEOS[i]} material={SHARED_FOLIAGE_MATS[i]} position={[0, l.y, 0]} />
      ))}
    </group>
  );
}

/* ── Bosque — instanciado con posiciones fijas ── */
const TREE_POSITIONS = generateTreePositions(10);

function Forest({ phase }: { phase: Phase }) {
  return (
    <>
      {TREE_POSITIONS.map((tree, i) => (
        <AnimeTree key={i} {...tree} phase={phase} />
      ))}
    </>
  );
}

/* ── Manos 3D — materiales separados por lado ── */
function StylizedHand({ phase, side }: { phase: Phase; side: "left" | "right" }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);
  const visible = ["letter_2","letter_3","letter_4","final"].includes(phase);
  const xPos = side === "left" ? -2.8 : 2.8;
  const mat = side === "left" ? HAND_MAT_L : HAND_MAT_R;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.85 : 0;
    mat.opacity += (targetOpacity - mat.opacity) * 0.04;
    if (visible) {
      groupRef.current.rotation.z = (side === "left" ? 1 : -1) * (0.28 + Math.sin(t.current * 0.45) * 0.07);
      groupRef.current.position.y = -1.2 + Math.sin(t.current * 0.38) * 0.07;
    }
  });

  return (
    <group ref={groupRef} position={[xPos, -1.2, -1]} scale={[1.1, 1.1, 1.1]}>
      <mesh geometry={SHARED_PALM_GEO} material={mat} />
      {FINGER_POSITIONS.map((pos, i) => (
        <mesh key={i} geometry={SHARED_FINGER_GEO} material={mat} position={pos} />
      ))}
      <mesh
        geometry={SHARED_THUMB_GEO}
        material={mat}
        position={[side === "left" ? -0.32 : 0.32, 0.1, 0]}
        rotation={[0, 0, (side === "left" ? 1 : -1) * 0.9]}
      />
    </group>
  );
}

/* ── Hojas flotantes — geometría estática, solo Y se mueve ── */
const LEAF_GEO = (() => {
  const count = 80;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 14;
    positions[i*3+1] = (Math.random() - 0.5) * 8;
    positions[i*3+2] = (Math.random() - 0.5) * 6 - 2;
    colors[i*3]   = 0.2 + Math.random() * 0.3;
    colors[i*3+1] = 0.6 + Math.random() * 0.4;
    colors[i*3+2] = 0.2 + Math.random() * 0.2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
})();

const LEAF_MAT = new THREE.PointsMaterial({
  size: 0.055, vertexColors: true, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false,
});

// Velocidades de deriva pre-calculadas
const LEAF_SPEEDS = new Float32Array(80).map(() => 0.12 + Math.random() * 0.1);

function FloatingLeaves({ phase }: { phase: Phase }) {
  const meshRef = useRef<THREE.Points>(null);
  const t = useRef(0);
  const visible = ["formation","heartbeat","letter_1","letter_2","letter_3","letter_4","final","awakening"].includes(phase);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta;
    const targetOpacity = visible ? 0.65 : 0;
    LEAF_MAT.opacity += (targetOpacity - LEAF_MAT.opacity) * 0.025;

    const pos = LEAF_GEO.attributes.position.array as Float32Array;
    for (let i = 0; i < 80; i++) {
      pos[i*3+1] += delta * LEAF_SPEEDS[i];
      if (pos[i*3+1] > 4) pos[i*3+1] = -4;
    }
    LEAF_GEO.attributes.position.needsUpdate = true;
  });

  return <points ref={meshRef} geometry={LEAF_GEO} material={LEAF_MAT} />;
}

/* ── Estrellas — estáticas, solo rotan ── */
const STAR_GEO = (() => {
  const count = 200;
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
  return g;
})();

const STAR_MAT = new THREE.PointsMaterial({
  size: 0.035, color: "#f5d98a", transparent: true, opacity: 0.45,
  blending: THREE.AdditiveBlending, depthWrite: false,
});

function StarField() {
  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.006;
  });
  return <points ref={ref} geometry={STAR_GEO} material={STAR_MAT} />;
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
    (phase === "heartbeat" || phase === "final") ? 1.6 :
    phase.startsWith("letter_") ? 1.1 : 0.7;

  return (
    <div className="fixed inset-0 z-0" onMouseMove={handleMouseMove}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 1]}
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
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              mipmapBlur
              radius={0.5}
            />
            <Vignette offset={0.3} darkness={0.75} eskil={false} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
