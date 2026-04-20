"use client";
/**
 * FlowerBouquet — Ramo de flores coreano neón translúcido
 * Reconstruido con geometría real:
 * - Pétalos: ExtrudeGeometry desde Shape bezier real
 * - Tallos: TubeGeometry con CatmullRomCurve3 (curvos, naturales)
 * - Hojas: ShapeGeometry con forma real de hoja
 * - Siempre visible, centrado, grande
 * - Shader fresnel + glow suave
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── SHADER PÉTALO ────────────────────────────────────────────────────────────
const PETAL_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
uniform float uTime;
uniform float uIdx;
void main(){
  vUv = uv;
  vec3 pos = position;
  pos.z += sin(uTime * 1.0 + uIdx * 0.8 + pos.x * 3.0) * 0.008;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vNormal  = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const PETAL_FRAG = `
precision highp float;
varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv;
uniform vec3 uColor; uniform float uTime; uniform float uIdx;
void main(){
  float fr = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
  float pulse = 0.9 + sin(uTime * 1.2 + uIdx * 1.6) * 0.1;
  float center = 1.0 - smoothstep(0.0, 0.7, length(vUv - vec2(0.5, 0.2)));
  vec3 col = uColor * pulse;
  col = mix(col, col * 1.8 + 0.15, center * 0.4);
  col += fr * uColor * 1.6;
  float alpha = 0.28 + fr * 0.55 + center * 0.18;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
}`;

// ─── SHADER TALLO ─────────────────────────────────────────────────────────────
const STEM_VERT = `
varying float vT; uniform float uTime;
void main(){
  vT = uv.y;
  vec3 pos = position;
  pos.x += sin(uTime * 0.4 + pos.y * 2.5) * 0.006;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
const STEM_FRAG = `
precision highp float; varying float vT;
uniform vec3 uColor; uniform float uTime;
void main(){
  float g = 0.65 + sin(uTime * 0.8 + vT * 5.0) * 0.18;
  gl_FragColor = vec4(uColor * g, 0.88);
}`;

// ─── SHADER HOJA ─────────────────────────────────────────────────────────────
const LEAF_VERT = `
varying vec2 vUv; uniform float uTime; uniform float uIdx;
void main(){
  vUv = uv;
  vec3 pos = position;
  pos.z += sin(uTime * 0.6 + uIdx * 1.2) * 0.01;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
const LEAF_FRAG = `
precision highp float; varying vec2 vUv;
uniform vec3 uColor; uniform float uTime; uniform float uIdx;
void main(){
  vec2 uv = vUv * 2.0 - 1.0;
  // Forma de hoja real: elipse con punta
  float leaf = 1.0 - length(vec2(uv.x * 0.55, uv.y - uv.x * uv.x * 0.4));
  if(leaf < 0.0) discard;
  float vein = smoothstep(0.025, 0.0, abs(uv.x)) * smoothstep(-0.8, 0.8, uv.y) * 0.5;
  float alpha = smoothstep(0.0, 0.2, leaf) * 0.78;
  gl_FragColor = vec4(uColor + vein * 0.25, alpha);
}`;

// ─── PÉTALO con forma real bezier ────────────────────────────────────────────
function makePetalGeo(length: number, width: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-width * 0.5, length * 0.25, -width * 0.45, length * 0.7, 0, length);
  shape.bezierCurveTo(width * 0.45, length * 0.7, width * 0.5, length * 0.25, 0, 0);
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
    steps: 1,
  });
}

// ─── FLOR COMPLETA ────────────────────────────────────────────────────────────
function Flower({ pos, color, petalCount, petalLen, petalW, scale, phase }: {
  pos: [number, number, number];
  color: THREE.Color;
  petalCount: number;
  petalLen: number;
  petalW: number;
  scale: number;
  phase: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const petalGeo = useMemo(() => makePetalGeo(petalLen, petalW), [petalLen, petalW]);

  const petalMats = useMemo(() =>
    Array.from({ length: petalCount }, (_, i) => new THREE.ShaderMaterial({
      vertexShader: PETAL_VERT,
      fragmentShader: PETAL_FRAG,
      uniforms: {
        uColor: { value: color.clone() },
        uTime:  { value: 0 },
        uIdx:   { value: i + phase * 10 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
  , [color, petalCount, phase]);

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  }), [color]);

  const centerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0.97, 0.85),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    petalMats.forEach(m => { m.uniforms.uTime.value = clock.elapsedTime; });
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.3 + phase) * 0.03;
    }
  });

  return (
    <group ref={ref} position={pos} scale={[scale, scale, scale]}>
      {/* Glow halo */}
      <mesh>
        <circleGeometry args={[petalLen * 1.5, 20]} />
        <primitive object={glowMat} />
      </mesh>
      {/* Pétalos distribuidos en círculo */}
      {Array.from({ length: petalCount }, (_, i) => {
        const angle = (i / petalCount) * Math.PI * 2 + phase;
        // Cada pétalo apunta hacia afuera desde el centro
        return (
          <mesh
            key={i}
            geometry={petalGeo}
            material={petalMats[i]}
            position={[0, 0, 0]}
            rotation={[
              Math.PI * 0.15,  // inclinación hacia cámara
              0,
              angle,           // rotación alrededor del centro
            ]}
          />
        );
      })}
      {/* Centro de la flor */}
      <mesh material={centerMat} position={[0, 0, 0.015]}>
        <circleGeometry args={[petalW * 0.35, 16]} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[petalW * 0.18, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.9}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── TALLO CURVO con TubeGeometry ────────────────────────────────────────────
function Stem({ from, to, color }: {
  from: [number, number, number];
  to: [number, number, number];
  color: THREE.Color;
}) {
  const geo = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2 + (Math.random() - 0.5) * 0.08,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2,
    ];
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.009, 5, false);
  }, [from, to]);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STEM_VERT,
    fragmentShader: STEM_FRAG,
    uniforms: { uColor: { value: color }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color]);

  useFrame(({ clock }) => { mat.uniforms.uTime.value = clock.elapsedTime; });

  return <mesh geometry={geo} material={mat} />;
}

// ─── HOJA ─────────────────────────────────────────────────────────────────────
function Leaf({ pos, rotZ, scaleX, scaleY, color, idx }: {
  pos: [number, number, number];
  rotZ: number; scaleX: number; scaleY: number;
  color: THREE.Color; idx: number;
}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: LEAF_VERT,
    fragmentShader: LEAF_FRAG,
    uniforms: { uColor: { value: color }, uTime: { value: 0 }, uIdx: { value: idx } },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color, idx]);

  useFrame(({ clock }) => { mat.uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh material={mat} position={pos} rotation={[0.2, 0, rotZ]} scale={[scaleX, scaleY, 1]}>
      <planeGeometry args={[1, 1, 2, 4]} />
    </mesh>
  );
}

// ─── RAMO PRINCIPAL ───────────────────────────────────────────────────────────
export default function FlowerBouquet() {
  const groupRef = useRef<THREE.Group>(null);

  // Base del ramo — punto de convergencia de tallos
  const BASE: [number, number, number] = [0, -1.1, 0];

  const FLOWERS = useMemo(() => [
    // Flor central — la más grande y prominente
    { pos: [0,    0.7,  0.0] as [number,number,number], color: new THREE.Color("#ff3d9a"), petals: 8, len: 0.32, w: 0.14, scale: 1.0,  phase: 0    },
    // Corona de flores medianas
    { pos: [-0.38, 0.42, 0.05] as [number,number,number], color: new THREE.Color("#b833ff"), petals: 7, len: 0.26, w: 0.12, scale: 0.88, phase: 0.5  },
    { pos: [0.40,  0.45, 0.05] as [number,number,number], color: new THREE.Color("#33ddff"), petals: 7, len: 0.24, w: 0.11, scale: 0.85, phase: 1.1  },
    { pos: [-0.18, 0.78, 0.08] as [number,number,number], color: new THREE.Color("#ff7733"), petals: 6, len: 0.22, w: 0.10, scale: 0.80, phase: 1.7  },
    { pos: [0.20,  0.75, 0.08] as [number,number,number], color: new THREE.Color("#ff3366"), petals: 6, len: 0.20, w: 0.09, scale: 0.78, phase: 2.3  },
    // Flores pequeñas de relleno
    { pos: [-0.52, 0.60, 0.10] as [number,number,number], color: new THREE.Color("#cc99ff"), petals: 5, len: 0.17, w: 0.08, scale: 0.70, phase: 0.3  },
    { pos: [0.50,  0.62, 0.10] as [number,number,number], color: new THREE.Color("#ffcc33"), petals: 5, len: 0.16, w: 0.08, scale: 0.68, phase: 0.9  },
    { pos: [0.05,  0.95, 0.12] as [number,number,number], color: new THREE.Color("#ff66aa"), petals: 6, len: 0.18, w: 0.08, scale: 0.72, phase: 1.5  },
    { pos: [-0.30, 0.90, 0.12] as [number,number,number], color: new THREE.Color("#33ff99"), petals: 5, len: 0.15, w: 0.07, scale: 0.65, phase: 2.1  },
    { pos: [0.32,  0.88, 0.12] as [number,number,number], color: new THREE.Color("#ff4444"), petals: 5, len: 0.14, w: 0.07, scale: 0.62, phase: 2.7  },
  ], []);

  const LEAVES = useMemo(() => [
    { pos: [-0.42, -0.05, 0.0] as [number,number,number], rotZ: -0.55, sx: 0.28, sy: 0.48, color: new THREE.Color("#22bb44"), idx: 0 },
    { pos: [0.40,  -0.02, 0.0] as [number,number,number], rotZ:  0.55, sx: 0.26, sy: 0.44, color: new THREE.Color("#1dcc44"), idx: 1 },
    { pos: [-0.28,  0.18, 0.0] as [number,number,number], rotZ: -0.38, sx: 0.22, sy: 0.38, color: new THREE.Color("#22bb44"), idx: 2 },
    { pos: [0.26,   0.15, 0.0] as [number,number,number], rotZ:  0.38, sx: 0.20, sy: 0.36, color: new THREE.Color("#1dcc44"), idx: 3 },
    { pos: [-0.55,  0.30, 0.0] as [number,number,number], rotZ: -0.72, sx: 0.20, sy: 0.34, color: new THREE.Color("#18aa33"), idx: 4 },
    { pos: [0.52,   0.28, 0.0] as [number,number,number], rotZ:  0.72, sx: 0.18, sy: 0.32, color: new THREE.Color("#18aa33"), idx: 5 },
  ], []);

  const stemColor = useMemo(() => new THREE.Color("#1aaa33"), []);

  // Lazo
  const ribbonMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ff3d9a"),
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.45) * 0.055;
    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.10;
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>

      {/* Tallos curvos — uno por flor principal */}
      {FLOWERS.slice(0, 7).map((f, i) => (
        <Stem key={i} from={BASE} to={f.pos} color={stemColor} />
      ))}

      {/* Hojas */}
      {LEAVES.map((l, i) => (
        <Leaf key={i} pos={l.pos} rotZ={l.rotZ} scaleX={l.sx} scaleY={l.sy} color={l.color} idx={l.idx} />
      ))}

      {/* Flores */}
      {FLOWERS.map((f, i) => (
        <Flower
          key={i}
          pos={f.pos}
          color={f.color}
          petalCount={f.petals}
          petalLen={f.len}
          petalW={f.w}
          scale={f.scale}
          phase={f.phase}
        />
      ))}

      {/* Lazo en la base */}
      <mesh material={ribbonMat} position={[-0.06, -0.82, 0]} rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.10, 0.018, 6, 14, Math.PI * 1.1]} />
      </mesh>
      <mesh material={ribbonMat} position={[0.06, -0.82, 0]} rotation={[0, 0, -0.4]}>
        <torusGeometry args={[0.10, 0.018, 6, 14, Math.PI * 1.1]} />
      </mesh>
      <mesh position={[0, -0.82, 0]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshBasicMaterial color="#ff3d9a" transparent opacity={0.9}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Partículas de brillo */}
      <GlowParticles />
    </group>
  );
}

// ─── PARTÍCULAS DE BRILLO ─────────────────────────────────────────────────────
function GlowParticles() {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const n = 180;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const ph  = new Float32Array(n);
    const COLS = [[1,.25,.6],[.75,.25,1],[.25,.85,1],[1,.5,.2],[1,.88,.3]];
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.65;
      pos[i*3]   = Math.cos(theta) * r;
      pos[i*3+1] = -1.0 + Math.random() * 2.2;
      pos[i*3+2] = Math.sin(theta) * r * 0.35;
      ph[i] = Math.random() * Math.PI * 2;
      const c = COLS[Math.floor(Math.random() * COLS.length)];
      col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(col, 3));
    g.setAttribute("phase",    new THREE.BufferAttribute(ph, 1));
    const m = new THREE.PointsMaterial({
      size: 0.018, vertexColors: true, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const pos = geo.attributes.position.array as Float32Array;
    const ph  = geo.attributes.phase.array as Float32Array;
    for (let i = 0; i < 180; i++) {
      pos[i*3+1] += 0.003;
      pos[i*3]   += Math.sin(t * 0.5 + ph[i]) * 0.0008;
      if (pos[i*3+1] > 1.2) pos[i*3+1] = -1.0;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}
