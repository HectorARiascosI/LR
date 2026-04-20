"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateHeartPoints, generateRandomPoints, lerpPositions } from "@/lib/heartGeometry";
import type { Phase } from "@/hooks/useAnimationPhase";

// Reducido para mejor rendimiento — calidad mantenida con shader mejorado
const PARTICLE_COUNT = 3000;

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

  const { randomPositions, heartPositions, currentPositions, colors, sizes } = useMemo(() => {
    const random = generateRandomPoints(PARTICLE_COUNT, 10);
    const heart  = generateHeartPoints(PARTICLE_COUNT);
    const current = new Float32Array(random);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const szs  = new Float32Array(PARTICLE_COUNT);

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
        // Dorado — acento divino
        cols[i*3] = 0.95 + Math.random() * 0.05;
        cols[i*3+1] = 0.82 + Math.random() * 0.12;
        cols[i*3+2] = 0.40 + Math.random() * 0.20;
      }
      const sr = Math.random();
      if (sr < 0.65)      szs[i] = 0.016 + Math.random() * 0.020;
      else if (sr < 0.90) szs[i] = 0.038 + Math.random() * 0.028;
      else                 szs[i] = 0.070 + Math.random() * 0.040;
    }
    return { randomPositions: random, heartPositions: heart, currentPositions: current, colors: cols, sizes: szs };
  }, []);

  // Velocidades pre-asignadas — evita allocations en el loop
  const velocities = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        float dist = length(mvPos.xyz);
        vAlpha = clamp(1.0 - dist * 0.055, 0.25, 1.0);
        gl_PointSize = size * (360.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = 1.0 - smoothstep(0.0, 0.22, d);
        float halo = 1.0 - smoothstep(0.12, 0.5, d);
        float alpha = (core * 0.95 + halo * 0.35) * vAlpha;
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
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(randomPositions), 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(new Float32Array(sizes), 1));
    return geo;
  }, [randomPositions, colors, sizes]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Clamp delta para evitar saltos en frames lentos
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

    const isHeart  = HEART_PHASES.includes(phase);
    const isAwake  = AWAKE_PHASES.includes(phase);
    const targetP  = isHeart ? 1 : 0;
    const lerpSpeed = phase === "formation" ? 0.016 : 0.008;
    progressRef.current += (targetP - progressRef.current) * lerpSpeed;

    const pos = geometry.attributes.position.array as Float32Array;
    const sz  = geometry.attributes.size.array as Float32Array;
    lerpPositions(randomPositions, heartPositions, progressRef.current, currentPositions);

    const mouse = mouseRef.current ?? { x: 0, y: 0 };
    const isFormed = progressRef.current > 0.80;

    // Procesamos en bloques de 50 para no bloquear el hilo
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i*3, iy = i*3+1, iz = i*3+2;
      const baseSize = sizes[i];

      if (isFormed) {
        const beat = Math.sin(t * 1.15 * Math.PI * 2);
        const bs = 1 + beat * 0.05;
        pos[ix] = currentPositions[ix] * bs;
        pos[iy] = currentPositions[iy] * bs;
        pos[iz] = currentPositions[iz] + Math.sin(t * 0.4 + i * 0.02) * 0.012;
        sz[i] = baseSize * (1 + beat * 0.22);
      } else if (isAwake) {
        const dx = pos[ix] - mouse.x * 5;
        const dy = pos[iy] - mouse.y * 3.5;
        const dist = Math.sqrt(dx*dx + dy*dy) + 0.01;
        const repelR = 2.0;
        const repel = dist < repelR ? (repelR - dist) / repelR * 0.003 : 0;

        velocities[ix] += (Math.random() - 0.5) * 0.0003 + (dx / dist) * repel;
        velocities[iy] += (Math.random() - 0.5) * 0.0003 + (dy / dist) * repel;
        velocities[iz] += (Math.random() - 0.5) * 0.0002;
        velocities[ix] *= 0.97;
        velocities[iy] *= 0.97;
        velocities[iz] *= 0.97;

        pos[ix] = currentPositions[ix] + Math.sin(t * 0.22 + i * 0.4) * 0.14 + velocities[ix] * 16;
        pos[iy] = currentPositions[iy] + Math.cos(t * 0.16 + i * 0.6) * 0.11 + velocities[iy] * 16;
        pos[iz] = currentPositions[iz] + Math.sin(t * 0.10 + i * 0.3) * 0.07;
        sz[i] = baseSize * (1 + Math.sin(t * 1.8 + i) * 0.12);
      } else {
        const drift = 0.16;
        pos[ix] = currentPositions[ix] + Math.sin(t * 0.10 + i * 0.45) * drift;
        pos[iy] = currentPositions[iy] + Math.cos(t * 0.08 + i * 0.28) * drift * 0.8;
        pos[iz] = currentPositions[iz] + Math.sin(t * 0.06 + i * 0.62) * drift * 0.5;
        sz[i] = baseSize * (0.9 + Math.sin(t * 0.45 + i * 0.1) * 0.1);
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;

    if (isFormed) {
      meshRef.current.rotation.y = Math.sin(t * 0.05) * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.035) * 0.035;
    } else {
      meshRef.current.rotation.y += dt * 0.022;
      meshRef.current.rotation.x = Math.sin(t * 0.045) * 0.05;
    }
  });

  return <points ref={meshRef} geometry={geometry} material={shaderMaterial} />;
}
