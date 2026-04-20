"use client";
/**
 * Escanor y Merlin — personajes anime estilizados en Three.js
 * Escanor: hombre grande, musculoso, pelo rubio, aura solar dorada, orgullo
 * Merlin: mujer elegante, pelo negro largo, aura mágica lila, orbe flotante
 * Animaciones procedurales fluidas: idle, raise_arm, bow, cast_spell, wave
 */
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── TOON GRADIENT TEXTURE ────────────────────────────────────────────────────
function makeToonGradient(steps: number[]): THREE.DataTexture {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => {
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  });
  const tex = new THREE.DataTexture(data, steps.length, 1);
  tex.needsUpdate = true;
  return tex;
}

const TOON_GRAD = makeToonGradient([40, 80, 140, 200, 255]);

function toon(hex: string, emissiveHex = "#000000", emissiveInt = 0) {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(hex),
    gradientMap: TOON_GRAD,
    emissive: new THREE.Color(emissiveHex),
    emissiveIntensity: emissiveInt,
  });
}

// ─── ESCANOR ──────────────────────────────────────────────────────────────────
export type EscanorAnim = "idle" | "raise_arm" | "bow" | "walk" | "proud";

interface EscanorProps {
  position?: [number, number, number];
  anim?: EscanorAnim;
  scale?: number;
}

export function Escanor({ position = [0,0,0], anim = "idle", scale = 1 }: EscanorProps) {
  const root    = useRef<THREE.Group>(null);
  const torso   = useRef<THREE.Group>(null);
  const head    = useRef<THREE.Group>(null);
  const rArm    = useRef<THREE.Group>(null);
  const lArm    = useRef<THREE.Group>(null);
  const rFore   = useRef<THREE.Group>(null);
  const lFore   = useRef<THREE.Group>(null);
  const rLeg    = useRef<THREE.Group>(null);
  const lLeg    = useRef<THREE.Group>(null);
  const aura    = useRef<THREE.Mesh>(null);
  const t0      = useRef(Math.random() * 100);

  // Materiales icónicos de Escanor
  const m = useMemo(() => ({
    skin:   toon("#d4956a"),
    hair:   toon("#d4a017", "#f5d98a", 0.3),   // rubio dorado con glow
    shirt:  toon("#1a1a2e", "#2a1a5e", 0.08),  // oscuro con tinte lila
    pants:  toon("#0d0d1a"),
    boots:  toon("#1a0a05"),
    belt:   toon("#8b4513"),
    aura:   new THREE.MeshBasicMaterial({
      color: "#f5d98a", transparent: true, opacity: 0.15,
      side: THREE.BackSide, depthWrite: false,
    }),
    auraInner: new THREE.MeshBasicMaterial({
      color: "#fff8e0", transparent: true, opacity: 0.06,
      side: THREE.BackSide, depthWrite: false,
    }),
    eye:    new THREE.MeshBasicMaterial({ color: "#f5d98a" }),
    eyeInner: new THREE.MeshBasicMaterial({ color: "#1a0a00" }),
    brow:   toon("#8b6914"),
    mustache: toon("#c8900a"),
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + t0.current;
    if (!torso.current || !head.current || !rArm.current || !lArm.current) return;

    // Respiración base
    const breath = Math.sin(t * 1.1) * 0.012;
    torso.current.position.y = breath;

    // Cabeza — leve movimiento orgánico
    head.current.rotation.z = Math.sin(t * 0.35) * 0.018;
    head.current.rotation.y = Math.sin(t * 0.28) * 0.035;

    // Aura solar pulsante
    if (aura.current) {
      const pulse = 1 + Math.sin(t * 1.8) * 0.06;
      aura.current.scale.setScalar(pulse);
      (aura.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 1.8) * 0.06;
    }

    if (anim === "idle") {
      rArm.current.rotation.z = -0.18 + Math.sin(t * 1.1) * 0.025;
      lArm.current.rotation.z =  0.18 + Math.sin(t * 1.1 + 0.5) * 0.025;
      rArm.current.rotation.x = 0.04;
      lArm.current.rotation.x = 0.04;
      if (rFore.current) rFore.current.rotation.x = 0.08;
      if (lFore.current) lFore.current.rotation.x = 0.08;
    }

    if (anim === "raise_arm" || anim === "proud") {
      // Brazo derecho levantado — pose icónica de Escanor
      const cycle = (t % 5) / 5;
      const raise = Math.sin(cycle * Math.PI);
      rArm.current.rotation.z = -0.18 - raise * 2.0;
      rArm.current.rotation.x = raise * 0.4;
      if (rFore.current) rFore.current.rotation.x = raise * 0.5;
      lArm.current.rotation.z = 0.18 + Math.sin(t * 1.1) * 0.02;
      // Inclinación de torso — orgullo
      torso.current.rotation.z = raise * 0.06;
      head.current.rotation.x = -raise * 0.08; // mira hacia arriba
    }

    if (anim === "bow") {
      const bowAmt = 0.45 + Math.sin(t * 0.4) * 0.05;
      torso.current.rotation.x = bowAmt * 0.5;
      head.current.rotation.x  = bowAmt * 0.35;
      rArm.current.rotation.z = -0.35;
      lArm.current.rotation.z =  0.35;
    }

    if (anim === "walk") {
      const w = t * 2.2;
      if (rLeg.current) rLeg.current.rotation.x =  Math.sin(w) * 0.45;
      if (lLeg.current) lLeg.current.rotation.x = -Math.sin(w) * 0.45;
      rArm.current.rotation.x = -Math.sin(w) * 0.3;
      lArm.current.rotation.x =  Math.sin(w) * 0.3;
      if (root.current) root.current.position.x = position[0] + Math.sin(t * 0.4) * 0.2;
    }
  });

  const s = scale;
  return (
    <group ref={root} position={position} scale={[s, s, s]}>
      {/* Aura solar doble capa */}
      <mesh ref={aura} position={[0, 1.1, 0]}>
        <sphereGeometry args={[1.6, 16, 12]} />
        <primitive object={m.aura} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[1.2, 16, 12]} />
        <primitive object={m.auraInner} />
      </mesh>

      {/* Pierna derecha */}
      <group ref={rLeg} position={[-0.24, 0, 0]}>
        <mesh position={[0, 0.5, 0]} material={m.pants}>
          <cylinderGeometry args={[0.16, 0.13, 1.0, 8]} />
        </mesh>
        <mesh position={[0, -0.06, 0.03]} material={m.boots}>
          <boxGeometry args={[0.22, 0.22, 0.32]} />
        </mesh>
      </group>

      {/* Pierna izquierda */}
      <group ref={lLeg} position={[0.24, 0, 0]}>
        <mesh position={[0, 0.5, 0]} material={m.pants}>
          <cylinderGeometry args={[0.16, 0.13, 1.0, 8]} />
        </mesh>
        <mesh position={[0, -0.06, 0.03]} material={m.boots}>
          <boxGeometry args={[0.22, 0.22, 0.32]} />
        </mesh>
      </group>

      {/* Cinturón */}
      <mesh position={[0, 0.95, 0]} material={m.belt}>
        <boxGeometry args={[0.78, 0.12, 0.42]} />
      </mesh>

      {/* Torso — ancho y musculoso */}
      <group ref={torso} position={[0, 1.0, 0]}>
        <mesh material={m.shirt}>
          <boxGeometry args={[0.82, 0.92, 0.44]} />
        </mesh>
        {/* Detalle pecho */}
        <mesh position={[0, 0.1, 0.23]} material={m.belt}>
          <boxGeometry args={[0.5, 0.06, 0.02]} />
        </mesh>

        {/* Brazo derecho */}
        <group ref={rArm} position={[-0.55, 0.28, 0]}>
          <mesh position={[0, -0.25, 0]} material={m.shirt}>
            <cylinderGeometry args={[0.13, 0.11, 0.5, 8]} />
          </mesh>
          <group ref={rFore} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.2, 0]} material={m.skin}>
              <cylinderGeometry args={[0.1, 0.09, 0.4, 8]} />
            </mesh>
            {/* Mano grande */}
            <mesh position={[0, -0.44, 0]} material={m.skin}>
              <boxGeometry args={[0.16, 0.18, 0.1]} />
            </mesh>
          </group>
        </group>

        {/* Brazo izquierdo */}
        <group ref={lArm} position={[0.55, 0.28, 0]}>
          <mesh position={[0, -0.25, 0]} material={m.shirt}>
            <cylinderGeometry args={[0.13, 0.11, 0.5, 8]} />
          </mesh>
          <group ref={lFore} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.2, 0]} material={m.skin}>
              <cylinderGeometry args={[0.1, 0.09, 0.4, 8]} />
            </mesh>
            <mesh position={[0, -0.44, 0]} material={m.skin}>
              <boxGeometry args={[0.16, 0.18, 0.1]} />
            </mesh>
          </group>
        </group>

        {/* Cuello grueso */}
        <mesh position={[0, 0.54, 0]} material={m.skin}>
          <cylinderGeometry args={[0.13, 0.15, 0.22, 8]} />
        </mesh>

        {/* Cabeza */}
        <group ref={head} position={[0, 0.82, 0]}>
          {/* Cráneo cuadrado — estilo anime masculino */}
          <mesh material={m.skin}>
            <boxGeometry args={[0.52, 0.54, 0.44]} />
          </mesh>
          {/* Mandíbula ligeramente más ancha */}
          <mesh position={[0, -0.2, 0]} material={m.skin}>
            <boxGeometry args={[0.5, 0.18, 0.42]} />
          </mesh>

          {/* Pelo rubio — Escanor tiene pelo corto hacia atrás */}
          <mesh position={[0, 0.24, -0.04]} material={m.hair}>
            <boxGeometry args={[0.54, 0.2, 0.46]} />
          </mesh>
          <mesh position={[0, 0.18, -0.24]} material={m.hair}>
            <boxGeometry args={[0.5, 0.32, 0.08]} />
          </mesh>
          {/* Flequillo lateral */}
          <mesh position={[-0.28, 0.12, 0.1]} material={m.hair}>
            <boxGeometry args={[0.06, 0.28, 0.3]} />
          </mesh>
          <mesh position={[0.28, 0.12, 0.1]} material={m.hair}>
            <boxGeometry args={[0.06, 0.28, 0.3]} />
          </mesh>

          {/* Bigote característico de Escanor */}
          <mesh position={[0, -0.06, 0.23]} material={m.mustache}>
            <boxGeometry args={[0.22, 0.04, 0.02]} />
          </mesh>
          <mesh position={[-0.12, -0.1, 0.23]} material={m.mustache}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
          </mesh>
          <mesh position={[0.12, -0.1, 0.23]} material={m.mustache}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
          </mesh>

          {/* Ojos dorados — Escanor */}
          <mesh position={[-0.14, 0.08, 0.23]} material={m.eye}>
            <boxGeometry args={[0.12, 0.09, 0.01]} />
          </mesh>
          <mesh position={[0.14, 0.08, 0.23]} material={m.eye}>
            <boxGeometry args={[0.12, 0.09, 0.01]} />
          </mesh>
          <mesh position={[-0.14, 0.08, 0.235]} material={m.eyeInner}>
            <boxGeometry args={[0.07, 0.06, 0.01]} />
          </mesh>
          <mesh position={[0.14, 0.08, 0.235]} material={m.eyeInner}>
            <boxGeometry args={[0.07, 0.06, 0.01]} />
          </mesh>
          {/* Brillo ojo */}
          <mesh position={[-0.11, 0.11, 0.24]} material={new THREE.MeshBasicMaterial({ color: "#ffffff" })}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>
          <mesh position={[0.17, 0.11, 0.24]} material={new THREE.MeshBasicMaterial({ color: "#ffffff" })}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>

          {/* Cejas gruesas */}
          <mesh position={[-0.14, 0.16, 0.23]} material={m.brow}>
            <boxGeometry args={[0.14, 0.03, 0.01]} />
          </mesh>
          <mesh position={[0.14, 0.16, 0.23]} material={m.brow}>
            <boxGeometry args={[0.14, 0.03, 0.01]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── MERLIN ───────────────────────────────────────────────────────────────────
export type MerlinAnim = "idle" | "cast_spell" | "wave" | "look_up" | "summon";

interface MerlinProps {
  position?: [number, number, number];
  anim?: MerlinAnim;
  scale?: number;
}

export function Merlin({ position = [0,0,0], anim = "idle", scale = 1 }: MerlinProps) {
  const root    = useRef<THREE.Group>(null);
  const torso   = useRef<THREE.Group>(null);
  const head    = useRef<THREE.Group>(null);
  const rArm    = useRef<THREE.Group>(null);
  const lArm    = useRef<THREE.Group>(null);
  const rFore   = useRef<THREE.Group>(null);
  const lFore   = useRef<THREE.Group>(null);
  const hair    = useRef<THREE.Group>(null);
  const orb     = useRef<THREE.Group>(null);
  const aura    = useRef<THREE.Mesh>(null);
  const t0      = useRef(Math.random() * 100 + 50);

  // Materiales icónicos de Merlin — negro, lila, piel clara
  const m = useMemo(() => ({
    skin:     toon("#e8c4a0"),
    hairCol:  toon("#0d0520", "#3a1a6e", 0.08),  // negro con tinte lila
    dress:    toon("#1a0535", "#6a2aae", 0.18),   // vestido oscuro lila
    cape:     toon("#0d0320", "#4a1a8e", 0.12),
    boots:    toon("#0a0218"),
    orbMat:   new THREE.MeshBasicMaterial({ color: "#b48ee8", transparent: true, opacity: 0.92 }),
    orbGlow:  new THREE.MeshBasicMaterial({ color: "#d4b8ff", transparent: true, opacity: 0.25, side: THREE.BackSide, depthWrite: false }),
    orbCore:  new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6 }),
    aura:     new THREE.MeshBasicMaterial({ color: "#9a5aee", transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false }),
    eye:      new THREE.MeshBasicMaterial({ color: "#6a2aee" }),  // ojos lila
    eyeWhite: new THREE.MeshBasicMaterial({ color: "#f0e8ff" }),
    eyeShine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    lip:      new THREE.MeshBasicMaterial({ color: "#c06080" }),
    brow:     toon("#0d0520"),
    rune:     new THREE.MeshBasicMaterial({ color: "#d4b8ff", transparent: true, opacity: 0.7 }),
  }), []);

  // Runas flotantes alrededor del orbe
  const runePositions = useMemo(() => [
    [0.3, 0, 0], [-0.3, 0, 0], [0, 0.3, 0], [0, -0.3, 0],
    [0.21, 0.21, 0], [-0.21, 0.21, 0],
  ], []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + t0.current;
    if (!torso.current || !head.current || !rArm.current) return;

    const breath = Math.sin(t * 1.0) * 0.01;
    torso.current.position.y = breath;
    head.current.rotation.z  = Math.sin(t * 0.3) * 0.02;

    // Pelo flotando suavemente
    if (hair.current) {
      hair.current.rotation.z = Math.sin(t * 0.35) * 0.025;
      hair.current.position.y = Math.sin(t * 0.5) * 0.008;
    }

    // Orbe flotante — siempre activo
    if (orb.current) {
      orb.current.position.y = 0.1 + Math.sin(t * 1.2) * 0.08;
      orb.current.rotation.y = t * 0.8;
      orb.current.rotation.z = Math.sin(t * 0.6) * 0.3;
    }

    // Aura mágica
    if (aura.current) {
      aura.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
      (aura.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 1.4) * 0.04;
    }

    if (anim === "idle") {
      rArm.current.rotation.z = -0.14 + Math.sin(t * 1.0) * 0.02;
      lArm.current.rotation.z =  0.14 + Math.sin(t * 1.0 + 0.4) * 0.02;
      head.current.rotation.y = Math.sin(t * 0.22) * 0.05;
    }

    if (anim === "cast_spell" || anim === "summon") {
      const castCycle = (t % 3.5) / 3.5;
      const castAmt = Math.sin(castCycle * Math.PI);
      rArm.current.rotation.z = -0.14 - castAmt * 0.8;
      rArm.current.rotation.x =  castAmt * 1.0;
      lArm.current.rotation.z =  0.14 + castAmt * 0.8;
      lArm.current.rotation.x =  castAmt * 1.0;
      if (rFore.current) rFore.current.rotation.x = castAmt * 0.6;
      if (lFore.current) lFore.current.rotation.x = castAmt * 0.6;
      // Orbe se expande al lanzar
      if (orb.current) {
        orb.current.scale.setScalar(1 + castAmt * 0.5);
      }
    }

    if (anim === "wave") {
      rArm.current.rotation.z = -1.4 + Math.sin(t * 3.5) * 0.35;
      rArm.current.rotation.x = 0.25;
      if (rFore.current) rFore.current.rotation.x = 0.4 + Math.sin(t * 3.5) * 0.25;
      lArm.current.rotation.z = 0.14;
    }

    if (anim === "look_up") {
      head.current.rotation.x = -0.4 + Math.sin(t * 0.4) * 0.04;
      head.current.rotation.y = Math.sin(t * 0.25) * 0.08;
    }
  });

  const s = scale;
  return (
    <group ref={root} position={position} scale={[s, s, s]}>
      {/* Aura mágica */}
      <mesh ref={aura} position={[0, 1.0, 0]}>
        <sphereGeometry args={[1.3, 16, 12]} />
        <primitive object={m.aura} />
      </mesh>

      {/* Orbe mágico flotante */}
      <group ref={orb} position={[0.6, 1.4, 0.3]}>
        <mesh material={m.orbGlow}>
          <sphereGeometry args={[0.22, 12, 10]} />
        </mesh>
        <mesh material={m.orbMat}>
          <sphereGeometry args={[0.14, 12, 10]} />
        </mesh>
        <mesh material={m.orbCore}>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
        {/* Runas orbitando */}
        {runePositions.map((pos: number[], i: number) => (
          <mesh key={i} position={pos as [number,number,number]} material={m.rune}>
            <planeGeometry args={[0.06, 0.06]} />
          </mesh>
        ))}
      </group>

      {/* Falda/vestido inferior */}
      <mesh position={[0, 0.4, 0]} material={m.dress}>
        <cylinderGeometry args={[0.3, 0.42, 0.8, 10]} />
      </mesh>
      {/* Capa trasera */}
      <mesh position={[0, 0.6, -0.22]} material={m.cape}>
        <boxGeometry args={[0.68, 1.0, 0.06]} />
      </mesh>

      {/* Piernas */}
      <mesh position={[-0.13, 0.06, 0]} material={m.boots}>
        <cylinderGeometry args={[0.09, 0.08, 0.35, 7]} />
      </mesh>
      <mesh position={[0.13, 0.06, 0]} material={m.boots}>
        <cylinderGeometry args={[0.09, 0.08, 0.35, 7]} />
      </mesh>

      {/* Torso */}
      <group ref={torso} position={[0, 0.9, 0]}>
        <mesh material={m.dress}>
          <boxGeometry args={[0.56, 0.78, 0.32]} />
        </mesh>

        {/* Brazo derecho */}
        <group ref={rArm} position={[-0.36, 0.24, 0]}>
          <mesh position={[0, -0.2, 0]} material={m.dress}>
            <cylinderGeometry args={[0.08, 0.07, 0.4, 7]} />
          </mesh>
          <group ref={rFore} position={[0, -0.4, 0]}>
            <mesh position={[0, -0.16, 0]} material={m.skin}>
              <cylinderGeometry args={[0.07, 0.06, 0.32, 7]} />
            </mesh>
            <mesh position={[0, -0.34, 0]} material={m.skin}>
              <boxGeometry args={[0.1, 0.12, 0.07]} />
            </mesh>
          </group>
        </group>

        {/* Brazo izquierdo */}
        <group ref={lArm} position={[0.36, 0.24, 0]}>
          <mesh position={[0, -0.2, 0]} material={m.dress}>
            <cylinderGeometry args={[0.08, 0.07, 0.4, 7]} />
          </mesh>
          <group ref={lFore} position={[0, -0.4, 0]}>
            <mesh position={[0, -0.16, 0]} material={m.skin}>
              <cylinderGeometry args={[0.07, 0.06, 0.32, 7]} />
            </mesh>
            <mesh position={[0, -0.34, 0]} material={m.skin}>
              <boxGeometry args={[0.1, 0.12, 0.07]} />
            </mesh>
          </group>
        </group>

        {/* Cuello */}
        <mesh position={[0, 0.46, 0]} material={m.skin}>
          <cylinderGeometry args={[0.08, 0.1, 0.18, 8]} />
        </mesh>

        {/* Cabeza */}
        <group ref={head} position={[0, 0.68, 0]}>
          {/* Cráneo — forma más ovalada, femenina */}
          <mesh material={m.skin}>
            <boxGeometry args={[0.42, 0.48, 0.36]} />
          </mesh>
          {/* Mejillas suaves */}
          <mesh position={[-0.22, -0.06, 0.1]} material={m.skin}>
            <sphereGeometry args={[0.1, 6, 5]} />
          </mesh>
          <mesh position={[0.22, -0.06, 0.1]} material={m.skin}>
            <sphereGeometry args={[0.1, 6, 5]} />
          </mesh>

          {/* Pelo negro largo — Merlin */}
          <group ref={hair}>
            {/* Parte superior */}
            <mesh position={[0, 0.2, -0.02]} material={m.hairCol}>
              <boxGeometry args={[0.44, 0.18, 0.38]} />
            </mesh>
            {/* Flequillo */}
            <mesh position={[0, 0.12, 0.19]} material={m.hairCol}>
              <boxGeometry args={[0.4, 0.14, 0.04]} />
            </mesh>
            {/* Mechón izquierdo largo */}
            <mesh position={[-0.24, -0.15, -0.02]} material={m.hairCol}>
              <boxGeometry args={[0.07, 0.6, 0.3]} />
            </mesh>
            {/* Mechón derecho largo */}
            <mesh position={[0.24, -0.15, -0.02]} material={m.hairCol}>
              <boxGeometry args={[0.07, 0.6, 0.3]} />
            </mesh>
            {/* Pelo trasero muy largo */}
            <mesh position={[0, -0.5, -0.2]} material={m.hairCol}>
              <boxGeometry args={[0.36, 0.8, 0.1]} />
            </mesh>
            {/* Extensión inferior */}
            <mesh position={[0, -1.0, -0.18]} material={m.hairCol}>
              <boxGeometry args={[0.28, 0.5, 0.08]} />
            </mesh>
          </group>

          {/* Ojos grandes — estilo anime femenino */}
          <mesh position={[-0.12, 0.06, 0.19]} material={m.eyeWhite}>
            <boxGeometry args={[0.13, 0.13, 0.01]} />
          </mesh>
          <mesh position={[0.12, 0.06, 0.19]} material={m.eyeWhite}>
            <boxGeometry args={[0.13, 0.13, 0.01]} />
          </mesh>
          <mesh position={[-0.12, 0.06, 0.195]} material={m.eye}>
            <boxGeometry args={[0.1, 0.1, 0.01]} />
          </mesh>
          <mesh position={[0.12, 0.06, 0.195]} material={m.eye}>
            <boxGeometry args={[0.1, 0.1, 0.01]} />
          </mesh>
          {/* Pupila */}
          <mesh position={[-0.12, 0.05, 0.2]} material={new THREE.MeshBasicMaterial({ color: "#1a0030" })}>
            <boxGeometry args={[0.05, 0.06, 0.01]} />
          </mesh>
          <mesh position={[0.12, 0.05, 0.2]} material={new THREE.MeshBasicMaterial({ color: "#1a0030" })}>
            <boxGeometry args={[0.05, 0.06, 0.01]} />
          </mesh>
          {/* Brillo ojos */}
          <mesh position={[-0.09, 0.09, 0.205]} material={m.eyeShine}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>
          <mesh position={[0.15, 0.09, 0.205]} material={m.eyeShine}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>

          {/* Cejas finas y elegantes */}
          <mesh position={[-0.12, 0.15, 0.19]} material={m.brow}>
            <boxGeometry args={[0.12, 0.02, 0.01]} />
          </mesh>
          <mesh position={[0.12, 0.15, 0.19]} material={m.brow}>
            <boxGeometry args={[0.12, 0.02, 0.01]} />
          </mesh>

          {/* Boca */}
          <mesh position={[0, -0.07, 0.19]} material={m.lip}>
            <boxGeometry args={[0.08, 0.022, 0.01]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
