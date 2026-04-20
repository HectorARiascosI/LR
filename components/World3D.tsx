"use client";
/**
 * World3D — Escena 3D inmersiva completa
 * - Robot animado con 14 animaciones reales (GLB oficial Three.js)
 * - Suelo reflectante con MeshReflectorMaterial
 * - 800 pétalos de sakura instanced (1 draw call)
 * - Luna, montañas, árboles de sakura, estrellas
 * - Cámara cinematográfica por scroll
 * - Partículas mágicas
 */
import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  MeshReflectorMaterial,
  Environment,
  Stars as DreiStars,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── ROBOT ANIMADO ────────────────────────────────────────────────────────────
const ANIM_BY_SECTION: Record<number, string> = {
  0: "Idle",
  1: "Wave",
  2: "Idle",
  3: "Walking",
  4: "Dance",
  5: "ThumbsUp",
  6: "Standing",
  7: "Idle",
  8: "Yes",
  9: "Wave",
};

interface RobotProps {
  section: number;
  position?: [number, number, number];
  scale?: number;
}

function Robot({ section, position = [0, 0, 0], scale = 1 }: RobotProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/robot.glb");
  const { actions, mixer } = useAnimations(animations, group);
  const prevAnim = useRef<string>("");

  // Clonar escena para poder tener múltiples instancias
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Aplicar cel-shading toon a todos los materiales
  useEffect(() => {
    clonedScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat, i) => {
          const toon = new THREE.MeshToonMaterial({
            color: (mat as THREE.MeshStandardMaterial).color ?? new THREE.Color("#888"),
            emissive: new THREE.Color("#1a0a2e"),
            emissiveIntensity: 0.05,
          });
          if (Array.isArray(mesh.material)) mesh.material[i] = toon;
          else mesh.material = toon;
        });
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    const animName = ANIM_BY_SECTION[section] ?? "Idle";
    if (animName === prevAnim.current) return;

    const prev = actions[prevAnim.current];
    const next = actions[animName];
    if (!next) return;

    if (prev) {
      prev.fadeOut(0.4);
    }
    next.reset().fadeIn(0.4).play();
    prevAnim.current = animName;
  }, [section, actions]);

  // Iniciar animación idle al montar
  useEffect(() => {
    const idle = actions["Idle"];
    if (idle) {
      idle.play();
      prevAnim.current = "Idle";
    }
  }, [actions]);

  useFrame((_, delta) => {
    mixer.update(delta);
    // Leve balanceo de cabeza
    if (group.current) {
      group.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.15;
    }
  });

  return (
    <group ref={group} position={position} scale={[scale, scale, scale]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── SUELO REFLECTANTE ────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={512}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050015"
        metalness={0.6}
        mirror={0}
      />
    </mesh>
  );
}

// ─── PÉTALOS DE SAKURA ────────────────────────────────────────────────────────
const PETAL_COUNT = 800;

function SakuraPetals() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo(() => Array.from({ length: PETAL_COUNT }, () => ({
    x: (Math.random() - 0.5) * 30,
    y: 1 + Math.random() * 18,
    z: (Math.random() - 0.5) * 20,
    rx: Math.random() * Math.PI * 2,
    rz: Math.random() * Math.PI * 2,
    speed: 0.25 + Math.random() * 0.5,
    swing: (Math.random() - 0.5) * 0.01,
    phase: Math.random() * Math.PI * 2,
    scale: 0.06 + Math.random() * 0.08,
  })), []);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 0.65);
    const pos = g.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += Math.abs(pos[i]) * 0.3;
    }
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffb7c5",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petals[i];
      p.y -= p.speed * 0.006;
      p.x += Math.sin(t * 0.2 + p.phase) * p.swing;
      if (p.y < 0) { p.y = 18; p.x = (Math.random() - 0.5) * 30; }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx + t * 0.2, t * 0.12 + p.phase, p.rz + t * 0.1);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, PETAL_COUNT]}
      frustumCulled={false}
    />
  );
}

// ─── LUNA ─────────────────────────────────────────────────────────────────────
function Moon() {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.07 + Math.sin(clock.elapsedTime * 0.35) * 0.03;
    }
  });
  return (
    <group position={[8, 12, -28]}>
      <mesh ref={glowRef}>
        <circleGeometry args={[4.5, 64]} />
        <meshBasicMaterial color="#f5d98a" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[2.6, 64]} />
        <meshBasicMaterial color="#fff9f0" />
      </mesh>
    </group>
  );
}

// ─── MONTAÑAS ─────────────────────────────────────────────────────────────────
function Mountains() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-40, -2);
    shape.lineTo(-28, 6); shape.lineTo(-22, 2);
    shape.lineTo(-15, 10); shape.lineTo(-8, 4);
    shape.lineTo(-2, 12); shape.lineTo(4, 5);
    shape.lineTo(10, 9);  shape.lineTo(17, 3);
    shape.lineTo(24, 7);  shape.lineTo(32, 1);
    shape.lineTo(40, -2);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <mesh geometry={geo} position={[0, -2, -28]}>
      <meshBasicMaterial color="#04021a" side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── ÁRBOLES DE SAKURA ────────────────────────────────────────────────────────
function SakuraTree({ x, z, s }: { x: number; z: number; s: number }) {
  const ref = useRef<THREE.Group>(null);
  const t0  = useRef(Math.random() * 10);

  const trunkMat = useMemo(() => new THREE.MeshToonMaterial({ color: "#3d1a08" }), []);
  const leafMat  = useMemo(() => new THREE.MeshToonMaterial({
    color: "#ffb7c5",
    emissive: new THREE.Color("#6b2040"),
    emissiveIntensity: 0.08,
  }), []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.35 + t0.current) * 0.012;
    }
  });

  return (
    <group ref={ref} position={[x, 0, z]} scale={[s, s, s]}>
      <mesh position={[0, 0.9, 0]} material={trunkMat}>
        <cylinderGeometry args={[0.09, 0.13, 1.8, 7]} />
      </mesh>
      <mesh position={[0, 2.2, 0]} material={leafMat}>
        <sphereGeometry args={[0.8, 8, 6]} />
      </mesh>
      <mesh position={[-0.5, 1.9, 0.1]} material={leafMat}>
        <sphereGeometry args={[0.55, 7, 5]} />
      </mesh>
      <mesh position={[0.5, 2.0, -0.1]} material={leafMat}>
        <sphereGeometry args={[0.5, 7, 5]} />
      </mesh>
    </group>
  );
}

function Forest() {
  const trees = useMemo(() => [
    { x: -6, z: -5, s: 1.1 }, { x: -8, z: -3, s: 0.9 }, { x: -10, z: -6, s: 1.3 },
    { x:  6, z: -5, s: 1.0 }, { x:  8, z: -3, s: 1.2 }, { x:  10, z: -6, s: 0.85 },
    { x: -5, z: -9, s: 1.4 }, { x:  5, z: -9, s: 1.1 }, { x:  0,  z: -10, s: 1.2 },
    { x: -12,z: -4, s: 0.8 }, { x:  12, z: -4, s: 0.9 },
    { x: -3, z: -12, s: 1.0 }, { x: 3, z: -12, s: 1.1 },
  ], []);

  return <>{trees.map((t: { x: number; z: number; s: number }, i: number) => <SakuraTree key={i} {...t} />)}</>;
}

// ─── PARTÍCULAS MÁGICAS ───────────────────────────────────────────────────────
function MagicParticles({ active }: { active: boolean }) {
  const ref   = useRef<THREE.Points>(null);
  const opRef = useRef(0);

  const { geo, mat } = useMemo(() => {
    const count = 250;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const ph    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 3;
      pos[i*3]   = Math.cos(theta) * r;
      pos[i*3+1] = Math.random() * 4;
      pos[i*3+2] = Math.sin(theta) * r;
      ph[i] = Math.random() * Math.PI * 2;
      const c = Math.random();
      if (c < 0.5)      { col[i*3]=0.83; col[i*3+1]=0.72; col[i*3+2]=1.0; }
      else if (c < 0.8) { col[i*3]=1.0;  col[i*3+1]=0.72; col[i*3+2]=0.83; }
      else               { col[i*3]=0.96; col[i*3+1]=0.85; col[i*3+2]=0.54; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(col, 3));
    g.setAttribute("phase",    new THREE.BufferAttribute(ph, 1));
    const m = new THREE.PointsMaterial({
      size: 0.07, vertexColors: true, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    opRef.current += ((active ? 0.75 : 0) - opRef.current) * 0.035;
    mat.opacity = opRef.current;
    const pos = geo.attributes.position.array as Float32Array;
    const ph  = geo.attributes.phase.array as Float32Array;
    for (let i = 0; i < 250; i++) {
      pos[i*3+1] += 0.005;
      pos[i*3]   += Math.sin(t * 0.4 + ph[i]) * 0.002;
      if (pos[i*3+1] > 4) pos[i*3+1] = 0;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── LUCES ────────────────────────────────────────────────────────────────────
function Lights() {
  const lilacRef = useRef<THREE.PointLight>(null);
  const pinkRef  = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lilacRef.current) lilacRef.current.intensity = 1.2 + Math.sin(t * 0.7) * 0.3;
    if (pinkRef.current)  pinkRef.current.intensity  = 0.8 + Math.sin(t * 0.5 + 1) * 0.2;
  });
  return (
    <>
      <ambientLight intensity={0.15} color="#1a0a2e" />
      <directionalLight position={[5, 12, 5]} intensity={0.4} color="#fff8e8" castShadow />
      <pointLight ref={lilacRef} position={[0, 5, 3]}  intensity={1.2} color="#b48ee8" distance={20} />
      <pointLight ref={pinkRef}  position={[-4, 4, 2]} intensity={0.8} color="#f0a8c8" distance={16} />
      <pointLight position={[0, 10, -10]} intensity={0.4} color="#f5d98a" distance={28} />
      {/* Luz de suelo para el reflejo */}
      <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#b48ee8" distance={8} />
    </>
  );
}

// ─── CÁMARA CINEMATOGRÁFICA ───────────────────────────────────────────────────
const CAM_WAYPOINTS = [
  { pos: [0,  2.5, 9],   look: [0, 1.2, 0]  },  // 0 intro
  { pos: [0,  3.5, 8],   look: [0, 2,  -2]  },  // 1 awakening — cielo
  { pos: [-1.5, 1.8, 7], look: [0, 1.2, 0]  },  // 2 origin — lateral
  { pos: [2,   1.5, 6],  look: [0, 1.2, -1] },  // 3 formation — bosque
  { pos: [0,   1.2, 4.5],look: [0, 1.5, 0]  },  // 4 heartbeat — zoom
  { pos: [-1,  1.8, 5],  look: [0, 1.5, 0]  },  // 5 letter1
  { pos: [1,   1.8, 5],  look: [0, 1.5, 0]  },  // 6 letter2
  { pos: [0,   0.4, 6],  look: [0, 1.0, -1] },  // 7 letter3 — suelo
  { pos: [0,   5,   8],  look: [0, 1.5, -3] },  // 8 letter4 — elevada
  { pos: [0,   2,  11],  look: [0, 1.2, 0]  },  // 9 final — zoom out
];

function CameraRig({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const curPos  = useRef(new THREE.Vector3(0, 2.5, 9));
  const curLook = useRef(new THREE.Vector3(0, 1.2, 0));
  const tgtPos  = useRef(new THREE.Vector3(0, 2.5, 9));
  const tgtLook = useRef(new THREE.Vector3(0, 1.2, 0));

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

    curPos.current.lerp(tgtPos.current, 0.055);
    curLook.current.lerp(tgtLook.current, 0.055);
    camera.position.copy(curPos.current);
    camera.lookAt(curLook.current);
  });

  return null;
}

// ─── ESCENA ───────────────────────────────────────────────────────────────────
interface SceneProps {
  scrollRef: React.RefObject<number>;
  section: number;
}

function Scene({ scrollRef, section }: SceneProps) {
  return (
    <>
      <Lights />
      <CameraRig scrollRef={scrollRef} />

      {/* Fondo */}
      <DreiStars radius={80} depth={50} count={3000} factor={4} saturation={0.5} fade speed={0.5} />
      <Moon />
      <Mountains />
      <Forest />

      {/* Suelo */}
      <Ground />

      {/* Efectos */}
      <SakuraPetals />
      <MagicParticles active={section >= 4} />

      {/* Personaje */}
      <Suspense fallback={null}>
        <Robot section={section} position={[0, 0, 0]} scale={1.0} />
      </Suspense>

      {/* Luz de relleno para el personaje */}
      <pointLight position={[0, 3, 2]} intensity={0.6} color="#ffffff" distance={6} />
    </>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
interface World3DProps {
  scrollRef: React.RefObject<number>;
  section: number;
}

export default function World3D({ scrollRef, section }: World3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 9], fov: 55, near: 0.1, far: 150 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      dpr={[1, 1.5]}
      shadows={false}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      <color attach="background" args={["#03010f"]} />
      <fog attach="fog" args={["#03010f", 30, 80]} />
      <Scene scrollRef={scrollRef} section={section} />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.3}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.5}
        />
        <Vignette offset={0.2} darkness={0.6} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}

// Preload
useGLTF.preload("/models/robot.glb");
