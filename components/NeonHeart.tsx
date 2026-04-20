"use client";
/**
 * NeonHeart — Corazón neón 3D grande, girando suavemente
 * Partículas sutiles que no distraen de la lectura
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const HEART_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
uniform float uTime;
void main(){
  vec3 pos = position;
  float beat = 1.0 + sin(uTime * 1.8) * 0.03;
  pos *= beat;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vNormal  = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const HEART_FRAG = `
precision highp float;
varying vec3 vNormal;
varying vec3 vViewDir;
uniform float uTime;
void main(){
  float fr = pow(1.0 - abs(dot(vNormal, vViewDir)), 1.8);
  float pulse = 0.75 + sin(uTime * 1.8) * 0.25;
  vec3 inner = vec3(1.0, 0.12, 0.42) * pulse;
  vec3 edge  = vec3(1.0, 0.6, 0.82);
  vec3 col = mix(inner, edge, fr);
  float alpha = 0.3 + fr * 0.55;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
}`;

const PART_VERT = `
attribute vec3  aVelocity;
attribute float aLife;
attribute float aSize;
attribute vec3  aColor;
uniform float   uTime;
varying vec3    vColor;
varying float   vAlpha;
void main(){
  float t = mod(uTime * 0.28 + aLife, 1.0);
  vec3 pos = position + aVelocity * t * 3.5;
  pos.y -= t * t * 0.8;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * (1.0 / -mv.z) * (1.0 - t * 0.7);
  vColor = aColor;
  // Muy sutiles — no distraen
  vAlpha = (1.0 - smoothstep(0.5, 1.0, t)) * 0.45;
}`;

const PART_FRAG = `
precision highp float;
varying vec3  vColor;
varying float vAlpha;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if(d > 0.5) discard;
  float a = (1.0 - smoothstep(0.1, 0.5, d)) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}`;

function makeHeartShape(size: number): THREE.Shape {
  const s = new THREE.Shape();
  const k = size;
  s.moveTo(0, k * 0.25);
  s.bezierCurveTo(-k*0.05, k*0.25, -k*0.5, k*0.7, -k*0.5, k*0.35);
  s.bezierCurveTo(-k*0.5, k*0.05, -k*0.25, -k*0.15, 0, -k*0.5);
  s.bezierCurveTo(k*0.25, -k*0.15, k*0.5, k*0.05, k*0.5, k*0.35);
  s.bezierCurveTo(k*0.5, k*0.7, k*0.05, k*0.25, 0, k*0.25);
  return s;
}

function heartPoint(t: number, size: number): [number, number] {
  const k = size;
  const x = k * 16 * Math.pow(Math.sin(t), 3) * 0.062;
  const y = k * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * 0.062;
  return [x, y - k * 0.1];
}

export default function NeonHeart() {
  const groupRef = useRef<THREE.Group>(null);

  // Corazón más grande — size 1.4 en vez de 0.7
  const heartGeo = useMemo(() => {
    const shape = makeHeartShape(1.4);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.38,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 4,
      steps: 1,
    });
  }, []);

  const heartMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: HEART_VERT,
    fragmentShader: HEART_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ff1a5e"),
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  // Solo 200 partículas, muy sutiles
  const { partGeo, partMat } = useMemo(() => {
    const N = 200;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const life = new Float32Array(N);
    const size = new Float32Array(N);
    const col = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const [hx, hy] = heartPoint(t, 1.4);
      pos[i*3]   = hx + (Math.random()-0.5)*0.12;
      pos[i*3+1] = hy + (Math.random()-0.5)*0.12;
      pos[i*3+2] = (Math.random()-0.5)*0.38;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.6;
      vel[i*3]   = Math.cos(angle) * speed;
      vel[i*3+1] = Math.sin(angle) * speed * 0.5 + 0.15;
      vel[i*3+2] = (Math.random()-0.5) * speed * 0.3;

      life[i] = Math.random();
      size[i] = 30 + Math.random() * 40;

      // Solo tonos rosa/lila suaves
      const r = Math.random();
      if (r < 0.5) { col[i*3]=1.0; col[i*3+1]=0.4; col[i*3+2]=0.7; }
      else         { col[i*3]=0.8; col[i*3+1]=0.4; col[i*3+2]=1.0; }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position",  new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aVelocity", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("aLife",     new THREE.BufferAttribute(life, 1));
    g.setAttribute("aSize",     new THREE.BufferAttribute(size, 1));
    g.setAttribute("aColor",    new THREE.BufferAttribute(col, 3));

    const m = new THREE.ShaderMaterial({
      vertexShader: PART_VERT,
      fragmentShader: PART_FRAG,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { partGeo: g, partMat: m };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    heartMat.uniforms.uTime.value = t;
    partMat.uniforms.uTime.value  = t;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.4;
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.12;
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh geometry={heartGeo} material={glowMat} scale={[1.12, 1.12, 1.12]} />
      <mesh geometry={heartGeo} material={heartMat} position={[-0.7, -0.7, -0.19]} />
      <points geometry={partGeo} material={partMat} />
    </group>
  );
}
