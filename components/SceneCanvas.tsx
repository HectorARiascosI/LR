"use client";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Vector2 } from "three";
import KoreanSkyShader from "./KoreanSkyShader";
import SakuraPetals from "./SakuraPetals";
import ParticleMorph from "./ParticleMorph";

interface SceneCanvasProps {
  scrollProgress: React.RefObject<number>;
  section: number;
}

export default function SceneCanvas({ scrollProgress, section }: SceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      dpr={[1, 1.5]}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      {/* Cielo coreano procedural — cambia con la sección */}
      <KoreanSkyShader section={section} />

      {/* Pétalos de sakura cayendo */}
      <SakuraPetals />

      {/* Partículas morphing — siempre activas */}
      <ParticleMorph scrollProgress={scrollProgress} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.88}
          mipmapBlur
          radius={0.65}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.0005, 0.0005)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette offset={0.18} darkness={0.5} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
