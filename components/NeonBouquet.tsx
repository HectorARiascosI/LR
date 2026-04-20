"use client";
/**
 * NeonBouquet — Ramo de flores neón translúcido
 * Pétalos: ShaderMaterial con fresnel + transmisión simulada
 * Stems: tubos con glow aditivo
 * Partículas de polen flotando alrededor
 * Cinemática: aparece en sección 0, rota suavemente, pétalos pulsan
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── SHADER PÉTALO — vidrio neón con fresnel ──────────────────────────────────
const PETAL_VERT = /* glsl */`
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying float vFresnel;
uniform float uTime;
uniform float uPetalIdx;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Ondulación orgánica del pétalo
  float wave = sin(uTime * 1.2 + uPetalIdx * 1.1 + pos.x * 3.0) * 0.04;
  pos.z += wave;
  pos.y += sin(uTime * 0.9 + uPetalIdx * 0.7 + pos.y * 2.0) * 0.025;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vNormal   = normalize(normalMatrix * normal);
  vViewDir  = normalize(-mvPos.xyz);
  vFresnel  = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);

  gl_Position = projectionMatrix * mvPos;
}
`;

const PETAL_FRAG = /* glsl */`
precision highp float;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying float vFresnel;
uniform vec3  uColor;
uniform float uTime;
uniform float uPetalIdx;

void main() {
  // Base translúcida
  float alpha = 0.18 + vFresnel * 0.55;

  // Venas del pétalo
  float vein = abs(sin(vUv.x * 8.0 + uPetalIdx)) * 0.12;
  vein += abs(sin(vUv.y * 12.0)) * 0.08;

  // Pulso de brillo
  float pulse = 0.85 + sin(uTime * 1.5 + uPetalIdx * 2.1) * 0.15;

  vec3 col = uColor * pulse;
  col += vein * uColor * 1.4;
  col += vFresnel * uColor * 1.8;

  // Borde brillante
  float edge = smoothstep(0.35, 0.5, length(vUv - 0.5));
  col += edge * uColor * 0.6;
  alpha += edge * 0.25;

  gl_FragColor = vec4(col, alpha);
}
`;

// ─── SHADER STEM — tubo con glow ─────────────────────────────────────────────
const STEM_VERT = /* glsl */`
varying float vY;
uniform float uTime;
void main() {
  vY = position.y;
  vec3 pos = position;
  pos.x += sin(uTime * 0.6 + pos.y * 2.0) * 0.015;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const STEM_FRAG = /* glsl */`
precision highp float;
varying float vY;
uniform vec3 uColor;
uniform float uTime;
void main() {
  float glow = 0.6 + sin(uTime * 1.1 + vY * 3.0) * 0.2;
  gl_FragColor = vec4(uColor * glow, 0.85);
}
`;

// ─── PÉTALO INDIVIDUAL ────────────────────────────────────────────────────────
function Petal({
  color, idx, rotY, offsetX, offsetY, scale = 1,
}: {
  color: THREE.Color; idx: number; rotY: number;
  offsetX: number; offsetY: number; scale?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    // Forma de pétalo con ShapeGeometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.12, 0.1, -0.18, 0.35, 0, 0.55);
    shape.bezierCurveTo(0.18, 0.35, 0.12, 0.1, 0, 0);
    return new THREE.ShapeGeometry(shape, 12);
  }, []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: PETAL_VERT,
    fragmentShader: PETAL_FRAG,
    uniforms: {
      uColor:    { value: color },
      uTime:     { value: 0 },
      uPetalIdx: { value: idx },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color, idx]);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh
      ref={ref}
      geometry={geo}
      material={mat}
      position={[offsetX, offsetY, 0]}
      rotation={[0.3, rotY, 0]}
      scale={[scale, scale, scale]}
    />
  );
}

// ─── FLOR COMPLETA ────────────────────────────────────────────────────────────
function Flower({
  position, color, petalCount = 6, scale = 1, rotOffset = 0,
}: {
  position: [number, number, number];
  color: THREE.Color;
  petalCount?: number;
  scale?: number;
  rotOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const stemMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STEM_VERT,
    fragmentShader: STEM_FRAG,
    uniforms: {
      uColor: { value: color },
      uTime:  { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color]);

  const centerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [color]);

  useFrame(({ clock }) => {
    stemMat.uniforms.uTime.value = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.4 + rotOffset) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Stem */}
      <mesh material={stemMat} position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 1.0, 6]} />
      </mesh>

      {/* Pétalos */}
      {Array.from({ length: petalCount }, (_, i) => (
        <Petal
          key={i}
          color={color}
          idx={i + rotOffset * 10}
          rotY={(i / petalCount) * Math.PI * 2}
          offsetX={Math.cos((i / petalCount) * Math.PI * 2) * 0.08}
          offsetY={Math.sin((i / petalCount) * Math.PI * 2) * 0.04}
          scale={0.9 + Math.random() * 0.2}
        />
      ))}

      {/* Centro */}
      <mesh material={centerMat} position={[0, 0, 0.01]}>
        <circleGeometry args={[0.06, 16]} />
      </mesh>
      {/* Glow centro */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[0.14, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── PARTÍCULAS POLEN ─────────────────────────────────────────────────────────
function PollenParticles() {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const ph  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 1.2;
      pos[i*3]   = Math.cos(theta) * r;
      pos[i*3+1] = -0.8 + Math.random() * 2.2;
      pos[i*3+2] = Math.sin(theta) * r * 0.5;
      ph[i] = Math.random() * Math.PI * 2;

      const c = Math.random();
      if (c < 0.5) { col[i*3]=0.8; col[i*3+1]=0.5; col[i*3+2]=1.0; }
      else if (c < 0.8) { col[i*3]=1.0; col[i*3+1]=0.6; col[i*3+2]=0.8; }
      else { col[i*3]=1.0; col[i*3+1]=0.9; col[i*3+2]=0.4; }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(col, 3));
    g.setAttribute("phase",    new THREE.BufferAttribute(ph, 1));

    const m = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const pos = geo.attributes.position.array as Float32Array;
    const ph  = geo.attributes.phase.array as Float32Array;
    for (let i = 0; i < 300; i++) {
      pos[i*3+1] += 0.003;
      pos[i*3]   += Math.sin(t * 0.5 + ph[i]) * 0.001;
      if (pos[i*3+1] > 1.4) pos[i*3+1] = -0.8;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── RAMO COMPLETO ────────────────────────────────────────────────────────────
export default function NeonBouquet({ visible }: { visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  // Paleta neón: rosa, lila, cian, dorado
  const FLOWERS = useMemo(() => [
    { pos: [0,    0.2,  0]   as [number,number,number], color: new THREE.Color("#ff4da6"), petals: 7, scale: 1.0,  rot: 0    },
    { pos: [-0.5, 0.0,  0.1] as [number,number,number], color: new THREE.Color("#b44dff"), petals: 6, scale: 0.85, rot: 1.1  },
    { pos: [0.5,  0.05, 0.1] as [number,number,number], color: new THREE.Color("#4dffee"), petals: 5, scale: 0.8,  rot: 2.2  },
    { pos: [-0.3, 0.35, 0.2] as [number,number,number], color: new THREE.Color("#ff9d4d"), petals: 6, scale: 0.75, rot: 0.7  },
    { pos: [0.3,  0.3,  0.2] as [number,number,number], color: new THREE.Color("#ff4d80"), petals: 8, scale: 0.7,  rot: 1.8  },
    { pos: [0,   -0.1,  0.3] as [number,number,number], color: new THREE.Color("#d4b8ff"), petals: 5, scale: 0.65, rot: 3.0  },
    { pos: [-0.6, 0.2,  0.0] as [number,number,number], color: new THREE.Color("#ff6eb4"), petals: 6, scale: 0.6,  rot: 0.4  },
    { pos: [0.6,  0.15, 0.0] as [number,number,number], color: new THREE.Color("#a0ff4d"), petals: 5, scale: 0.55, rot: 2.6  },
  ], []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;

    // Fade in/out
    const target = visible ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * 0.03;
    groupRef.current.visible = opacityRef.current > 0.01;

    // Rotación cinemática suave
    groupRef.current.rotation.y = t * 0.18 + Math.sin(t * 0.3) * 0.2;
    groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.08;

    // Flotación
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {FLOWERS.map((f: { pos: [number,number,number]; color: THREE.Color; petals: number; scale: number; rot: number }, i: number) => (
        <Flower
          key={i}
          position={f.pos}
          color={f.color}
          petalCount={f.petals}
          scale={f.scale}
          rotOffset={f.rot}
        />
      ))}
      <PollenParticles />
    </group>
  );
}
