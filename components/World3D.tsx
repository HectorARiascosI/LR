"use client";
import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { createHeartShape } from "@/lib/forestGeometry";

// ─── SAKURA PETALS — Instanced Mesh (1 draw call para 1500 pétalos) ───────────
const PETAL_COUNT = 1500;

function SakuraPetals() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy  = useMemo(() => new THREE.Object3D(), []);

  // Datos por pétalo — pre-calculados, nunca se recrean
  const petals = useMemo(() => {
    return Array.from({ length: PETAL_COUNT }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: Math.random() * 30 - 5,
      z: (Math.random() - 0.5) * 30 - 5,
      rotX: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      swing: (Math.random() - 0.5) * 0.015,
      phase: Math.random() * Math.PI * 2,
      scale: 0.04 + Math.random() * 0.06,
    }));
  }, []);

  const geo = useMemo(() => {
    // Pétalo como elipse aplanada
    const g = new THREE.PlaneGeometry(1, 0.6, 1, 1);
    // Deformar para forma de pétalo
    const pos = g.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i+1];
      pos[i+1] = y + Math.abs(x) * 0.3; // curva
    }
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ffb7c5"),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petals[i];
      // Caída con balanceo
      p.y -= p.speed * 0.008;
      p.x += Math.sin(t * 0.3 + p.phase) * p.swing;
      if (p.y < -8) { p.y = 22; p.x = (Math.random() - 0.5) * 40; }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX + t * 0.3, t * 0.2 + p.phase, p.rotZ + t * 0.15);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, PETAL_COUNT]} frustumCulled={false} />;
}

// ─── LUNA ANIME ────────────────────────────────────────────────────────────────
function AnimeMoon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const moonGeo = useMemo(() => new THREE.CircleGeometry(2.2, 64), []);
  const moonMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#fff8e8"),
    transparent: true, opacity: 0.92,
  }), []);
  const glowGeo = useMemo(() => new THREE.CircleGeometry(3.5, 64), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#f5d98a"),
    transparent: true, opacity: 0.12,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    glowRef.current.material.opacity = 0.10 + Math.sin(clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <group position={[8, 10, -25]}>
      <mesh ref={glowRef} geometry={glowGeo} material={glowMat} />
      <mesh ref={meshRef} geometry={moonGeo} material={moonMat} />
    </group>
  );
}

// ─── MONTAÑAS ANIME (silueta) ──────────────────────────────────────────────────
function AnimeMountains() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-30, -4);
    shape.lineTo(-20, 4);
    shape.lineTo(-14, 1);
    shape.lineTo(-8, 8);
    shape.lineTo(-2, 3);
    shape.lineTo(4, 10);
    shape.lineTo(10, 4);
    shape.lineTo(16, 7);
    shape.lineTo(22, 2);
    shape.lineTo(30, -4);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#0a0520"),
    transparent: true, opacity: 0.85,
    side: THREE.DoubleSide,
  }), []);

  return <mesh geometry={geo} material={mat} position={[0, -6, -20]} />;
}

// ─── ESTRELLAS — instanced, estáticas ─────────────────────────────────────────
function Stars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const starData = useMemo(() => Array.from({ length: 400 }, () => ({
    x: (Math.random() - 0.5) * 80,
    y: Math.random() * 30 + 5,
    z: -30 + Math.random() * 10,
    s: 0.02 + Math.random() * 0.06,
    phase: Math.random() * Math.PI * 2,
  })), []);

  const geo = useMemo(() => new THREE.CircleGeometry(1, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffffff", transparent: true, opacity: 0.8,
  }), []);

  useEffect(() => {
    if (!meshRef.current) return;
    starData.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [starData, dummy]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    // Twinkle — solo actualizar opacidad via material no es posible por instancia
    // Usamos una rotación mínima para simular parpadeo
    starData.forEach((s, i) => {
      const flicker = 0.5 + Math.sin(t * 1.5 + s.phase) * 0.5;
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(s.s * (0.7 + flicker * 0.3));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, 400]} frustumCulled={false} />;
}

// ─── CORAZÓN 3D CON PARTÍCULAS ─────────────────────────────────────────────────
function Heart3D({ visible }: { visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const opRef = useRef(0);

  const heartGeo = useMemo(() => {
    const shape = createHeartShape();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.2, bevelEnabled: true, bevelSegments: 4,
      steps: 2, bevelSize: 0.06, bevelThickness: 0.06,
    });
    geo.center();
    geo.scale(0.6, 0.6, 0.6);
    return geo;
  }, []);

  const heartMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d4b8ff",
    emissive: new THREE.Color("#8b1a4a"),
    emissiveIntensity: 0.8,
    metalness: 0.4,
    roughness: 0.3,
    transparent: true,
    opacity: 0,
  }), []);

  // Partículas orbitando el corazón
  const orbitGeo = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 0.8;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      // Lila / rosa / dorado
      const c = Math.random();
      if (c < 0.5) { col[i*3]=0.83; col[i*3+1]=0.72; col[i*3+2]=1.0; }
      else if (c < 0.8) { col[i*3]=1.0; col[i*3+1]=0.72; col[i*3+2]=0.83; }
      else { col[i*3]=0.96; col[i*3+1]=0.85; col[i*3+2]=0.54; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  const orbitMat = useMemo(() => new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const target = visible ? 1 : 0;
    opRef.current += (target - opRef.current) * 0.03;
    heartMat.opacity = opRef.current * 0.9;
    orbitMat.opacity = opRef.current * 0.7;

    if (opRef.current > 0.01) {
      const beat = Math.sin(t * 1.2 * Math.PI * 2);
      groupRef.current.scale.setScalar(1 + beat * 0.06);
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.5;
      heartMat.emissiveIntensity = 0.6 + beat * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh geometry={heartGeo} material={heartMat} />
      <points geometry={orbitGeo} material={orbitMat} />
      <pointLight color="#d4b8ff" intensity={0} distance={6} position={[0,0,1]} />
    </group>
  );
}

// ─── TORII GATE (puerta japonesa) ─────────────────────────────────────────────
function ToriiGate() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#8b1a1a",
    emissive: new THREE.Color("#3a0808"),
    emissiveIntensity: 0.3,
    roughness: 0.7,
  }), []);

  const pillarGeo = useMemo(() => new THREE.CylinderGeometry(0.12, 0.15, 5, 8), []);
  const beamGeo   = useMemo(() => new THREE.BoxGeometry(5.5, 0.22, 0.22), []);
  const topGeo    = useMemo(() => new THREE.BoxGeometry(6.2, 0.18, 0.28), []);

  return (
    <group position={[0, -2, -8]}>
      <mesh geometry={pillarGeo} material={mat} position={[-2.2, 0, 0]} />
      <mesh geometry={pillarGeo} material={mat} position={[ 2.2, 0, 0]} />
      <mesh geometry={beamGeo}   material={mat} position={[0, 2.0, 0]} />
      <mesh geometry={topGeo}    material={mat} position={[0, 2.4, 0]} />
    </group>
  );
}

// ─── PARTÍCULAS DE FONDO (nebulosa) ───────────────────────────────────────────
function NebulaParticles() {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const count = 800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 60;
      pos[i*3+1] = (Math.random() - 0.5) * 40;
      pos[i*3+2] = -20 + Math.random() * 10;
      const r = Math.random();
      if (r < 0.4) { col[i*3]=0.7; col[i*3+1]=0.55; col[i*3+2]=0.9; }
      else if (r < 0.7) { col[i*3]=0.9; col[i*3+1]=0.55; col[i*3+2]=0.7; }
      else { col[i*3]=0.96; col[i*3+1]=0.85; col[i*3+2]=0.54; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * 0.005;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── CÁMARA CONTROLADA POR SCROLL ─────────────────────────────────────────────
interface CameraRigProps {
  scrollRef: React.RefObject<number>;
}

function CameraRig({ scrollRef }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  // Waypoints de cámara por sección (0..1)
  const waypoints = useMemo(() => [
    { t: 0.00, pos: [0, 0, 8],   look: [0, 0, 0] },
    { t: 0.12, pos: [0, 0, 6],   look: [0, 0, 0] },
    { t: 0.22, pos: [-1, 1, 5],  look: [0, 0, -2] },
    { t: 0.35, pos: [0, 0, 4],   look: [0, 0, -4] },
    { t: 0.48, pos: [1, -0.5, 3],look: [0, 0, -2] },
    { t: 0.60, pos: [0, 0.5, 5], look: [0, 0.5, 0] },
    { t: 0.72, pos: [-1, 0, 6],  look: [0, 0, 0] },
    { t: 0.84, pos: [0, 0, 5],   look: [0, 0, 0] },
    { t: 1.00, pos: [0, 0, 7],   look: [0, 0, 0] },
  ], []);

  useFrame(() => {
    const s = Math.max(0, Math.min(1, scrollRef.current ?? 0));

    // Encontrar segmento
    let a = waypoints[0], b = waypoints[1];
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (s >= waypoints[i].t && s <= waypoints[i+1].t) {
        a = waypoints[i]; b = waypoints[i+1]; break;
      }
    }
    const seg = b.t - a.t;
    const local = seg > 0 ? (s - a.t) / seg : 0;
    const ease = local < 0.5 ? 2*local*local : -1+(4-2*local)*local;

    targetPos.current.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * ease,
      a.pos[1] + (b.pos[1] - a.pos[1]) * ease,
      a.pos[2] + (b.pos[2] - a.pos[2]) * ease,
    );
    targetLook.current.set(
      a.look[0] + (b.look[0] - a.look[0]) * ease,
      a.look[1] + (b.look[1] - a.look[1]) * ease,
      a.look[2] + (b.look[2] - a.look[2]) * ease,
    );

    // Suavizado de cámara
    camera.position.lerp(targetPos.current, 0.06);
    currentLook.current.lerp(targetLook.current, 0.06);
    camera.lookAt(currentLook.current);
  });

  return null;
}

// ─── LUCES ────────────────────────────────────────────────────────────────────
function Lights() {
  const pinkRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (pinkRef.current) {
      pinkRef.current.intensity = 0.4 + Math.sin(clock.elapsedTime * 0.7) * 0.15;
    }
  });
  return (
    <>
      <ambientLight intensity={0.08} color="#1a0a2e" />
      <pointLight position={[0, 5, 3]} intensity={0.5} color="#b48ee8" distance={20} />
      <pointLight ref={pinkRef} position={[-5, 3, 2]} intensity={0.4} color="#f0a8c8" distance={15} />
      <pointLight position={[0, 8, -10]} intensity={0.3} color="#f5d98a" distance={25} />
    </>
  );
}

// ─── ESCENA PRINCIPAL ─────────────────────────────────────────────────────────
interface WorldProps {
  scrollRef: React.RefObject<number>;
  heartVisible: boolean;
}

function WorldScene({ scrollRef, heartVisible }: WorldProps) {
  return (
    <>
      <Lights />
      <CameraRig scrollRef={scrollRef} />
      <Stars />
      <AnimeMoon />
      <AnimeMountains />
      <ToriiGate />
      <NebulaParticles />
      <SakuraPetals />
      <Heart3D visible={heartVisible} />
    </>
  );
}

// ─── CANVAS EXPORT ────────────────────────────────────────────────────────────
interface World3DProps {
  scrollRef: React.RefObject<number>;
  heartVisible: boolean;
}

export default function World3D({ scrollRef, heartVisible }: World3DProps) {
  return (
    <Canvas
      id="world-canvas"
      camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 100 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={[1, 1.5]}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      <color attach="background" args={["#03010f"]} />
      <fog attach="fog" args={["#03010f", 30, 80]} />
      <WorldScene scrollRef={scrollRef} heartVisible={heartVisible} />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.4}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.55}
        />
        <Vignette offset={0.25} darkness={0.7} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
