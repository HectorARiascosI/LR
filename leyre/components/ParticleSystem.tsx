"use client";
/// <reference path="../types/jsx.d.ts" />
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateHeartPoints, generateRandomPoints } from "@/lib/heartGeometry";
import type { Phase } from "@/hooks/useAnimationPhase";

// Menos partículas, más calidad visual por shader
const PARTICLE_COUNT = 2000;

const HEART_PHASES: Phase[] = ["formation","heartbeat","letter_1","letter_2","letter_3","letter_4","final"];
const AWAKE_PHASES: Phase[] = ["awakening","origin"];

interface Props {
  phase: Phase;
  mouseRef: { current: { x: number; y: number } | null };
}

export default function ParticleSystem({ phase, mouseRef }: Props) {
  const meshRef = useRef<THREE.Points>(null);
  const progressRef = useRef(0);
  const timeRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Posiciones base pre-calculadas — nunca se recrean
  const { randomPos, heartPos, colors, sizes, seeds } = useMemo(() => {
    const rnd = generateRandomPoints(PARTICLE_COUNT, 10);
    const hrt = generateHeartPoints(PARTICLE_COUNT);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const szs  = new Float32Array(PARTICLE_COUNT);
    const sds  = new Float32Array(PARTICLE_COUNT); // semillas aleatorias por partícula

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = Math.random();
      const b = 0.7 + Math.random() * 0.3;
      if (r < 0.50) {
        cols[i*3] = (0.55 + Math.random() * 0.25) * b;
        cols[i*3+1] = (0.30 + Math.random() * 0.25) * b;
        cols[i*3+2] = (0.85 + Math.random() * 0.15) * b;
      } else if (r < 0.72) {
        cols[i*3] = (0.88 + Math.random() * 0.12) * b;
        cols[i*3+1] = (0.50 + Math.random() * 0.25) * b;
        cols[i*3+2] = (0.68 + Math.random() * 0.22) * b;
      } else if (r < 0.88) {
        cols[i*3] = (0.78 + Math.random() * 0.22) * b;
        cols[i*3+1] = (0.80 + Math.random() * 0.20) * b;
        cols[i*3+2] = (0.90 + Math.random() * 0.10) * b;
      } else {
        cols[i*3] = 0.95; cols[i*3+1] = 0.82; cols[i*3+2] = 0.45;
      }
      const sr = Math.random();
      szs[i] = sr < 0.65 ? 0.016 + Math.random() * 0.018
             : sr < 0.90 ? 0.036 + Math.random() * 0.026
             :              0.065 + Math.random() * 0.035;
      sds[i] = Math.random() * 100;
    }
    return { randomPos: rnd, heartPos: hrt, colors: cols, sizes: szs, seeds: sds };
  }, []);

  // Posición interpolada — actualizada en CPU solo para el lerp de forma
  const currentPos = useMemo(() => new Float32Array(randomPos), [randomPos]);

  // Shader que hace el movimiento en GPU — sin loops JS por partícula
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uProgress: { value: 0 },
      uMode:     { value: 0 }, // 0=void, 1=awake, 2=formed
      uMouse:    { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      attribute float seed;
      uniform float uTime;
      uniform float uProgress;
      uniform int   uMode;
      uniform vec2  uMouse;
      varying vec3  vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vec3 pos = position;

        if (uMode == 2) {
          // Formado: latido suave en GPU
          float beat = sin(uTime * 1.15 * 6.2832) * 0.05;
          pos *= (1.0 + beat);
          pos.z += sin(uTime * 0.4 + seed * 0.02) * 0.01;
        } else if (uMode == 1) {
          // Awake: deriva orgánica
          pos.x += sin(uTime * 0.22 + seed * 0.4) * 0.14;
          pos.y += cos(uTime * 0.16 + seed * 0.6) * 0.11;
          pos.z += sin(uTime * 0.10 + seed * 0.3) * 0.07;
          // Repulsión del cursor
          vec2 toMouse = pos.xy - uMouse * vec2(5.0, 3.5);
          float d = length(toMouse);
          if (d < 2.0) {
            float repel = (2.0 - d) / 2.0 * 0.08;
            pos.xy += normalize(toMouse) * repel;
          }
        } else {
          // Void: nebulosa flotante
          pos.x += sin(uTime * 0.10 + seed * 0.45) * 0.16;
          pos.y += cos(uTime * 0.08 + seed * 0.28) * 0.13;
          pos.z += sin(uTime * 0.06 + seed * 0.62) * 0.08;
        }

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        float dist = length(mvPos.xyz);
        vAlpha = clamp(1.0 - dist * 0.05, 0.2, 1.0);

        float beatSize = uMode == 2 ? (1.0 + sin(uTime * 1.15 * 6.2832) * 0.2) : 1.0;
        gl_PointSize = size * beatSize * (340.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3  vColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = 1.0 - smoothstep(0.0, 0.22, d);
        float halo = 1.0 - smoothstep(0.12, 0.5, d);
        float alpha = (core * 0.95 + halo * 0.3) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  }), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(randomPos), 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(new Float32Array(sizes), 1));
    geo.setAttribute("seed",     new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [randomPos, colors, sizes, seeds]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

    const p = phaseRef.current;
    const isHeart = HEART_PHASES.includes(p);
    const isAwake = AWAKE_PHASES.includes(p);

    // Lerp de progreso — solo actualiza posiciones base en CPU
    const targetP = isHeart ? 1 : 0;
    const lerpSpeed = p === "formation" ? 0.014 : 0.007;
    progressRef.current += (targetP - progressRef.current) * lerpSpeed;

    // Interpolación lineal simple entre random y heart — sin easing en CPU
    const prog = progressRef.current;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      pos[i] = randomPos[i] + (heartPos[i] - randomPos[i]) * prog;
    }
    geometry.attributes.position.needsUpdate = true;

    // Actualizar uniforms del shader
    const u = material.uniforms;
    u.uTime.value = t;
    u.uProgress.value = prog;
    u.uMode.value = prog > 0.78 ? 2 : isAwake ? 1 : 0;
    const mouse = mouseRef.current;
    if (mouse) {
      u.uMouse.value.set(mouse.x, mouse.y);
    }

    // Rotación del sistema
    if (prog > 0.78) {
      meshRef.current.rotation.y = Math.sin(t * 0.05) * 0.14;
    } else {
      meshRef.current.rotation.y += dt * 0.02;
    }
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — R3F registers <points> at runtime
  return <points ref={meshRef} geometry={geometry} material={material} />;
}
