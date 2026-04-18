"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Phase } from "@/hooks/useAnimationPhase";

const PHASE_DURATIONS: Record<Phase, number> = {
  void:     5500,
  awakening: 6000,
  origin:   15000,
  formation: 5500,
  heartbeat: 4000,
  letter_1: 13000,
  letter_2: 14000,
  letter_3: 17000,
  letter_4: 17000,
  final:    0,
};

const PHASE_LABELS: Partial<Record<Phase, string>> = {
  void:      "inicio",
  awakening: "el despertar",
  origin:    "el origen",
  formation: "la formación",
  heartbeat: "el latido",
  letter_1:  "quién eres",
  letter_2:  "lo que siento",
  letter_3:  "lo que me das",
  letter_4:  "la confianza",
  final:     "un mes",
};

interface Props {
  phase: Phase;
  onNext: () => void;
}

export default function TransitionController({ phase, onNext }: Props) {
  const canAdvanceRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    canAdvanceRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    const duration = PHASE_DURATIONS[phase];
    if (duration === 0) {
      canAdvanceRef.current = true;
      return;
    }
    timerRef.current = setTimeout(() => {
      canAdvanceRef.current = true;
    }, duration);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["Space", "ArrowRight", "Enter"].includes(e.code) && canAdvanceRef.current) {
        e.preventDefault();
        onNext();
      }
    };
    const handleClick = () => {
      if (canAdvanceRef.current) onNext();
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("click", handleClick);
    };
  }, [onNext]);

  return (
    <>
      <CustomCursor />
      <PhaseIndicator phase={phase} />
      <ContinueHint phase={phase} duration={PHASE_DURATIONS[phase]} />
      <PhaseLabel phase={phase} label={PHASE_LABELS[phase]} />
    </>
  );
}

/* ── Hint de continuar ── */
function ContinueHint({ phase, duration }: { phase: Phase; duration: number }) {
  if (phase === "final") return null;
  return (
    <motion.div
      key={phase + "-hint"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: duration / 1000 + 0.8, duration: 1.2 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-[#b48ee8] to-transparent opacity-70" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#b48ee8] opacity-60" />
      </motion.div>
      <span
        className="font-body text-[0.65rem] tracking-[0.4em] uppercase text-[#7a5aaa] opacity-70"
      >
        toca para continuar
      </span>
    </motion.div>
  );
}

/* ── Indicador de fase (barra lateral) ── */
const ALL_PHASES: Phase[] = [
  "void", "awakening", "origin", "formation", "heartbeat",
  "letter_1", "letter_2", "letter_3", "letter_4", "final"
];

function PhaseIndicator({ phase }: { phase: Phase }) {
  const current = ALL_PHASES.indexOf(phase);
  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-[6px] pointer-events-none">
      {ALL_PHASES.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: i === current ? 20 : 4,
            opacity: i < current ? 0.8 : i === current ? 1 : 0.2,
            backgroundColor: i === current ? "#d4b8ff" : i < current ? "#7a5aaa" : "#2a1a4a",
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-[2px] rounded-full"
        />
      ))}
    </div>
  );
}

/* ── Label de fase actual ── */
function PhaseLabel({ phase, label }: { phase: Phase; label?: string }) {
  if (!label) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 0.35, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="fixed bottom-8 right-8 z-20 pointer-events-none"
      >
        <span className="font-body text-[0.6rem] tracking-[0.35em] uppercase text-[#7a5aaa]">
          {label}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Cursor personalizado ── */
function CustomCursor() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const posRef   = useRef({ x: -100, y: -100 });
  const trailPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);

    let raf: number;
    const tick = () => {
      trailPos.current.x += (posRef.current.x - trailPos.current.x) * 0.10;
      trailPos.current.y += (posRef.current.y - trailPos.current.y) * 0.10;

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${posRef.current.x - 3}px, ${posRef.current.y - 3}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${trailPos.current.x - 14}px, ${trailPos.current.y - 14}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Punto central */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full z-50 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #d4b8ff 0%, #b48ee8 100%)",
          boxShadow: "0 0 8px rgba(180,142,232,0.8), 0 0 16px rgba(180,142,232,0.4)",
          willChange: "transform",
        }}
      />
      {/* Anillo con trail */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-[28px] h-[28px] rounded-full z-50 pointer-events-none"
        style={{
          border: "1px solid rgba(180,142,232,0.5)",
          boxShadow: "0 0 12px rgba(180,142,232,0.2)",
          willChange: "transform",
        }}
      />
    </>
  );
}
