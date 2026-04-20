"use client";
/**
 * ParticleMorph — 4000 partículas con shader custom GLSL
 * Morphing GPU entre 4 formas: esfera → corazón → espiral → anillo
 * Cada sección del scroll activa una forma diferente.
 * Vertex shader interpola posiciones en GPU — cero JS por frame.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 4000;

// ─── GENERADORES DE FORMA ─────────────────────────────────────────────────────
function spherePositions(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const phi   = Math.acos(1 - 2 * (i + 0.5) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 2.2 + (Math.random() - 0.5) * 0.3;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.cos(phi);
    pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return pos;
}

function heartPositions(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const noise = (Math.random() - 0.5) * 0.18;
    const x = 1.4 * 16 * Math.pow(Math.sin(t), 3) * 0.1;
    const y = 1.4 * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * 0.1;
    const z = (Math.random() - 0.5) * 0.6;
    pos[i*3]   = x + noise;
    pos[i*3+1] = y - 0.5 + noise;
    pos[i*3+2] = z;
  }
  return pos;
}

function spiralPositions(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t     = (i / n) * Math.PI * 12;
    const r     = 0.15 + (i / n) * 2.8;
    const noise = (Math.random() - 0.5) * 0.12;
    pos[i*3]   = Math.cos(t) * r + noise;
    pos[i*3+1] = (i / n) * 4.5 - 2.25 + noise;
    pos[i*3+2] = Math.sin(t) * r + noise;
  }
  return pos;
}

function ringPositions(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t     = (i / n) * Math.PI * 2;
    const rings = Math.floor(Math.random() * 3);
    const r     = 1.8 + rings * 0.55 + (Math.random() - 0.5) * 0.15;
    const noise = (Math.random() - 0.5) * 0.08;
    pos[i*3]   = Math.cos(t) * r + noise;
    pos[i*3+1] = (Math.random() - 0.5) * 0.25;
    pos[i*3+2] = Math.sin(t) * r + noise;
  }
  return pos;
}

// ─── SHADERS ──────────────────────────────────────────────────────────────────
const VERT = /* glsl */`
attribute vec3 aPositionA;
attribute vec3 aPositionB;
attribute float aRandom;
attribute vec3 aColor;

uniform float uMorph;    // 0→1 interpolación entre A y B
uniform float uTime;
uniform float uSize;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Ease in-out cúbico en GPU
  float t = uMorph;
  t = t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t+2.0, 3.0)/2.0;

  vec3 pos = mix(aPositionA, aPositionB, t);

  // Micro-movimiento orgánico por partícula
  float wave = sin(uTime * 0.8 + aRandom * 6.28) * 0.04;
  pos += normalize(pos) * wave;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  // Tamaño atenuado por distancia
  gl_PointSize = uSize * (1.0 / -mvPos.z) * (0.6 + aRandom * 0.8);

  vColor = aColor;
  vAlpha = 0.55 + aRandom * 0.45;
}
`;

const FRAG = /* glsl */`
precision highp float;
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Punto circular suave con glow
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float alpha = (1.0 - smoothstep(0.2, 0.5, d)) * vAlpha;
  // Glow core
  float glow = exp(-d * 8.0) * 0.6;

  gl_FragColor = vec4(vColor + glow, alpha);
}
`;

// ─── SHAPES CONFIG ────────────────────────────────────────────────────────────
// Qué forma mostrar en cada sección (0-9)
const SECTION_SHAPE = [0, 0, 1, 2, 1, 3, 2, 1, 3, 1];

export default function ParticleMorph({ scrollProgress }: { scrollProgress: React.RefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const morphRef  = useRef(0);
  const shapeRef  = useRef(0);

  const shapes = useMemo(() => [
    spherePositions(COUNT),
    heartPositions(COUNT),
    spiralPositions(COUNT),
    ringPositions(COUNT),
  ], []);

  // Colores por partícula — gradiente lila/rosa/dorado
  const colors = useMemo(() => {
    const col = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random();
      if (r < 0.4) {
        // lila
        col[i*3] = 0.65 + Math.random()*0.2; col[i*3+1] = 0.45 + Math.random()*0.2; col[i*3+2] = 1.0;
      } else if (r < 0.72) {
        // rosa
        col[i*3] = 1.0; col[i*3+1] = 0.55 + Math.random()*0.2; col[i*3+2] = 0.72 + Math.random()*0.2;
      } else {
        // dorado
        col[i*3] = 1.0; col[i*3+1] = 0.82 + Math.random()*0.15; col[i*3+2] = 0.3 + Math.random()*0.3;
      }
    }
    return col;
  }, []);

  const randoms = useMemo(() => {
    const r = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) r[i] = Math.random();
    return r;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("aPositionA", new THREE.BufferAttribute(shapes[0].slice(), 3));
    g.setAttribute("aPositionB", new THREE.BufferAttribute(shapes[1].slice(), 3));
    g.setAttribute("aRandom",    new THREE.BufferAttribute(randoms, 1));
    g.setAttribute("aColor",     new THREE.BufferAttribute(colors, 3));
    return g;
  }, [shapes, randoms, colors]);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uMorph: { value: 0 },
      uTime:  { value: 0 },
      uSize:  { value: 180 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    mat.uniforms.uTime.value = clock.elapsedTime;

    // Determinar sección actual
    const progress = scrollProgress.current ?? 0;
    const totalSections = SECTION_SHAPE.length;
    const sectionF = progress * (totalSections - 1);
    const sectionIdx = Math.min(Math.floor(sectionF), totalSections - 2);
    const localT = sectionF - sectionIdx;

    const shapeA = SECTION_SHAPE[sectionIdx];
    const shapeB = SECTION_SHAPE[Math.min(sectionIdx + 1, totalSections - 1)];

    // Si cambió la forma objetivo, actualizar buffers
    if (shapeRef.current !== shapeA * 10 + shapeB) {
      shapeRef.current = shapeA * 10 + shapeB;
      geo.setAttribute("aPositionA", new THREE.BufferAttribute(shapes[shapeA].slice(), 3));
      geo.setAttribute("aPositionB", new THREE.BufferAttribute(shapes[shapeB].slice(), 3));
      geo.attributes.aPositionA.needsUpdate = true;
      geo.attributes.aPositionB.needsUpdate = true;
      morphRef.current = localT;
    }

    // Suavizar morph
    morphRef.current += (localT - morphRef.current) * 0.04;
    mat.uniforms.uMorph.value = morphRef.current;

    // Rotación lenta
    pointsRef.current.rotation.y = clock.elapsedTime * 0.06;
    pointsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.04) * 0.15;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}
