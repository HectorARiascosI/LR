"use client";
/**
 * RainWorld — Ambiente 3D inmersivo de lluvia y sombras
 * Lluvia real (instanced), suelo mojado reflectante, árboles con viento,
 * rayos, niebla, cámara cinematográfica por scroll.
 */
import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── LLUVIA INSTANCED ─────────────────────────────────────────────────────────
const RAIN_COUNT = 2000;

function Rain() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const drops = useMemo(() => Array.from({ length: RAIN_COUNT }, () => ({
    x: (Math.random() - 0.5) * 40,
    y: Math.random() * 25,
    z: (Math.random() - 0.5) * 25,
    speed: 8 + Math.random() * 6,
    len: 0.15 + Math.random() * 0.25,
  })), []);

  const geo = useMemo(() => new THREE.CylinderGeometry(0.008, 0.008, 1, 3), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#8ab4d4",
    transparent: true,
    opacity: 0.35,
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < RAIN_COUNT; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      d.x += 0.8 * dt; // viento lateral
      if (d.y < -1) {
        d.y = 24;
        d.x = (Math.random() - 0.5) * 40;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, 0.08); // inclinación por viento
      dummy.scale.set(1, d.len, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, RAIN_COUNT]} frustumCulled={false} />;
}

// ─── CHARCOS — splash particles ───────────────────────────────────────────────
function RainSplashes() {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const count = 120;
    const pos   = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 30;
      pos[i*3+1] = 0.02;
      pos[i*3+2] = (Math.random() - 0.5) * 20;
      phases[i]  = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("phase",    new THREE.BufferAttribute(phases, 1));
    const m = new THREE.PointsMaterial({
      size: 0.12, color: "#a0c8e8",
      transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const phases = geo.attributes.phase.array as Float32Array;
    mat.opacity = 0.3 + Math.sin(t * 8) * 0.2;
    // Parpadeo rápido simula impacto de gotas
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < 120; i++) {
      pos[i*3+1] = 0.02 + Math.abs(Math.sin(t * 12 + phases[i])) * 0.04;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── SUELO MOJADO ─────────────────────────────────────────────────────────────
function WetGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[60, 60, 1, 1]} />
      <MeshReflectorMaterial
        blur={[400, 150]}
        resolution={512}
        mixBlur={0.9}
        mixStrength={60}
        roughness={0.8}
        depthScale={1.4}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.6}
        color="#050a15"
        metalness={0.7}
        mirror={0}
      />
    </mesh>
  );
}

// ─── ÁRBOL CON VIENTO ─────────────────────────────────────────────────────────
function Tree({ x, z, h, s }: { x: number; z: number; h: number; s: number }) {
  const ref = useRef<THREE.Group>(null);
  const t0  = useRef(Math.random() * 10);

  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a0e06", roughness: 0.95,
  }), []);

  // Follaje oscuro — ambiente de lluvia y sombras
  const leafMats = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: "#0a1a0a", roughness: 0.9, emissive: new THREE.Color("#050f05"), emissiveIntensity: 0.1 }),
    new THREE.MeshStandardMaterial({ color: "#0d1f0d", roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: "#081508", roughness: 0.9 }),
  ], []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + t0.current;
    // Balanceo por viento — más intenso en la copa
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.025 + Math.sin(t * 1.7) * 0.01;
    ref.current.rotation.x = Math.sin(t * 0.6) * 0.008;
  });

  return (
    <group ref={ref} position={[x, 0, z]} scale={[s, s, s]}>
      {/* Tronco */}
      <mesh position={[0, h * 0.4, 0]} material={trunkMat}>
        <cylinderGeometry args={[0.1 * s, 0.16 * s, h * 0.8, 7]} />
      </mesh>
      {/* Copa principal */}
      <mesh position={[0, h * 0.85, 0]} material={leafMats[0]}>
        <sphereGeometry args={[h * 0.38, 8, 6]} />
      </mesh>
      <mesh position={[-h * 0.22, h * 0.72, 0.1]} material={leafMats[1]}>
        <sphereGeometry args={[h * 0.28, 7, 5]} />
      </mesh>
      <mesh position={[h * 0.22, h * 0.75, -0.1]} material={leafMats[2]}>
        <sphereGeometry args={[h * 0.25, 7, 5]} />
      </mesh>
      {/* Punta */}
      <mesh position={[0, h * 1.15, 0]} material={leafMats[0]}>
        <sphereGeometry args={[h * 0.18, 6, 5]} />
      </mesh>
    </group>
  );
}

function Forest() {
  const trees = useMemo(() => [
    // Fila trasera — más grandes y oscuros
    { x: -12, z: -12, h: 4.5, s: 1.0 }, { x: -7, z: -13, h: 5.0, s: 1.1 },
    { x: -2,  z: -14, h: 4.2, s: 0.9 }, { x: 3,  z: -13, h: 5.2, s: 1.0 },
    { x: 8,   z: -12, h: 4.8, s: 1.1 }, { x: 13, z: -11, h: 4.0, s: 0.95 },
    // Fila media
    { x: -10, z: -7, h: 3.8, s: 0.9 }, { x: -6, z: -8, h: 4.2, s: 1.0 },
    { x: 6,   z: -8, h: 3.9, s: 0.95 }, { x: 10, z: -7, h: 4.4, s: 1.0 },
    // Laterales
    { x: -15, z: -5, h: 5.5, s: 1.2 }, { x: 15, z: -5, h: 5.2, s: 1.1 },
    { x: -18, z: -9, h: 4.8, s: 1.0 }, { x: 18, z: -9, h: 5.0, s: 1.0 },
  ], []);

  return <>{trees.map((t: { x: number; z: number; h: number; s: number }, i: number) => <Tree key={i} {...t} />)}</>;
}

// ─── RAYO ─────────────────────────────────────────────────────────────────────
function Lightning() {
  const ref    = useRef<THREE.Mesh>(null);
  const timer  = useRef(0);
  const active = useRef(false);
  const nextAt = useRef(3 + Math.random() * 5);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#c8d8ff", transparent: true, opacity: 0,
  }), []);

  useFrame(({ clock }) => {
    timer.current = clock.elapsedTime;
    if (!ref.current) return;

    if (!active.current && timer.current > nextAt.current) {
      active.current = true;
      nextAt.current = timer.current + 4 + Math.random() * 8;
    }

    if (active.current) {
      const age = timer.current - (nextAt.current - 4 - Math.random() * 8);
      const flash = Math.max(0, 1 - age * 8);
      mat.opacity = flash * 0.7;
      if (flash <= 0) active.current = false;
    }
  });

  return (
    <mesh ref={ref} position={[(Math.random() - 0.5) * 20, 8, -15]} material={mat}>
      <planeGeometry args={[0.08, 16]} />
    </mesh>
  );
}

// ─── NIEBLA VOLUMÉTRICA ───────────────────────────────────────────────────────
function FogPlanes() {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const t0s  = [0, 2.5, 5];

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#1a2535",
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const t = clock.elapsedTime + t0s[i];
      ref.current.position.x = Math.sin(t * 0.08) * 3;
      ref.current.material.opacity = 0.12 + Math.sin(t * 0.15) * 0.06;
    });
  });

  return (
    <>
      {refs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0.8 + i * 0.6, -5 - i * 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 20]} />
          <primitive object={mat} />
        </mesh>
      ))}
    </>
  );
}

// ─── LUNA ENTRE NUBES ─────────────────────────────────────────────────────────
function MoonAndClouds() {
  const moonRef  = useRef<THREE.Mesh>(null);
  const cloud1   = useRef<THREE.Mesh>(null);
  const cloud2   = useRef<THREE.Mesh>(null);

  const moonMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#d8e8f8" }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#8ab4d4", transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false,
  }), []);
  const cloudMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#1a2535", transparent: true, opacity: 0.85, depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (cloud1.current) cloud1.current.position.x = -2 + Math.sin(t * 0.04) * 4;
    if (cloud2.current) cloud2.current.position.x =  3 + Math.sin(t * 0.03 + 1) * 3;
    if (moonRef.current) {
      (moonRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.7 + Math.sin(t * 0.2) * 0.15;
    }
  });

  return (
    <group position={[-4, 11, -25]}>
      {/* Halo */}
      <mesh>
        <circleGeometry args={[4.5, 32]} />
        <primitive object={glowMat} />
      </mesh>
      {/* Luna */}
      <mesh ref={moonRef}>
        <circleGeometry args={[2.2, 32]} />
        <primitive object={moonMat} />
      </mesh>
      {/* Nubes pasando */}
      <mesh ref={cloud1} position={[-2, 0.5, 0.1]} scale={[3.5, 1.2, 1]}>
        <circleGeometry args={[1, 16]} />
        <primitive object={cloudMat} />
      </mesh>
      <mesh ref={cloud2} position={[3, -0.3, 0.1]} scale={[2.8, 1.0, 1]}>
        <circleGeometry args={[1, 16]} />
        <primitive object={cloudMat} />
      </mesh>
    </group>
  );
}

// ─── LUCES ────────────────────────────────────────────────────────────────────
function Lights() {
  const blueRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (blueRef.current) {
      blueRef.current.intensity = 0.4 + Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });
  return (
    <>
      <ambientLight intensity={0.06} color="#0a1525" />
      <directionalLight position={[-5, 15, -5]} intensity={0.15} color="#8ab4d4" />
      <pointLight ref={blueRef} position={[0, 6, 2]} intensity={0.4} color="#4a7aaa" distance={25} />
      <pointLight position={[0, 2, 0]} intensity={0.3} color="#6a9acc" distance={10} />
    </>
  );
}

// ─── CÁMARA ───────────────────────────────────────────────────────────────────
const CAM_WAYPOINTS = [
  { pos: [0, 2.5, 9],    look: [0, 1.5, 0]   },
  { pos: [0, 3.5, 8],    look: [0, 2.0, -2]  },
  { pos: [-2, 2.0, 7],   look: [0, 1.5, 0]   },
  { pos: [2, 1.8, 6],    look: [0, 1.5, -1]  },
  { pos: [0, 1.5, 5],    look: [0, 2.0, 0]   },
  { pos: [-1.5, 2.0, 5], look: [0, 1.8, 0]   },
  { pos: [1.5, 2.0, 5],  look: [0, 1.8, 0]   },
  { pos: [0, 0.5, 6],    look: [0, 1.2, -1]  },
  { pos: [0, 5.0, 8],    look: [0, 2.0, -3]  },
  { pos: [0, 2.0, 11],   look: [0, 1.5, 0]   },
];

function CameraRig({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const curPos  = useRef(new THREE.Vector3(0, 2.5, 9));
  const curLook = useRef(new THREE.Vector3(0, 1.5, 0));
  const tgtPos  = useRef(new THREE.Vector3(0, 2.5, 9));
  const tgtLook = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame(() => {
    const s     = Math.max(0, Math.min(0.9999, scrollRef.current ?? 0));
    const total = CAM_WAYPOINTS.length - 1;
    const idx   = Math.floor(s * total);
    const local = s * total - idx;
    const ease  = local < 0.5 ? 2*local*local : -1+(4-2*local)*local;
    const a = CAM_WAYPOINTS[idx];
    const b = CAM_WAYPOINTS[Math.min(idx + 1, total)];

    tgtPos.current.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * ease,
      a.pos[1] + (b.pos[1] - a.pos[1]) * ease,
      a.pos[2] + (b.pos[2] - a.pos[2]) * ease,
    );
    tgtLook.current.set(
      a.look[0] + (b.look[0] - a.look[0]) * ease,
      a.look[1] + (b.look[1] - a.look[1]) * ease,
      a.look[2] + (b.look[2] - a.look[2]) * ease,
    );
    curPos.current.lerp(tgtPos.current, 0.045);
    curLook.current.lerp(tgtLook.current, 0.045);
    camera.position.copy(curPos.current);
    camera.lookAt(curLook.current);
  });
  return null;
}

// ─── ESCENA ───────────────────────────────────────────────────────────────────
function Scene({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  return (
    <>
      <Lights />
      <CameraRig scrollRef={scrollRef} />
      <Stars radius={60} depth={40} count={1500} factor={3} saturation={0.2} fade speed={0.3} />
      <MoonAndClouds />
      <Forest />
      <WetGround />
      <Rain />
      <RainSplashes />
      <FogPlanes />
      <Lightning />
    </>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function RainWorld({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 9], fov: 55, near: 0.1, far: 120 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.85,
      }}
      dpr={[1, 1.5]}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      <color attach="background" args={["#020810"]} />
      <fog attach="fog" args={["#020810", 18, 55]} />
      <Scene scrollRef={scrollRef} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur radius={0.4} />
        <Vignette offset={0.15} darkness={0.75} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
