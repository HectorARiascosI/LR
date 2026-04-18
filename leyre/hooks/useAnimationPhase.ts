"use client";
import { useState, useCallback } from "react";

export type Phase =
  | "void"
  | "awakening"
  | "origin"       // El 17 de marzo, 6:01am — el primer mensaje
  | "formation"
  | "heartbeat"
  | "letter_1"     // Carta: quién eres
  | "letter_2"     // Carta: lo que siento
  | "letter_3"     // Carta: lo que me das
  | "letter_4"     // Carta: el miedo que no tengo
  | "final";

const PHASE_ORDER: Phase[] = [
  "void",
  "awakening",
  "origin",
  "formation",
  "heartbeat",
  "letter_1",
  "letter_2",
  "letter_3",
  "letter_4",
  "final",
];

export function useAnimationPhase() {
  const [phase, setPhase] = useState<Phase>("void");

  const nextPhase = useCallback(() => {
    setPhase((current) => {
      const idx = PHASE_ORDER.indexOf(current);
      if (idx < PHASE_ORDER.length - 1) return PHASE_ORDER[idx + 1];
      return current;
    });
  }, []);

  const goToPhase = useCallback((p: Phase) => setPhase(p), []);

  return { phase, nextPhase, goToPhase, phaseIndex: PHASE_ORDER.indexOf };
}
