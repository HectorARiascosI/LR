"use client";
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── PARTÍCULAS COSMOS ────────────────────────────────────────────────────────
function CosmosParticles() {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
      sizes[i] = Math.random();

      const r = Math.random();
      if (r < 0.4) {
        // lila
        col[i * 3] = 0.7 + Math.random() * 0.3;
        col[i * 3 + 1] = 0.55 + Math.random() * 0.2;
        col[i * 3 + 2] = 1.0;
      } else if (r < 0.7) {
        // rosa
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.6 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.8 + Math.random() * 0.2;
      } else {
        // dorado/blanco
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        col[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const m = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.008;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.003) * 0.05;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── NEBULOSA DE FONDO ────────────────────────────────────────────────────────
function Nebula() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.elapsedTime * 0.004;
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(clock.elapsedTime * 0.2) * 0.04;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -20]}>
      <planeGeometry args={[60, 40]} />
      <meshBasicMaterial
        color="#4a1a8e"
        transparent
        opacity={0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── CORAZÓN 3D FLOTANTE ──────────────────────────────────────────────────────
function HeartObject({ onClick, active }: { onClick: () => void; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const heartShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.4);
    shape.bezierCurveTo(0, 0.7, 0.5, 0.9, 0.5, 0.5);
    shape.bezierCurveTo(0.5, 0.1, 0, -0.1, 0, -0.5);
    shape.bezierCurveTo(0, -0.1, -0.5, 0.1, -0.5, 0.5);
    shape.bezierCurveTo(-0.5, 0.9, 0, 0.7, 0, 0.4);
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.25,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.06,
    bevelThickness: 0.06,
  }), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.8) * 0.15;
    ref.current.rotation.y = t * 0.4;
    const s = active ? 1.15 + Math.sin(t * 3) * 0.05 : 1.0;
    ref.current.scale.setScalar(s);
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        (active ? 0.35 : 0.15) + Math.sin(t * 1.5) * 0.08;
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]} onClick={onClick}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 16, 12]} />
        <meshBasicMaterial color="#ff6090" transparent opacity={0.15} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
        <extrudeGeometry args={[heartShape, extrudeSettings]} />
        <meshStandardMaterial color="#ff4080" emissive="#ff2060" emissiveIntensity={0.4} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ─── SOBRE/CARTA FLOTANTE ─────────────────────────────────────────────────────
function EnvelopeObject({ onClick, active }: { onClick: () => void; active: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.6 + 1) * 0.18;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.4;
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.08;
    const s = active ? 1.1 : 1.0;
    ref.current.scale.setScalar(s);
  });

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d4b8ff", emissive: "#8040ff", emissiveIntensity: 0.25,
    roughness: 0.4, metalness: 0.05,
  }), []);

  const flapMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#b890ff", emissive: "#6020ee", emissiveIntensity: 0.2,
    roughness: 0.4, metalness: 0.05,
  }), []);

  return (
    <group ref={ref} onClick={onClick}>
      {/* Cuerpo del sobre */}
      <mesh material={mat}>
        <boxGeometry args={[1.2, 0.85, 0.06]} />
      </mesh>
      {/* Solapa superior */}
      <mesh position={[0, 0.3, 0.01]} rotation={[0.4, 0, 0]} material={flapMat}>
        <boxGeometry args={[1.2, 0.5, 0.04]} />
      </mesh>
      {/* Líneas decorativas */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[0.9, 0.02]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, -0.12, 0.04]}>
        <planeGeometry args={[0.7, 0.02]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ─── FLOR FLOTANTE ────────────────────────────────────────────────────────────
function FlowerObject({ onClick, active }: { onClick: () => void; active: boolean }) {
  const ref = useRef<THREE.Group>(null);

  const petalMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ffb8d4", emissive: "#ff6090", emissiveIntensity: 0.3,
    roughness: 0.5, side: THREE.DoubleSide,
  }), []);

  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#f5d98a", emissive: "#f0a020", emissiveIntensity: 0.5,
    roughness: 0.3,
  }), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.7 + 2) * 0.15;
    ref.current.rotation.y = t * 0.25;
    ref.current.rotation.z = Math.sin(t * 0.4 + 1) * 0.1;
    const s = active ? 1.12 : 1.0;
    ref.current.scale.setScalar(s);
  });

  const petals = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
    }))
  , []);

  return (
    <group ref={ref} onClick={onClick}>
      {petals.map((p: { angle: number }, i: number) => (
        <mesh
          key={i}
          position={[Math.cos(p.angle) * 0.45, Math.sin(p.angle) * 0.45, 0]}
          rotation={[0, 0, p.angle]}
          scale={[0.28, 0.18, 1]}
          material={petalMat}
        >
          <circleGeometry args={[1, 8]} />
        </mesh>
      ))}
      <mesh material={centerMat}>
        <circleGeometry args={[0.2, 16]} />
      </mesh>
    </group>
  );
}

// ─── ESTRELLA FLOTANTE ────────────────────────────────────────────────────────
function StarObject({ onClick, active }: { onClick: () => void; active: boolean }) {
  const ref = useRef<THREE.Group>(null);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#f5d98a", emissive: "#f0c020", emissiveIntensity: 0.6,
    roughness: 0.2, metalness: 0.3,
  }), []);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const pts = 5;
    for (let i = 0; i < pts * 2; i++) {
      const angle = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 0.5 : 0.22;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.9 + 3) * 0.14;
    ref.current.rotation.z = t * 0.3;
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.5;
    const s = active ? 1.15 : 1.0;
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref} onClick={onClick}>
      <mesh material={mat} rotation={[0, 0, 0]}>
        <extrudeGeometry args={[starShape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }]} />
      </mesh>
    </group>
  );
}

// ─── CÁMARA POR SCROLL ────────────────────────────────────────────────────────
const CAM_POINTS = [
  { pos: [0, 0, 8],   look: [0, 0, 0] },
  { pos: [-2, 0.5, 6], look: [0, 0, 0] },
  { pos: [2, -0.5, 6], look: [0, 0, 0] },
  { pos: [0, 1, 5],   look: [0, 0, 0] },
  { pos: [0, 0, 7],   look: [0, 0, 0] },
];

function CameraRig({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const curPos  = useRef(new THREE.Vector3(0, 0, 8));
  const curLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const s = Math.max(0, Math.min(0.9999, scrollRef.current ?? 0));
    const total = CAM_POINTS.length - 1;
    const idx = Math.floor(s * total);
    const local = s * total - idx;
    const ease = local < 0.5 ? 2 * local * local : -1 + (4 - 2 * local) * local;
    const a = CAM_POINTS[idx];
    const b = CAM_POINTS[Math.min(idx + 1, total)];

    const tx = a.pos[0] + (b.pos[0] - a.pos[0]) * ease;
    const ty = a.pos[1] + (b.pos[1] - a.pos[1]) * ease;
    const tz = a.pos[2] + (b.pos[2] - a.pos[2]) * ease;

    curPos.current.lerp(new THREE.Vector3(tx, ty, tz), 0.04);
    curLook.current.lerp(new THREE.Vector3(0, 0, 0), 0.04);
    camera.position.copy(curPos.current);
    camera.lookAt(curLook.current);
  });

  return null;
}

// ─── ESCENA PRINCIPAL ─────────────────────────────────────────────────────────
interface SceneProps {
  scrollRef: React.RefObject<number>;
  onObjectClick: (id: string) => void;
  activeObject: string | null;
}

function Scene({ scrollRef, onObjectClick, activeObject }: SceneProps) {
  return (
    <>
      <CameraRig scrollRef={scrollRef} />
      <Nebula />
      <CosmosParticles />

      {/* Luces */}
      <ambientLight intensity={0.1} color="#1a0a2e" />
      <pointLight position={[0, 5, 5]} intensity={2} color="#b48ee8" distance={20} />
      <pointLight position={[3, -2, 4]} intensity={1.5} color="#ff6090" distance={15} />
      <pointLight position={[-3, 2, 4]} intensity={1.2} color="#f5d98a" distance={15} />

      {/* Objetos flotantes — distribuidos en el espacio */}
      <group position={[-2.5, 0.8, 0]}>
        <HeartObject onClick={() => onObjectClick("heart")} active={activeObject === "heart"} />
      </group>
      <group position={[2.5, -0.5, -1]}>
        <EnvelopeObject onClick={() => onObjectClick("envelope")} active={activeObject === "envelope"} />
      </group>
      <group position={[-1.5, -1.2, 1]}>
        <FlowerObject onClick={() => onObjectClick("flower")} active={activeObject === "flower"} />
      </group>
      <group position={[1.8, 1.2, 0.5]}>
        <StarObject onClick={() => onObjectClick("star")} active={activeObject === "star"} />
      </group>
    </>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
interface CosmosWorldProps {
  scrollRef: React.RefObject<number>;
  onObjectClick: (id: string) => void;
  activeObject: string | null;
}

export default function CosmosWorld({ scrollRef, onObjectClick, activeObject }: CosmosWorldProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 200 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      dpr={[1, 1.5]}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      <color attach="background" args={["#03010f"]} />
      <fog attach="fog" args={["#03010f", 30, 80]} />
      <Scene scrollRef={scrollRef} onObjectClick={onObjectClick} activeObject={activeObject} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.8} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur radius={0.6} />
        <Vignette offset={0.25} darkness={0.7} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
