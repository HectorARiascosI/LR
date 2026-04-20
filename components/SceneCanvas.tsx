"use client";
/**
 * SceneCanvas — Canvas principal
 * ShaderBackground (nebulosa GLSL) + ParticleMorph (4000 partículas GPU)
 */
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import ShaderBackground from "./ShaderBackground";
import ParticleMorph from "./ParticleMorph";
import { Vector2 } from "three";

interface SceneCanvasProps {
  scrollProgress: React.RefObject<number>;
}

export default function SceneCanvas({ scrollProgress }: SceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 100 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={[1, 1.5]}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      <ShaderBackground />
      <ParticleMorph scrollProgress={scrollProgress} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.05}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.7}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette offset={0.2} darkness={0.65} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
