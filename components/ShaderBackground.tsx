"use client";
/**
 * ShaderBackground — nebulosa procedural GLSL animada
 * Fullscreen quad con fragment shader custom: noise volumétrico,
 * gradientes dinámicos, vignette integrada.
 */
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2  uResolution;

// Hash & noise
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2  shift = vec2(100.0);
  mat2  rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p  = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.06;

  // Nebulosa base
  vec2 q = vec2(fbm(uv + t * 0.3), fbm(uv + vec2(1.0)));
  vec2 r = vec2(
    fbm(uv + 1.0 * q + vec2(1.7, 9.2) + t * 0.15),
    fbm(uv + 1.0 * q + vec2(8.3, 2.8) + t * 0.126)
  );
  float f = fbm(uv + r);

  // Paleta: negro profundo → lila → rosa → dorado
  vec3 col = mix(
    vec3(0.01, 0.005, 0.04),
    vec3(0.28, 0.12, 0.55),
    clamp(f * f * 4.0, 0.0, 1.0)
  );
  col = mix(col, vec3(0.55, 0.18, 0.38), clamp(length(q), 0.0, 1.0));
  col = mix(col, vec3(0.72, 0.52, 0.18), clamp(length(r.x), 0.0, 1.0));

  col *= f * 1.6 + 0.05;

  // Vignette
  vec2 vig = vUv * 2.0 - 1.0;
  col *= 1.0 - dot(vig, vig) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderBackground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    },
    depthWrite: false,
    depthTest: false,
  }), [size]);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} />
    </mesh>
  );
}
