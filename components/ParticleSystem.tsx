"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateHeartPoints, generateRandomPoints, lerpPositions } from "@/lib/heartGeometry";
import type { Phase } from "@/hooks/useAnimationPhase";

const PARTICLE_COUNT = 5000;

// Fases donde el corazón debe estar formado
const HEART_PHASES: Phase[] = ["formation", "heartbeat", "letter_1", "letter_2", "letter_3", "letter_4", "final"];
// Fases donde las partículas están en modo "awakening" (reactivas al cursor)
const AWAKE_PHASES: Phase[] = ["awakening", "origin"];

interface Props {
  phase: Phase;
  mouseRef: { current: { x: number; y: number } };
}

export default function ParticleSystem({ phase, mouseRef }: Props) {
  const meshRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.Material>>(null);
  const progressRef = useRef(0);
  const timeRef = useRef(0);

  const { randomPositions, heartPositions, currentPositions, colors, sizes } = useMemo(() => {
    const random = generateRandomPoints(PARTICLE_COUNT, 12);
    const heart  = generateHeartPoints(PARTICLE_COUNT);
    const current = new Float32Array(random);

    // Colores: lila dominante, rosa acento, plata highlight
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    // Tamaños variables para profundidad
    const szs  = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = Math.random();
      const brightness = 0.7 + Math.random() * 0.3;

      if (r < 0.55) {
        // Lila — dominante
        cols[i*3]   = (0.55 + Math.random() * 0.25) * brightness;
        cols[i*3+1] = (0.30 + Math.random() * 0.25) * brightness;
        cols[i*3+2] = (0.85 + Math.random() * 0.15) * brightness;
      } else if (r < 0.78) {
        // Rosa suave
        cols[i*3]   = (0.88 + Math.random() * 0.12) * brightness;
        cols[i*3+1] = (0.50 + Math.random() * 0.25) * brightness;
        cols[i*3+2] = (0.68 + Math.random() * 0.22) * brightness;
      } else if (r < 0.92) {
        // Plata / blanco frío
        cols[i*3]   = (0.78 + Math.random() * 0.22) * brightness;
        cols[i*3+1] = (0.80 + Math.random() * 0.20) * brightness;
        cols[i*3+2] = (0.90 + Math.random() * 0.10) * brightness;
      } else {
        // Lila brillante — highlight
        cols[i*3]   = 0.85 + Math.random() * 0.15;
        cols[i*3+1] = 0.65 + Math.random() * 0.20;
        cols[i*3+2] = 1.0;
      }

      // Tamaños: mayoría pequeños, algunos medianos, pocos grandes
      const sizeRoll = Math.random();
      if (sizeRoll < 0.65)      szs[i] = 0.018 + Math.random() * 0.022; // pequeños
      else if (sizeRoll < 0.90) szs[i] = 0.042 + Math.random() * 0.030; // medianos
      else                       szs[i] = 0.075 + Math.random() * 0.045; // grandes (glow)
    }

    return { randomPositions: random, heartPositions: heart, currentPositions: current, colors: cols, sizes: szs };
  }, []);

  const velocities = useMemo(() => {
    const v = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) v[i] = (Math.random() - 0.5) * 0.001;
    return v;
  }, []);

  useFrame((_state: unknown, delta: number) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const isHeart  = HEART_PHASES.includes(phase);
    const isAwake  = AWAKE_PHASES.includes(phase);
    const targetProgress = isHeart ? 1 : 0;

    // Velocidad de convergencia: más rápida en formation
    const lerpSpeed = phase === "formation" ? 0.018 : 0.010;
    progressRef.current += (targetProgress - progressRef.current) * lerpSpeed;

    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const sz  = geo.attributes.size?.array as Float32Array | undefined;

    lerpPositions(randomPositions, heartPositions, progressRef.current, currentPositions);

    const mouse   = mouseRef.current ?? { x: 0, y: 0 };
    const isFormed = progressRef.current > 0.82;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i*3, iy = i*3+1, iz = i*3+2;
      const baseSize = sizes[i];

      if (isFormed) {
        // Latido sincronizado
        const beatFreq  = 1.15;
        const beatAmp   = 0.032 + (baseSize > 0.06 ? 0.015 : 0);
        const beatScale = 1 + Math.sin(t * beatFreq * Math.PI * 2) * beatAmp;
        // Partículas grandes pulsan más
        const orbitAmp  = baseSize > 0.06 ? 0.025 : 0.010;

        pos[ix] = currentPositions[ix] * beatScale;
        pos[iy] = currentPositions[iy] * beatScale;
        pos[iz] = currentPositions[iz] + Math.sin(t * 0.4 + i * 0.02) * orbitAmp;

        // Tamaño pulsa con el latido
        if (sz) sz[i] = baseSize * (1 + Math.sin(t * beatFreq * Math.PI * 2) * 0.25);

      } else if (isAwake) {
        // Reacción al cursor con campo de fuerza
        const dx = pos[ix] - mouse.x * 6;
        const dy = pos[iy] - mouse.y * 4;
        const distSq = dx*dx + dy*dy;
        const dist   = Math.sqrt(distSq);
        const repelRadius = 2.2;
        const repel  = dist < repelRadius ? (repelRadius - dist) / repelRadius * 0.004 : 0;

        velocities[ix] += (Math.random() - 0.5) * 0.0004 + (dx / (dist + 0.01)) * repel;
        velocities[iy] += (Math.random() - 0.5) * 0.0004 + (dy / (dist + 0.01)) * repel;
        velocities[iz] += (Math.random() - 0.5) * 0.0003;

        velocities[ix] *= 0.96;
        velocities[iy] *= 0.96;
        velocities[iz] *= 0.96;

        pos[ix] = currentPositions[ix] + Math.sin(t * 0.25 + i * 0.4) * 0.15 + velocities[ix] * 18;
        pos[iy] = currentPositions[iy] + Math.cos(t * 0.18 + i * 0.6) * 0.12 + velocities[iy] * 18;
        pos[iz] = currentPositions[iz] + Math.sin(t * 0.12 + i * 0.3) * 0.08;

        if (sz) sz[i] = baseSize * (1 + Math.sin(t * 2 + i) * 0.15);

      } else {
        // Void: nebulosa flotante
        const drift = 0.18;
        pos[ix] = currentPositions[ix] + Math.sin(t * 0.12 + i * 0.45) * drift;
        pos[iy] = currentPositions[iy] + Math.cos(t * 0.09 + i * 0.28) * drift * 0.8;
        pos[iz] = currentPositions[iz] + Math.sin(t * 0.07 + i * 0.62) * drift * 0.6;

        if (sz) sz[i] = baseSize * (0.9 + Math.sin(t * 0.5 + i * 0.1) * 0.1);
      }
    }

    geo.attributes.position.needsUpdate = true;
    if (sz && geo.attributes.size) geo.attributes.size.needsUpdate = true;

    // Rotación del sistema
    if (isFormed) {
      meshRef.current.rotation.y = Math.sin(t * 0.06) * 0.18;
      meshRef.current.rotation.x = Math.sin(t * 0.04) * 0.04;
    } else {
      meshRef.current.rotation.y += delta * 0.025;
      meshRef.current.rotation.x  = Math.sin(t * 0.05) * 0.06;
    }
  });

  // Shader material personalizado para tamaños variables
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Partículas más lejanas son más pequeñas
          float dist = length(mvPosition.xyz);
          vAlpha = clamp(1.0 - dist * 0.06, 0.3, 1.0);
          gl_PointSize = size * (380.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // Punto circular con glow suave
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          // Core brillante + halo suave
          float core = 1.0 - smoothstep(0.0, 0.25, dist);
          float halo = 1.0 - smoothstep(0.15, 0.5, dist);
          float alpha = (core * 0.9 + halo * 0.4) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(randomPositions), 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(new Float32Array(sizes), 1));
    return geo;
  }, [randomPositions, colors, sizes]);

  return <points ref={meshRef} geometry={geometry} material={shaderMaterial} />;
}
