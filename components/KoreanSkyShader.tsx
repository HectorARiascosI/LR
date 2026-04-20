"use client";
/**
 * KoreanSkyShader — Paisaje coreano de primavera procedural GLSL
 * Capas: cielo degradado cálido → montañas en silueta → niebla volumétrica
 * → rayos de sol → arcoíris sutil → llovizna atmosférica
 * Cambia de escena (hora del día / perspectiva) según sección del scroll.
 */
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uSection;   // 0..10 suavizado
uniform vec2  uRes;

// ── Utilidades ────────────────────────────────────────────────────────────────
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float hash1(float n){ return fract(sin(n)*43758.5453); }

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}

float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.1+vec2(1.7,9.2); a*=0.5; }
  return v;
}

// ── Paletas por sección ───────────────────────────────────────────────────────
// sec 0-1: amanecer dorado-rosa
// sec 2-3: mañana primaveral verde-azul
// sec 4-5: mediodía cálido
// sec 6-7: tarde dorada
// sec 8-9: atardecer lila-naranja
// sec 10:  noche suave azul-índigo

vec3 skyTop(float s){
  if(s<1.0) return mix(vec3(0.08,0.04,0.12),vec3(0.55,0.22,0.35),s);
  if(s<2.0) return mix(vec3(0.55,0.22,0.35),vec3(0.28,0.48,0.72),s-1.0);
  if(s<4.0) return mix(vec3(0.28,0.48,0.72),vec3(0.38,0.62,0.88),(s-2.0)/2.0);
  if(s<6.0) return mix(vec3(0.38,0.62,0.88),vec3(0.62,0.72,0.92),(s-4.0)/2.0);
  if(s<8.0) return mix(vec3(0.62,0.72,0.92),vec3(0.72,0.42,0.28),(s-6.0)/2.0);
  if(s<9.0) return mix(vec3(0.72,0.42,0.28),vec3(0.38,0.28,0.58),s-8.0);
  return mix(vec3(0.38,0.28,0.58),vec3(0.06,0.06,0.18),s-9.0);
}

vec3 skyBot(float s){
  if(s<1.0) return mix(vec3(0.62,0.28,0.38),vec3(0.92,0.62,0.52),s);
  if(s<2.0) return mix(vec3(0.92,0.62,0.52),vec3(0.72,0.88,0.78),s-1.0);
  if(s<4.0) return mix(vec3(0.72,0.88,0.78),vec3(0.82,0.92,0.88),(s-2.0)/2.0);
  if(s<6.0) return mix(vec3(0.82,0.92,0.88),vec3(0.95,0.92,0.78),(s-4.0)/2.0);
  if(s<8.0) return mix(vec3(0.95,0.92,0.78),vec3(0.92,0.62,0.38),(s-6.0)/2.0);
  if(s<9.0) return mix(vec3(0.92,0.62,0.38),vec3(0.52,0.38,0.62),s-8.0);
  return mix(vec3(0.52,0.38,0.62),vec3(0.12,0.12,0.28),s-9.0);
}

// ── Montañas en capas ─────────────────────────────────────────────────────────
float mountain(vec2 uv, float scale, float offset, float t){
  float x = uv.x * scale + offset + t * 0.008;
  float h = fbm(vec2(x, 0.3)) * 0.38 + 0.08;
  return smoothstep(h+0.008, h-0.008, uv.y);
}

// ── Rayos de sol ──────────────────────────────────────────────────────────────
float sunRay(vec2 uv, vec2 sunPos, float angle, float width, float t){
  vec2 d = uv - sunPos;
  float a = atan(d.y, d.x);
  float diff = mod(abs(a - angle) + 3.14159, 6.28318) - 3.14159;
  // Suavidad gaussiana — no barra sólida
  float ray = exp(-diff * diff / (width * width * 2.0));
  float dist = length(d);
  // Atenuación con distancia + ruido para aspecto volumétrico
  float n = noise(vec2(dist * 8.0 + t * 0.3, angle * 3.0));
  ray *= smoothstep(1.4, 0.0, dist) * smoothstep(0.0, 0.12, dist);
  ray *= 0.5 + n * 0.5;
  return ray * 0.7;
}

// ── Arcoíris ──────────────────────────────────────────────────────────────────
vec3 rainbow(vec2 uv, vec2 center, float r0, float r1){
  float d = length(uv - center);
  float t = smoothstep(r0, r0+0.01, d) * smoothstep(r1, r1-0.01, d);
  float hue = (d - r0) / (r1 - r0);
  // HSV to RGB
  vec3 c = abs(mod(hue*6.0+vec3(0,4,2),6.0)-3.0)-1.0;
  return clamp(c,0.0,1.0) * t * 0.35;
}

// ── Niebla ────────────────────────────────────────────────────────────────────
float fogLayer(vec2 uv, float y, float t){
  float n = fbm(vec2(uv.x * 2.5 + t * 0.04, uv.y * 4.0));
  float band = smoothstep(y+0.06, y, uv.y) * smoothstep(y-0.12, y, uv.y);
  return n * band * 0.55;
}

void main(){
  vec2 uv = vUv;
  float t  = uTime;
  float sec = clamp(uSection, 0.0, 10.0);

  // ── Cielo degradado ──────────────────────────────────────────────────────
  vec3 top = skyTop(sec);
  vec3 bot = skyBot(sec);
  float skyT = pow(uv.y, 0.7);
  vec3 col = mix(bot, top, skyT);

  // ── Sol ──────────────────────────────────────────────────────────────────
  // Sol fijo — no se mueve al cambiar sección
  float sunX = 0.72;
  float sunY = 0.62;
  vec2 sunPos = vec2(sunX, sunY);
  float sunDist = length(uv - sunPos);
  float sunGlow = exp(-sunDist * 8.0) * 0.9;
  float sunCore = smoothstep(0.04, 0.01, sunDist);
  vec3 sunCol = mix(vec3(1.0,0.92,0.72), vec3(1.0,0.72,0.38), sec/10.0);
  col += sunGlow * sunCol * 0.6;
  col += sunCore * vec3(1.0,0.98,0.92);

  // ── Rayos de sol (volumétricos suaves) ──────────────────────────────────
  float rays = 0.0;
  for(int i=0;i<12;i++){
    float fi = float(i);
    float angle = fi * 0.5236 + t * 0.012 + sin(t * 0.08 + fi) * 0.15;
    float width = 0.04 + sin(fi * 1.3) * 0.02;
    rays += sunRay(uv, sunPos, angle, width, t);
  }
  col += rays * sunCol * 0.18;

  // ── Arcoíris (secciones 2-4) ─────────────────────────────────────────────
  float rainbowAmt = smoothstep(1.5,2.5,sec) * smoothstep(4.5,3.5,sec);
  col += rainbow(uv, vec2(0.5, -0.1), 0.38, 0.52) * rainbowAmt;

  // ── Montañas ─────────────────────────────────────────────────────────────
  // Capa lejana — azul-gris
  float mtn3 = mountain(uv, 1.8, 0.0, t);
  vec3 mtnFar = mix(top, vec3(0.38,0.48,0.55), 0.6);
  col = mix(col, mtnFar, mtn3 * 0.7);

  // Capa media — verde oscuro
  float mtn2 = mountain(uv, 2.4, 3.7, t);
  vec3 mtnMid = mix(vec3(0.12,0.28,0.18), vec3(0.22,0.42,0.28), sec/10.0);
  col = mix(col, mtnMid, mtn2 * 0.85);

  // Capa cercana — verde vivo con sakura
  float mtn1 = mountain(uv, 3.2, 7.1, t);
  vec3 mtnNear = mix(vec3(0.08,0.22,0.12), vec3(0.18,0.38,0.22), sec/10.0);
  // Toque de sakura en la capa cercana
  float sakuraTint = smoothstep(2.0,5.0,sec) * smoothstep(8.0,6.0,sec);
  mtnNear = mix(mtnNear, vec3(0.92,0.72,0.78), sakuraTint * 0.35);
  col = mix(col, mtnNear, mtn1);

  // ── Niebla ────────────────────────────────────────────────────────────────
  float fog1 = fogLayer(uv, 0.28, t);
  float fog2 = fogLayer(uv, 0.18, t + 40.0);
  float fog3 = fogLayer(uv, 0.08, t + 80.0);
  vec3 fogCol = mix(vec3(0.92,0.88,0.95), vec3(0.78,0.88,0.92), sec/10.0);
  col = mix(col, fogCol, clamp(fog1+fog2+fog3, 0.0, 0.7));

  // ── Suelo / agua ─────────────────────────────────────────────────────────
  float ground = smoothstep(0.12, 0.0, uv.y);
  vec3 groundCol = mix(vec3(0.12,0.28,0.18), vec3(0.08,0.18,0.28), sec/10.0);
  // Reflejo del sol en el agua
  float waterRefl = fbm(vec2(uv.x*8.0+t*0.1, uv.y*20.0)) * 0.3;
  groundCol += sunCol * waterRefl * ground * 0.4;
  col = mix(col, groundCol, ground);

  // ── Llovizna atmosférica ─────────────────────────────────────────────────
  float rainAmt = smoothstep(3.0,4.0,sec) * smoothstep(7.0,6.0,sec) * 0.06;
  float rain = 0.0;
  for(int i=0;i<3;i++){
    float fi = float(i);
    vec2 rainUv = vec2(uv.x*40.0 + fi*13.7, uv.y*80.0 + t*(8.0+fi*2.0));
    rain += smoothstep(0.48, 0.5, fract(rainUv.x)) *
            smoothstep(0.0, 0.3, fract(rainUv.y)) * 0.3;
  }
  col += rain * rainAmt * vec3(0.8,0.88,0.95);

  // ── Viñeta suave ─────────────────────────────────────────────────────────
  vec2 vig = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vig,vig) * 0.28;
  col *= vignette;

  // ── Tono soñador (desaturar ligeramente + brillo) ─────────────────────────
  float lum = dot(col, vec3(0.299,0.587,0.114));
  col = mix(col, vec3(lum), 0.12);
  col = pow(clamp(col,0.0,1.0), vec3(0.92));

  gl_FragColor = vec4(col, 1.0);
}
`;

interface Props { section: number }

export default function KoreanSkyShader({ section }: Props) {
  const { size } = useThree();
  const targetSection = useRef(0);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime:    { value: 0 },
      uSection: { value: 0 },
      uRes:     { value: new THREE.Vector2(size.width, size.height) },
    },
    depthWrite: false,
    depthTest: false,
  }), [size]);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    // Suavizar transición de sección
    targetSection.current = section;
    mat.uniforms.uSection.value += (targetSection.current - mat.uniforms.uSection.value) * 0.008;
  });

  return (
    <mesh renderOrder={-2}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} />
    </mesh>
  );
}
