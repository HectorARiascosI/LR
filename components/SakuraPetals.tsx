"use client";
/**
 * SakuraPetals — 800 pétalos instanced con shader custom
 * Física: caída + balanceo + rotación por partícula
 * Shader: pétalo translúcido con venas y glow suave
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;

const VERT = `
attribute float aPhase;
attribute float aSpeed;
attribute float aSwing;
attribute float aRot;
attribute float aSize;

uniform float uTime;

varying float vAlpha;
varying vec2  vUv;

void main(){
  vUv = uv;
  vec3 pos = position;

  // Caída
  float t = mod(uTime * aSpeed + aPhase * 40.0, 40.0);
  pos.y -= t * 0.18;
  // Balanceo lateral
  pos.x += sin(uTime * aSwing + aPhase * 6.28) * 0.4;
  pos.x += cos(uTime * aSwing * 0.7 + aPhase) * 0.2;
  // Profundidad variable
  pos.z += sin(aPhase * 3.14) * 1.5;

  // Rotación del pétalo (billboard parcial)
  float angle = uTime * aRot + aPhase * 6.28;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  pos.xy = rot * pos.xy * aSize;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  vAlpha = 0.55 + sin(uTime * 0.8 + aPhase * 3.14) * 0.2;
}
`;

const FRAG = `
precision highp float;
varying float vAlpha;
varying vec2  vUv;
uniform vec3  uColor;

void main(){
  // Forma de pétalo: elipse con punta
  vec2 uv = vUv * 2.0 - 1.0;
  float petal = 1.0 - length(vec2(uv.x, uv.y * 1.6 - 0.3 * uv.x * uv.x));
  if(petal < 0.0) discard;

  // Vena central
  float vein = smoothstep(0.04, 0.0, abs(uv.x)) * smoothstep(-0.2, 0.8, uv.y) * 0.4;

  float alpha = smoothstep(0.0, 0.3, petal) * vAlpha;
  vec3 col = uColor + vein * 0.3;

  gl_FragColor = vec4(col, alpha * 0.82);
}
`;

export default function SakuraPetals() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  // Geometría base del pétalo
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, 1, 1);
    const count = COUNT;
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const swing = new Float32Array(count);
    const rot   = new Float32Array(count);
    const size  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      phase[i] = Math.random();
      speed[i] = 0.4 + Math.random() * 0.6;
      swing[i] = 0.3 + Math.random() * 0.5;
      rot[i]   = (Math.random() - 0.5) * 1.5;
      size[i]  = 0.06 + Math.random() * 0.08;
    }

    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aSwing", new THREE.BufferAttribute(swing, 1));
    g.setAttribute("aRot",   new THREE.BufferAttribute(rot, 1));
    g.setAttribute("aSize",  new THREE.BufferAttribute(size, 1));
    return g;
  }, []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime:  { value: 0 },
      uColor: { value: new THREE.Color("#ffb7c5") },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }), []);

  // Posiciones iniciales distribuidas en el espacio
  const initPositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < COUNT; i++) {
      pos.push([
        (Math.random() - 0.5) * 14,
        Math.random() * 40 - 5,
        (Math.random() - 0.5) * 6,
      ]);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    mat.uniforms.uTime.value = clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      dummy.position.set(...initPositions[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, COUNT]}
      frustumCulled={false}
    />
  );
}
