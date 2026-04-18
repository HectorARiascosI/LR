"use client";
import { useRef, Suspense } from "react";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import ParticleSystem from "./ParticleSystem";
import type { Phase } from "@/hooks/useAnimationPhase";

/* Luz ambiental animada que pulsa con el latido */
function PulsingLight({ phase }: { phase: Phase }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  const isBeating = phase === "heartbeat" || phase === "letter_1" || phase === "letter_2"
    || phase === "letter_3" || phase === "letter_4" || phase === "final";

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    if (isBeating) {
      // Pulso de latido: 72bpm ≈ 1.2Hz
      const beat = Math.sin(t.current * 1.2 * Math.PI * 2);
      lightRef.current.intensity = 0.6 + beat * 0.35;
      lightRef.current.color.setHSL(0.78 + beat * 0.04, 0.7, 0.6);
    } else {
      lightRef.current.intensity = 0.3 + Math.sin(t.current * 0.3) * 0.1;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 3]}
      intensity={0.4}
      color="#b48ee8"
      distance={12}
    />
  );
}

/* Segundo punto de luz — acento rosa */
function AccentLight({ phase }: { phase: Phase }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta;
    // Orbita lentamente
    lightRef.current.position.x = Math.sin(t.current * 0.2) * 4;
    lightRef.current.position.y = Math.cos(t.current * 0.15) * 3;
    lightRef.current.intensity = 0.2 + Math.sin(t.current * 0.4) * 0.1;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[3, 2, 2]}
      intensity={0.25}
      color="#f0a8c8"
      distance={10}
    />
  );
}

interface Props {
  phase: Phase;
}

export default function Scene3D({ phase }: Props) {
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }) as React.RefObject<{ x: number; y: number }>;

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    const mref = mouseRef as { current: { x: number; y: number } };
    mref.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    };
  };

  // Bloom más intenso en fases de corazón
  const bloomIntensity = (phase === "heartbeat" || phase === "final") ? 2.2
    : (phase === "letter_1" || phase === "letter_2" || phase === "letter_3" || phase === "letter_4") ? 1.6
    : 1.0;

  return (
    <div className="fixed inset-0 z-0" onMouseMove={handleMouseMove}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.05} color="#1a0a2e" />
          <PulsingLight phase={phase} />
          <AccentLight phase={phase} />

          <ParticleSystem phase={phase} mouseRef={mouseRef} />

          <EffectComposer>
            <Bloom
              intensity={bloomIntensity}
              luminanceThreshold={0.05}
              luminanceSmoothing={0.85}
              mipmapBlur
              radius={0.7}
            />
            <Vignette
              offset={0.3}
              darkness={0.85}
              eskil={false}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
