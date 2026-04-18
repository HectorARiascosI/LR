"use client";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import NarrativeText from "@/components/NarrativeText";
import TransitionController from "@/components/TransitionController";
import { useAnimationPhase } from "@/hooks/useAnimationPhase";
import type { Phase } from "@/hooks/useAnimationPhase";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => null,
});

/* Gradientes de fondo por fase — más elaborados */
const BG: Record<Phase, string> = {
  void:
    "radial-gradient(ellipse 80% 60% at 50% 50%, #0d0520 0%, #03020a 100%)",
  awakening:
    "radial-gradient(ellipse 100% 70% at 35% 55%, #160830 0%, #03020a 70%)",
  origin:
    "radial-gradient(ellipse 90% 60% at 50% 40%, #0e0525 0%, #03020a 65%), radial-gradient(ellipse 40% 40% at 70% 70%, #1a0830 0%, transparent 60%)",
  formation:
    "radial-gradient(ellipse 110% 80% at 50% 50%, #1a0a35 0%, #03020a 60%)",
  heartbeat:
    "radial-gradient(ellipse 80% 80% at 50% 50%, #220d40 0%, #03020a 55%)",
  letter_1:
    "radial-gradient(ellipse 100% 70% at 50% 50%, #180a30 0%, #03020a 60%), radial-gradient(ellipse 50% 50% at 80% 20%, #2a0a20 0%, transparent 50%)",
  letter_2:
    "radial-gradient(ellipse 100% 70% at 50% 50%, #1a0830 0%, #03020a 60%), radial-gradient(ellipse 40% 40% at 20% 80%, #200a28 0%, transparent 50%)",
  letter_3:
    "radial-gradient(ellipse 100% 70% at 50% 50%, #1c0a32 0%, #03020a 60%), radial-gradient(ellipse 50% 50% at 75% 75%, #280a1a 0%, transparent 50%)",
  letter_4:
    "radial-gradient(ellipse 100% 70% at 50% 50%, #1e0c38 0%, #03020a 60%), radial-gradient(ellipse 40% 40% at 25% 25%, #2a0a22 0%, transparent 50%)",
  final:
    "radial-gradient(ellipse 90% 90% at 50% 50%, #220d40 0%, #03020a 50%), radial-gradient(ellipse 60% 60% at 50% 50%, #1a0830 0%, transparent 70%)",
};

/* Overlay de nebulosa — capa adicional de profundidad */
function NebulaOverlay({ phase }: { phase: Phase }) {
  const showNebula = phase !== "void";
  return (
    <AnimatePresence>
      {showNebula && (
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
              radial-gradient(ellipse 40% 30% at 60% 20%, rgba(180,142,232,0.03) 0%, transparent 50%)
            `,
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* Pulso de latido — solo en fases de corazón */
function HeartbeatGlow({ phase }: { phase: Phase }) {
  const active = ["heartbeat", "letter_1", "letter_2", "letter_3", "letter_4", "final"].includes(phase);
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="hb-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.06, 0.16, 0.06] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.65, repeat: Infinity, ease: "easeInOut" }}
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(180,142,232,0.18) 0%, rgba(240,168,200,0.06) 40%, transparent 70%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* Flash de formación */
function FormationFlash({ phase }: { phase: Phase }) {
  return (
    <AnimatePresence>
      {phase === "heartbeat" && (
        <motion.div
          key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.22, 0] }}
          transition={{ duration: 2.2, times: [0, 0.25, 1] }}
          className="fixed inset-0 z-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,184,255,0.35) 0%, rgba(240,168,200,0.15) 40%, transparent 70%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* Separador decorativo entre secciones de carta */
function LetterDivider({ phase }: { phase: Phase }) {
  const isLetter = phase.startsWith("letter_");
  return (
    <AnimatePresence>
      {isLetter && (
        <motion.div
          key={phase + "-div"}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed top-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: "1px", transformOrigin: "center" }}
        >
          <div className="divider-glow w-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  const { phase, nextPhase } = useAnimationPhase();

  return (
    <main className="relative w-full min-h-screen overflow-hidden select-none">

      {/* ── Fondo base animado ── */}
      <motion.div
        className="fixed inset-0 z-0"
        animate={{ background: BG[phase as Phase] }}
        transition={{ duration: 2.8, ease: "easeInOut" }}
      />

      {/* ── Viñeta perimetral fuerte ── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, rgba(3,2,10,0.7) 70%, rgba(3,2,10,0.95) 100%)",
        }}
      />

      {/* ── Capas de profundidad ── */}
      <NebulaOverlay phase={phase} />
      <HeartbeatGlow phase={phase} />
      <FormationFlash phase={phase} />
      <LetterDivider phase={phase} />

      {/* ── Escena 3D ── */}
      <Scene3D phase={phase} />

      {/* ── Texto narrativo — z-index alto con fondo propio ── */}
      <div className="relative z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          >
            <NarrativeText phase={phase} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── UI de control ── */}
      <TransitionController phase={phase} onNext={nextPhase} />

      {/* ── Marca discreta ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 4, duration: 2 }}
        className="fixed top-6 left-7 z-30 pointer-events-none"
      >
        <span
          className="font-body text-[0.6rem] tracking-[0.45em] uppercase"
          style={{ color: "#7a5aaa" }}
        >
          para leyre
        </span>
      </motion.div>

      {/* ── Fecha discreta — solo en fase origin ── */}
      <AnimatePresence>
        {phase === "origin" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="fixed top-6 right-7 z-30 pointer-events-none"
          >
            <span
              className="font-body text-[0.6rem] tracking-[0.3em] uppercase"
              style={{ color: "#b48ee8" }}
            >
              17 · 03 · 2026
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
