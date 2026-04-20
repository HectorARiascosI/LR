"use client";
/**
 * NeonHeart — Corazón neón 3D girando que emite partículas a toda la pantalla
 * - Forma de corazón real con ExtrudeGeometry
 * - Shader fresnel + glow pulsante
 * - 600 partículas emitidas desde la superficie del corazón
 * - Rotación continua suave
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── SHADER CORAZÓN ───────────────────────────────────────────────────────────
const HEART_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
uniform float uTime;
void main(){
  vec3 pos = position;
  // Latido suave
  float beat = 1.0 + sin(uTime * 2.2) * 0.04;
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
  float pulse = 0.7 + sin(uTime * 2.2) * 0.3;

  // Rosa neón vibrante
  vec3 innerCol = vec3(1.0, 0.15, 0.45) * pulse;
  vec3 edgeCol  = vec3(1.0, 0.55, 0.85);

  vec3 col = mix(innerCol, edgeCol, fr);
  float alpha = 0.35 + fr * 0.6;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
}`;

// ─── SHADER PARTÍCULAS ────────────────────────────────────────────────────────
const PART_VERT = `
attribute vec3  aVelocity;
attribute float aLife;
attribute float aSize;
attribute vec3  aColor;
uniform float   uTime;
varying vec3    vColor;
varying float   vAlpha;

void main(){
  float t = mod(uTime * 0.5 + aLife, 1.0);
  vec3 pos = position + aVelocity * t * 4.0;
  // Gravedad suave
  pos.y -= t * t * 1.2;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * (1.0 / -mv.z) * (1.0 - t * 0.6);

  vColor = aColor;
  vAlpha = (1.0 - smoothstep(0.6, 1.0, t)) * 0.85;
}`;

const PART_FRAG = `
precision highp float;
varying vec3  vColor;
varying float vAlpha;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if(d > 0.5) discard;
  float a = (1.0 - smoothstep(0.15, 0.5, d)) * vAlpha;
  float glow = exp(-d * 6.0) * 0.5;
  gl_FragColor = vec4(vColor + glow, a);
}`;

// ─── FORMA DE CORAZÓN ─────────────────────────────────────────────────────────
function makeHeartShape(size: number): THREE.Shape {
  const s = new THREE.Shape();
  const k = size;
  s.moveTo(0, k * 0.25);
  s.bezierCurveTo(-k * 0.05, k * 0.25, -k * 0.5, k * 0.7, -k * 0.5, k * 0.35);
  s.bezierCurveTo(-k * 0.5, k * 0.05, -k * 0.25, -k * 0.15, 0, -k * 0.5);
  s.bezierCurveTo(k * 0.25, -k * 0.15, k * 0.5, k * 0.05, k * 0.5, k * 0.35);
  s.bezierCurveTo(k * 0.5, k * 0.7, k * 0.05, k * 0.25, 0, k * 0.25);
  return s;
}

// ─── POSICIÓN EN SUPERFICIE DEL CORAZÓN ──────────────────────────────────────
function heartPoint(t: number, size: number): [number, number] {
  const k = size;
  const x = k * 16 * Math.pow(Math.sin(t), 3) * 0.062;
  const y = k * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 0.062;
  return [x, y - k * 0.1];
}

export default function NeonHeart() {
  const groupRef = useRef<THREE.Group>(null);

  // Geometría del corazón
  const heartGeo = useMemo(() => {
    const shape = makeHeartShape(0.7);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
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

  // Glow exterior
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ff1a5e"),
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  // Partículas emitidas desde el corazón
  const { partGeo, partMat } = useMemo(() => {
    const N = 600;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const life = new Float32Array(N);
    const size = new Float32Array(N);
    const col = new Float32Array(N * 3);

    const COLORS = [
      [1.0, 0.2, 0.5],   // rosa neón
      [1.0, 0.5, 0.8],   // rosa claro
      [0.9, 0.1, 0.4],   // rojo rosa
      [1.0, 0.8, 0.9],   // blanco rosado
      [0.8, 0.2, 1.0],   // lila
    ];

    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const [hx, hy] = heartPoint(t, 0.7);
      pos[i*3]   = hx + (Math.random() - 0.5) * 0.08;
      pos[i*3+1] = hy + (Math.random() - 0.5) * 0.08;
      pos[i*3+2] = (Math.random() - 0.5) * 0.22;

      // Velocidad: hacia afuera desde el centro del corazón
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.2;
      vel[i*3]   = Math.cos(angle) * speed;
      vel[i*3+1] = Math.sin(angle) * speed * 0.7 + 0.3;
      vel[i*3+2] = (Math.random() - 0.5) * speed * 0.5;

      life[i] = Math.random();
      size[i] = 60 + Math.random() * 80;

      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
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
      groupRef.current.rotation.y = t * 0.55;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.18;
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Glow exterior */}
      <mesh geometry={heartGeo} material={glowMat} scale={[1.15, 1.15, 1.15]} />
      {/* Corazón principal */}
      <mesh geometry={heartGeo} material={heartMat} position={[-0.35, -0.35, -0.11]} />
      {/* Partículas */}
      <points geometry={partGeo} material={partMat} />
    </group>
  );
}
