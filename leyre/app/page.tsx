"use client";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import NarrativeText from "@/components/NarrativeText";
import TransitionController from "@/components/TransitionController";
import { useAnimationPhase } from "@/hooks/useAnimationPhase";
import type { Phase } from "@/hooks/useAnimationPhase";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => null,
});

/* Gradientes por fase */
const BG: Record<Phase, string> = {
  void:      "radial-gradient(ellipse 80% 60% at 50% 50%, #0d0520 0%, #03020a 100%)",
  awakening: "radial-gradient(ellipse 100% 70% at 35% 55%, #160830 0%, #03020a 70%)",
  origin:    "radial-gradient(ellipse 90% 60% at 50% 40%, #0e0525 0%, #03020a 65%), radial-gradient(ellipse 40% 40% at 70% 70%, #1a0830 0%, transparent 60%)",
  formation: "radial-gradient(ellipse 110% 80% at 50% 50%, #0d1a10 0%, #03020a 60%)",
  heartbeat: "radial-gradient(ellipse 80% 80% at 50% 50%, #220d40 0%, #03020a 55%)",
  letter_1:  "radial-gradient(ellipse 100% 70% at 50% 50%, #180a30 0%, #03020a 60%), radial-gradient(ellipse 50% 50% at 80% 20%, #2a0a20 0%, transparent 50%)",
  letter_2:  "radial-gradient(ellipse 100% 70% at 50% 50%, #1a0830 0%, #03020a 60%), radial-gradient(ellipse 40% 40% at 20% 80%, #200a28 0%, transparent 50%)",
  letter_3:  "radial-gradient(ellipse 100% 70% at 50% 50%, #0d1a10 0%, #03020a 60%), radial-gradient(ellipse 50% 50% at 75% 75%, #1a2a10 0%, transparent 50%)",
  letter_4:  "radial-gradient(ellipse 100% 70% at 50% 50%, #1e1008 0%, #03020a 60%), radial-gradient(ellipse 40% 40% at 25% 25%, #2a1a08 0%, transparent 50%)",
  final:     "radial-gradient(ellipse 90% 90% at 50% 50%, #220d40 0%, #03020a 50%), radial-gradient(ellipse 60% 60% at 50% 50%, #1a0830 0%, transparent 70%)",
};

/* Textos que flotan desde las hojas de los árboles */
const LEAF_TEXTS: Partial<Record<Phase, string[]>> = {
  formation: ["te vi", "y algo cambió", "sin avisar"],
  heartbeat: ["latido", "tuyo", "mío", "nuestro"],
  letter_1:  ["inteligente", "genuina", "especial", "única"],
  letter_2:  ["te siento", "cerca", "mi calma", "mi luz"],
  letter_3:  ["tu piel", "tu ser", "tu esencia", "te quiero"],
  letter_4:  ["Dios lo sabe", "fe", "futuro", "contigo"],
  final:     ["gracias", "Leyre", "siempre", "✦"],
};

function LeafTextParticles({ phase }: { phase: Phase }) {
  const [particles, setParticles] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const counterRef = useRef(0);
  const texts = LEAF_TEXTS[phase];

  useEffect(() => {
    if (!texts) return;
    const interval = setInterval(() => {
      const text = texts[Math.floor(Math.random() * texts.length)];
      const x = 5 + Math.random() * 90;
      const y = 60 + Math.random() * 30;
      const id = counterRef.current++;
      setParticles((prev: { id: number; text: string; x: number; y: number }[]) => [...prev.slice(-8), { id, text, x, y }]);
    }, 1800);
    return () => clearInterval(interval);
  }, [phase, texts]);

  return (
    <div className="fixed inset-0 z-5 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((p: { id: number; text: string; x: number; y: number }) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 0.9, 0.7, 0], y: -100, x: (Math.random() - 0.5) * 40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4.5, ease: "easeOut" }}
            className="leaf-text"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* Nebulosa de fondo */
function NebulaOverlay({ phase }: { phase: Phase }) {
  return (
    <AnimatePresence>
      {phase !== "void" && (
        <motion.div
          key="nebula"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 20% 30%, rgba(180,142,232,0.04) 0%, transparent 60%),
              radial-gradient(ellipse 50% 35% at 80% 70%, rgba(240,168,200,0.03) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 60% 20%, rgba(245,217,138,0.02) 0%, transparent 50%)
            `,
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* Pulso de latido */
function HeartbeatGlow({ phase }: { phase: Phase }) {
  const active = ["heartbeat","letter_1","letter_2","letter_3","letter_4","final"].includes(phase);
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="hb-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.14, 0.05] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.65, repeat: Infinity, ease: "easeInOut" }}
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(180,142,232,0.16) 0%, rgba(240,168,200,0.05) 40%, transparent 70%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* Brillo divino dorado */
function DivineGlow({ phase }: { phase: Phase }) {
  const active = ["letter_4","final","awakening"].includes(phase);
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="divine"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.03, 0.09, 0.03] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(245,217,138,0.15) 0%, transparent 70%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* Flash de transición entre fases */
function TransitionFlash({ phase }: { phase: Phase }) {
  return (
    <AnimatePresence>
      <motion.div
        key={phase + "-flash"}
        initial={{ opacity: 0.18 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="fixed inset-0 z-25 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(212,184,255,0.12) 0%, transparent 70%)",
        }}
      />
    </AnimatePresence>
  );
}

export default function Home() {
  const { phase, nextPhase } = useAnimationPhase();

  return (
    <main className="relative w-full min-h-screen overflow-hidden select-none">

      {/* Fondo base */}
      <motion.div
        className="fixed inset-0 z-0"
        animate={{ background: BG[phase as Phase] }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />

      {/* Viñeta */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, rgba(3,2,10,0.65) 70%, rgba(3,2,10,0.95) 100%)",
        }}
      />

      <NebulaOverlay phase={phase} />
      <HeartbeatGlow phase={phase} />
      <DivineGlow phase={phase} />
      <TransitionFlash phase={phase} />

      {/* Escena 3D */}
      <Scene3D phase={phase} />

      {/* Hojas con texto */}
      <LeafTextParticles phase={phase} />

      {/* Texto narrativo */}
      <div className="relative z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 1.0 }}
          >
            <NarrativeText phase={phase} />
          </motion.div>
        </AnimatePresence>
      </div>

      <TransitionController phase={phase} onNext={nextPhase} />

      {/* Marca discreta */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 4, duration: 2 }}
        className="fixed top-6 left-7 z-30 pointer-events-none"
      >
        <span className="font-body text-[0.6rem] tracking-[0.45em] uppercase" style={{ color: "#7a5aaa" }}>
          para leyre
        </span>
      </motion.div>

      {/* Fecha — solo en origin */}
      <AnimatePresence>
        {phase === "origin" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="fixed top-6 right-7 z-30 pointer-events-none"
          >
            <span className="font-body text-[0.6rem] tracking-[0.3em] uppercase" style={{ color: "#b48ee8" }}>
              17 · 03 · 2026
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
