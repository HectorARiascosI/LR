"use client";
/**
 * FlowerBouquet — Ramo de flores coreano neón translúcido
 * Reconstruido desde cero:
 * - Siempre visible (no desaparece)
 * - Centrado y grande en pantalla
 * - Flores bien formadas con pétalos reales (ShapeGeometry extruida)
 * - Tallos curvos con TubeGeometry
 * - Hojas laterales
 * - Lazo en la base
 * - Shader fresnel + glow por flor
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── SHADER PÉTALO FRESNEL ────────────────────────────────────────────────────
const PETAL_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
uniform float uTime;
uniform float uIdx;

void main(){
  vUv = uv;
  vec3 pos = position;
  // Ondulación suave
  pos.z += sin(uTime * 1.1 + uIdx * 0.9 + pos.x * 4.0) * 0.012;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vNormal  = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const PETAL_FRAG = `
precision highp float;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
uniform vec3  uColor;
uniform float uTime;
uniform float uIdx;

void main(){
  float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.2);
  float pulse   = 0.88 + sin(uTime * 1.4 + uIdx * 1.8) * 0.12;

  // Gradiente del pétalo: más claro en el centro
  float center = 1.0 - length(vUv - 0.5) * 1.6;
  center = clamp(center, 0.0, 1.0);

  vec3 col = uColor * pulse;
  col = mix(col, col * 1.6 + 0.1, center * 0.5);
  col += fresnel * uColor * 2.0;

  float alpha = 0.22 + fresnel * 0.6 + center * 0.25;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
}
`;

// ─── SHADER TALLO ─────────────────────────────────────────────────────────────
const STEM_VERT = `
varying float vT;
uniform float uTime;
void main(){
  vT = uv.y;
  vec3 pos = position;
  pos.x += sin(uTime * 0.5 + pos.y * 3.0) * 0.008;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
const STEM_FRAG = `
precision highp float;
varying float vT;
uniform vec3  uColor;
uniform float uTime;
void main(){
  float g = 0.7 + sin(uTime * 0.9 + vT * 4.0) * 0.15;
  gl_FragColor = vec4(uColor * g, 0.9);
}
`;

// ─── SHADER HOJA ─────────────────────────────────────────────────────────────
const LEAF_FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec3  uColor;
uniform float uTime;
void main(){
  vec2 uv = vUv * 2.0 - 1.0;
  float leaf = 1.0 - length(vec2(uv.x * 0.7, uv.y));
  if(leaf < 0.0) discard;
  float vein = smoothstep(0.03, 0.0, abs(uv.x)) * 0.5;
  float alpha = smoothstep(0.0, 0.25, leaf) * 0.75;
  gl_FragColor = vec4(uColor + vein * 0.2, alpha);
}
`;
const LEAF_VERT = `
varying vec2 vUv;
uniform float uTime;
uniform float uIdx;
void main(){
  vUv = uv;
  vec3 pos = position;
  pos.z += sin(uTime * 0.7 + uIdx) * 0.015;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// ─── PÉTALO ───────────────────────────────────────────────────────────────────
function Petal({ color, idx, angle, radius }: {
  color: THREE.Color; idx: number; angle: number; radius: number;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(-radius * 0.4, radius * 0.3, -radius * 0.35, radius * 0.9, 0, radius);
    s.bezierCurveTo(radius * 0.35, radius * 0.9, radius * 0.4, radius * 0.3, 0, 0);
    return s;
  }, [radius]);

  const geo = useMemo(() => new THREE.ShapeGeometry(shape, 8), [shape]);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: PETAL_VERT,
    fragmentShader: PETAL_FRAG,
    uniforms: {
      uColor: { value: color },
      uTime:  { value: 0 },
      uIdx:   { value: idx },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color, idx]);

  useFrame(({ clock }) => { mat.uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh
      geometry={geo}
      material={mat}
      rotation={[0.25, angle, 0]}
      position={[
        Math.cos(angle) * radius * 0.15,
        Math.sin(angle) * radius * 0.08,
        0,
      ]}
    />
  );
}

// ─── FLOR ─────────────────────────────────────────────────────────────────────
function Flower({ pos, color, petalCount, petalR, scale, rotOffset }: {
  pos: [number, number, number];
  color: THREE.Color;
  petalCount: number;
  petalR: number;
  scale: number;
  rotOffset: number;
}) {
  const ref = useRef<THREE.Group>(null);

  const stemMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STEM_VERT,
    fragmentShader: STEM_FRAG,
    uniforms: { uColor: { value: color }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color]);

  const centerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#fff8e0"),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  }), [color]);

  useFrame(({ clock }) => {
    stemMat.uniforms.uTime.value = clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.35 + rotOffset) * 0.04;
    }
  });

  return (
    <group ref={ref} position={pos} scale={[scale, scale, scale]}>
      {/* Glow de fondo */}
      <mesh>
        <circleGeometry args={[petalR * 1.8, 16]} />
        <primitive object={glowMat} />
      </mesh>
      {/* Pétalos */}
      {Array.from({ length: petalCount }, (_, i) => (
        <Petal
          key={i}
          color={color}
          idx={i + rotOffset * 10}
          angle={(i / petalCount) * Math.PI * 2 + rotOffset}
          radius={petalR}
        />
      ))}
      {/* Centro */}
      <mesh material={centerMat}>
        <circleGeometry args={[petalR * 0.22, 16]} />
      </mesh>
      {/* Pistilo */}
      <mesh material={centerMat} position={[0, 0, 0.02]}>
        <circleGeometry args={[petalR * 0.1, 8]} />
      </mesh>
    </group>
  );
}

// ─── HOJA ─────────────────────────────────────────────────────────────────────
function Leaf({ pos, rot, color, idx }: {
  pos: [number, number, number];
  rot: [number, number, number];
  color: THREE.Color;
  idx: number;
}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: LEAF_VERT,
    fragmentShader: LEAF_FRAG,
    uniforms: {
      uColor: { value: color },
      uTime:  { value: 0 },
      uIdx:   { value: idx },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color, idx]);

  useFrame(({ clock }) => { mat.uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh
      material={mat}
      position={pos}
      rotation={rot}
      scale={[0.22, 0.38, 1]}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

// ─── RAMO COMPLETO ────────────────────────────────────────────────────────────
export default function FlowerBouquet() {
  const groupRef = useRef<THREE.Group>(null);

  // Flores del ramo — bien distribuidas, centradas, tamaños variados
  const FLOWERS = useMemo(() => [
    // Flor central principal — grande
    { pos: [0,    0.55, 0]    as [number,number,number], color: new THREE.Color("#ff4da6"), petals: 8, r: 0.38, scale: 1.0,  rot: 0    },
    // Flores secundarias alrededor
    { pos: [-0.42, 0.28, 0.05] as [number,number,number], color: new THREE.Color("#c44dff"), petals: 7, r: 0.30, scale: 0.88, rot: 0.8  },
    { pos: [0.42,  0.32, 0.05] as [number,number,number], color: new THREE.Color("#4dddff"), petals: 6, r: 0.28, scale: 0.85, rot: 1.6  },
    { pos: [-0.22, 0.72, 0.08] as [number,number,number], color: new THREE.Color("#ff8c4d"), petals: 7, r: 0.26, scale: 0.80, rot: 2.4  },
    { pos: [0.25,  0.68, 0.08] as [number,number,number], color: new THREE.Color("#ff4d80"), petals: 6, r: 0.24, scale: 0.78, rot: 3.2  },
    // Flores pequeñas de relleno
    { pos: [-0.58, 0.52, 0.1]  as [number,number,number], color: new THREE.Color("#d4b8ff"), petals: 5, r: 0.20, scale: 0.70, rot: 0.4  },
    { pos: [0.55,  0.55, 0.1]  as [number,number,number], color: new THREE.Color("#ffb84d"), petals: 5, r: 0.18, scale: 0.68, rot: 1.2  },
    { pos: [0.08,  0.90, 0.12] as [number,number,number], color: new THREE.Color("#ff6eb4"), petals: 6, r: 0.22, scale: 0.72, rot: 2.0  },
    { pos: [-0.35, 0.88, 0.12] as [number,number,number], color: new THREE.Color("#4dff9d"), petals: 5, r: 0.18, scale: 0.65, rot: 2.8  },
    { pos: [0.38,  0.88, 0.12] as [number,number,number], color: new THREE.Color("#ff4d4d"), petals: 5, r: 0.17, scale: 0.62, rot: 3.6  },
  ], []);

  const LEAVES = useMemo(() => [
    { pos: [-0.55, 0.05, 0.0] as [number,number,number], rot: [0, 0.3, -0.6] as [number,number,number], color: new THREE.Color("#2aaa44"), idx: 0 },
    { pos: [0.52,  0.08, 0.0] as [number,number,number], rot: [0, -0.3, 0.6] as [number,number,number], color: new THREE.Color("#22cc44"), idx: 1 },
    { pos: [-0.38, 0.22, 0.0] as [number,number,number], rot: [0, 0.2, -0.4] as [number,number,number], color: new THREE.Color("#2aaa44"), idx: 2 },
    { pos: [0.35,  0.18, 0.0] as [number,number,number], rot: [0, -0.2, 0.4] as [number,number,number], color: new THREE.Color("#22cc44"), idx: 3 },
    { pos: [-0.62, 0.38, 0.0] as [number,number,number], rot: [0, 0.4, -0.8] as [number,number,number], color: new THREE.Color("#1a9933"), idx: 4 },
    { pos: [0.60,  0.35, 0.0] as [number,number,number], rot: [0, -0.4, 0.8] as [number,number,number], color: new THREE.Color("#1a9933"), idx: 5 },
  ], []);

  // Tallos — uno por flor principal
  const stemMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STEM_VERT,
    fragmentShader: STEM_FRAG,
    uniforms: { uColor: { value: new THREE.Color("#22aa44") }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  // Lazo en la base
  const ribbonMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ff4da6"),
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  useFrame(({ clock }) => {
    stemMat.uniforms.uTime.value = clock.elapsedTime;
    if (groupRef.current) {
      // Flotación suave
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.06;
      // Rotación muy lenta
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Tallos */}
      {FLOWERS.slice(0, 5).map((f, i) => (
        <mesh key={i} material={stemMat}
          position={[f.pos[0] * 0.5, f.pos[1] * 0.5 - 0.4, f.pos[2]]}
          rotation={[0, 0, f.pos[0] * 0.4]}
        >
          <cylinderGeometry args={[0.008, 0.014, f.pos[1] + 0.5, 5]} />
        </mesh>
      ))}

      {/* Hojas */}
      {LEAVES.map((l, i) => (
        <Leaf key={i} pos={l.pos} rot={l.rot} color={l.color} idx={l.idx} />
      ))}

      {/* Flores */}
      {FLOWERS.map((f, i) => (
        <Flower
          key={i}
          pos={f.pos}
          color={f.color}
          petalCount={f.petals}
          petalR={f.r}
          scale={f.scale}
          rotOffset={f.rot}
        />
      ))}

      {/* Lazo base */}
      <mesh material={ribbonMat} position={[0, -0.38, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.12, 0.025, 6, 12, Math.PI]} />
      </mesh>
      <mesh material={ribbonMat} position={[0, -0.38, 0]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.12, 0.025, 6, 12, Math.PI]} />
      </mesh>
      {/* Nudo */}
      <mesh position={[0, -0.38, 0]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshBasicMaterial color="#ff4da6" transparent opacity={0.8}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Partículas de brillo alrededor */}
      <GlowParticles />
    </group>
  );
}

// ─── PARTÍCULAS DE BRILLO ─────────────────────────────────────────────────────
function GlowParticles() {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const n = 200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const ph  = new Float32Array(n);
    const COLORS = [
      [1.0, 0.3, 0.65],
      [0.77, 0.3, 1.0],
      [0.3, 0.87, 1.0],
      [1.0, 0.55, 0.3],
      [1.0, 0.9, 0.4],
    ];
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.7;
      pos[i*3]   = Math.cos(theta) * r;
      pos[i*3+1] = -0.4 + Math.random() * 1.6;
      pos[i*3+2] = Math.sin(theta) * r * 0.4;
      ph[i] = Math.random() * Math.PI * 2;
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(col, 3));
    g.setAttribute("phase",    new THREE.BufferAttribute(ph, 1));
    const m = new THREE.PointsMaterial({
      size: 0.022, vertexColors: true, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const pos = geo.attributes.position.array as Float32Array;
    const ph  = geo.attributes.phase.array as Float32Array;
    for (let i = 0; i < 200; i++) {
      pos[i*3+1] += 0.004;
      pos[i*3]   += Math.sin(t * 0.6 + ph[i]) * 0.001;
      if (pos[i*3+1] > 1.2) pos[i*3+1] = -0.4;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}
