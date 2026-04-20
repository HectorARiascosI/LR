"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Phase } from "@/hooks/useAnimationPhase";
import ChatBubble from "./ChatBubble";

type TextRole = "hero"|"title"|"body"|"caption"|"accent"|"timestamp"|"chat"|"number"|"verse"|"divine";
type TextColor = "lilac"|"pink"|"silver"|"cream"|"dim"|"shimmer"|"gold"|"forest";

interface Block {
  text: string; role?: TextRole; color?: TextColor;
  style?: "normal"|"italic"; delay?: number;
  align?: "left"|"center"|"right";
  chatSide?: "sent"|"received"; subtext?: string; highlight?: boolean;
  emoji?: string;
}

const CONTENT: Record<Phase, Block[]> = {
  void: [
    { text: "Leyre", role: "hero", color: "shimmer", delay: 1.2 },
    { text: "✦  para ti  ✦", role: "caption", color: "gold", delay: 3.0 },
    { text: "esto no es solo un regalo.", role: "accent", color: "lilac", style: "italic", delay: 4.5 },
    { text: "Es un universo que construí para ti.", role: "caption", color: "dim", delay: 6.2 },
  ],
  awakening: [
    { text: "Hay momentos que Dios prepara\nmucho antes de que los veas venir.", role: "title", color: "silver", delay: 0.5 },
    { text: "Momentos que no anuncias.", role: "accent", color: "lilac", style: "italic", delay: 2.8 },
    { text: "Que simplemente ocurren.", role: "accent", color: "pink", style: "italic", delay: 4.2 },
    { text: "Y cuando los miras hacia atrás,\nentiendes que Él ya lo sabía.", role: "body", color: "dim", delay: 5.8 },
    { text: "✦", role: "caption", color: "gold", delay: 7.5 },
  ],
  origin: [
    { text: "17 de marzo de 2026", role: "number", color: "lilac", delay: 0.3 },
    { text: "6:01 de la mañana", role: "timestamp", color: "pink", delay: 1.5 },
    { text: "Mientras el mundo dormía,\nDios movió algo.", role: "caption", color: "dim", delay: 3.0 },
    { text: "Holaap", role: "chat", chatSide: "sent", color: "lilac", delay: 5.0, subtext: "6:01 am" },
    { text: "Holaaaa", role: "chat", chatSide: "received", color: "pink", delay: 6.6, subtext: "6:02 am" },
    { text: "Como estás?", role: "chat", chatSide: "sent", color: "lilac", delay: 8.0 },
    { text: "Con sueño 😴", role: "chat", chatSide: "received", color: "pink", delay: 9.4, subtext: "6:03 am" },
    { text: "Con sueño a las 6am.\nY aun así respondiste.", role: "accent", color: "silver", style: "italic", delay: 11.4 },
    { text: "Eso ya me dijo todo de ti.", role: "caption", color: "gold", delay: 13.2 },
  ],
  formation: [
    { text: "Hay personas que Dios pone en tu camino\ny sin hacer ruido,", role: "title", color: "silver", delay: 0.4 },
    { text: "lo reorganizan todo.", role: "hero", color: "lilac", delay: 2.4 },
    { text: "Tú eres de esas.", role: "accent", color: "pink", style: "italic", delay: 4.2 },
    { text: "Como Merlin ante Escanor —\nuna presencia que lo cambia todo\nsin siquiera intentarlo.", role: "body", color: "dim", delay: 5.8 },
  ],
  heartbeat: [
    { text: "Un mes.", role: "hero", color: "shimmer", delay: 0.6 },
    { text: "Treinta días que cambiaron\nla forma en que veo las mañanas.", role: "accent", color: "lilac", style: "italic", delay: 2.6 },
    { text: "Treinta días en los que\nmi corazón aprendió tu nombre.", role: "body", color: "dim", delay: 4.8 },
  ],
  letter_1: [
    { text: "Sobre ti", role: "caption", color: "dim", delay: 0.2 },
    { text: "Eres espectacular, Leyre.", role: "title", color: "shimmer", delay: 1.0, highlight: true },
    { text: "No lo digo porque sí.\nLo digo porque lo veo.", role: "body", color: "cream", delay: 2.8 },
    { text: "Eres de las personas que piensan\nantes de hablar.", role: "title", color: "silver", delay: 4.6 },
    { text: "Que cuidan lo que dicen\nporque saben que las palabras pesan.", role: "body", color: "cream", delay: 6.4 },
    { text: "Eso es raro. Y es tuyo.", role: "accent", color: "lilac", style: "italic", delay: 8.6 },
    { text: "Tu inteligencia no es la que presume.\nEs la que resuelve, la que escucha,\nla que entiende sin que le expliquen dos veces.", role: "body", color: "dim", delay: 10.4 },
    { text: "Eso, Leyre, es lo que más admiro de ti.", role: "accent", color: "gold", style: "italic", delay: 13.2 },
  ],
  letter_2: [
    { text: "Lo que me haces sentir", role: "caption", color: "dim", delay: 0.2 },
    { text: "Se me acelera el corazón\ncada vez que sé que te voy a ver.", role: "title", color: "pink", delay: 1.0, highlight: true },
    { text: "Cuando estás cerca,\nhay algo en el aire que cambia.", role: "body", color: "cream", delay: 3.2 },
    { text: "Como Escanor al sol —\ntu presencia me hace brillar\nmás de lo que creía posible.", role: "verse", color: "gold", style: "italic", delay: 5.4 },
    { text: "Contigo no tengo que calcular\nlo que digo.", role: "title", color: "silver", delay: 8.0 },
    { text: "Simplemente soy.", role: "hero", color: "lilac", delay: 10.2 },
    { text: "Me das calma.\nY al mismo tiempo me despiertas.", role: "accent", color: "pink", style: "italic", delay: 12.0 },
  ],
  letter_3: [
    { text: "Lo que me das", role: "caption", color: "dim", delay: 0.2 },
    { text: "Me encanta tu color de piel.", role: "title", color: "pink", delay: 1.0, highlight: true },
    { text: "Me encanta tu forma tan sencilla\ny genuina de ser.", role: "body", color: "cream", delay: 2.8 },
    { text: "Tu pensamiento. Tus decisiones.\nCómo ves el mundo.", role: "body", color: "silver", delay: 4.8 },
    { text: "Me encanta sentir tu presencia.", role: "accent", color: "lilac", style: "italic", delay: 6.8 },
    { text: "Tu bondad es silenciosa.", role: "accent", color: "gold", style: "italic", delay: 8.6 },
    { text: "No la anuncias. No la usas.\nSimplemente la tienes,\ny se nota en cada cosa pequeña que haces.", role: "body", color: "dim", delay: 10.2 },
    { text: "Eso no se aprende.\nSe tiene o no se tiene.", role: "accent", color: "pink", style: "italic", delay: 13.0 },
    { text: "Tú lo tienes.", role: "title", color: "shimmer", delay: 14.8 },
  ],
  letter_4: [
    { text: "Fe y futuro", role: "caption", color: "gold", delay: 0.2 },
    { text: "Dios sabe lo que hace.", role: "title", color: "silver", delay: 1.0, highlight: true },
    { text: "Y creo que esto —\nlo que hay entre tú y yo —\nno es casualidad.", role: "body", color: "cream", delay: 2.8 },
    { text: "Eres la mujer con la que\nquiero tener mis hijos algún día.", role: "divine", color: "gold", delay: 5.2 },
    { text: "Lo digo con el corazón.\nSin miedo.", role: "body", color: "dim", delay: 7.8 },
    { text: "Contigo no tengo miedo.", role: "title", color: "lilac", delay: 9.4 },
    { text: "No tengo miedo de equivocarme.\nNo tengo miedo de que me veas.\nNo tengo miedo de querer.", role: "body", color: "cream", delay: 11.2 },
    { text: "Eso lo hiciste tú.", role: "accent", color: "pink", style: "italic", delay: 14.0 },
    { text: "Y lo es.", role: "hero", color: "shimmer", delay: 15.8 },
  ],
  final: [
    { text: "Un mes.", role: "number", color: "lilac", delay: 0.4 },
    { text: "Treinta días desde aquel\n\"Holaap\" a las 6 de la mañana.", role: "body", color: "dim", delay: 1.8 },
    { text: "Gracias, Leyre.", role: "hero", color: "shimmer", delay: 4.2 },
    { text: "Por llegar con sueño y quedarte despierta.\nPor ser exactamente como eres.\nPor dejarme conocerte.", role: "body", color: "cream", delay: 6.4 },
    { text: "«El amor es sufrido, es benigno;\nel amor no tiene envidia.»\n— 1 Corintios 13:4", role: "verse", color: "gold", style: "italic", delay: 9.6 },
    { text: "Esto apenas comienza.", role: "accent", color: "pink", style: "italic", delay: 13.0 },
    { text: "✦  te quiero  ✦", role: "caption", color: "gold", delay: 15.0 },
  ],
};

function rc(role: TextRole): string {
  switch (role) {
    case "hero":    return "font-display text-[clamp(3.5rem,10vw,8rem)] font-light tracking-tight leading-none";
    case "title":   return "font-display text-[clamp(1.6rem,4vw,3rem)] font-light leading-tight";
    case "accent":  return "font-display text-[clamp(1.3rem,3.5vw,2.2rem)] font-light leading-relaxed";
    case "verse":   return "font-display text-[clamp(1.1rem,2.5vw,1.7rem)] font-light leading-loose italic";
    case "divine":  return "font-display text-[clamp(1.5rem,4vw,2.8rem)] font-light leading-tight";
    case "body":    return "font-body text-[clamp(0.95rem,2vw,1.2rem)] font-light leading-[1.9] tracking-wide";
    case "caption": return "font-body text-[clamp(0.7rem,1.5vw,0.85rem)] font-light tracking-[0.35em] uppercase";
    case "timestamp": return "font-body text-[clamp(1rem,2.5vw,1.4rem)] font-light tracking-[0.3em]";
    case "number":  return "font-display text-[clamp(4rem,12vw,10rem)] font-thin italic leading-none";
    default:        return "font-body text-base font-light";
  }
}

function cc(color: TextColor, role: TextRole): string {
  const big = role === "hero" || role === "number" || role === "title" || role === "divine";
  switch (color) {
    case "shimmer": return "text-shimmer";
    case "lilac":   return big ? "text-[#d4b8ff] glow-lilac" : "text-[#c4a8f0] glow-lilac";
    case "pink":    return big ? "text-[#ffcce0] glow-pink"  : "text-[#f0b8d0] glow-pink";
    case "silver":  return big ? "text-[#e8ecf4] glow-silver" : "text-[#c8cdd8]";
    case "cream":   return "text-[#f0ebe4] text-readable";
    case "dim":     return "text-[#8a90a8] text-readable";
    case "gold":    return "text-[#f5d98a] glow-gold";
    case "forest":  return "text-[#7ecb8a] glow-forest";
    default:        return "text-[#c4a8f0]";
  }
}

function getV(role: TextRole) {
  switch (role) {
    case "hero": case "number":
      return {
        initial: { opacity: 0, scale: 0.88, filter: "blur(20px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 1.04, filter: "blur(8px)" },
        transition: { duration: 1.8, ease: [0.16,1,0.3,1] as const }
      };
    case "divine":
      return {
        initial: { opacity: 0, y: 20, filter: "blur(16px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -10, filter: "blur(8px)" },
        transition: { duration: 2.0, ease: [0.16,1,0.3,1] as const }
      };
    case "verse":
      return {
        initial: { opacity: 0, x: 20, filter: "blur(10px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -10 },
        transition: { duration: 1.6, ease: [0.25,0.1,0.25,1] as const }
      };
    case "title":
      return {
        initial: { opacity: 0, y: 30, filter: "blur(12px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -15, filter: "blur(6px)" },
        transition: { duration: 1.4, ease: [0.25,0.1,0.25,1] as const }
      };
    case "accent":
      return {
        initial: { opacity: 0, x: -20, filter: "blur(8px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: 10, filter: "blur(4px)" },
        transition: { duration: 1.2, ease: [0.25,0.1,0.25,1] as const }
      };
    case "chat":
      return {
        initial: { opacity: 0, scale: 0.92, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.6, ease: [0.34,1.56,0.64,1] as const }
      };
    default:
      return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 1.0, ease: "easeOut" as const }
      };
  }
}

export default function NarrativeText({ phase }: { phase: Phase }) {
  const [visible, setVisible] = useState<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisible([]);
    CONTENT[phase].forEach((b, i) => {
      timers.current.push(setTimeout(() => {
        setVisible((prev: number[]) => [...prev, i]);
      }, (b.delay ?? 0) * 1000));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [phase]);

  const blocks = CONTENT[phase];
  const isOrigin = phase === "origin";
  const isLetter = phase.startsWith("letter_") || phase === "final";

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`relative w-full max-w-2xl mx-auto ${
            isOrigin
              ? "flex flex-col items-center gap-3"
              : "flex flex-col items-center gap-6 text-center"
          }`}
        >
          {isLetter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 -mx-8 -my-12 rounded-3xl glass-card pointer-events-none"
            />
          )}
          {blocks.map((block, i) => {
            if (!visible.includes(i)) return null;
            const role = block.role ?? "body";
            const v = getV(role);
            const rClass = rc(role);
            const cClass = cc(block.color ?? "cream", role);
            const sClass = block.style === "italic" ? "italic" : "";
            const aClass =
              block.align === "left" ? "text-left self-start" :
              block.align === "right" ? "text-right self-end" :
              "text-center";

            if (role === "chat") {
              return (
                <ChatBubble
                  key={i}
                  text={block.text}
                  side={block.chatSide ?? "sent"}
                  color={cClass}
                  subtext={block.subtext}
                  variants={v}
                />
              );
            }

            if (role === "verse") {
              return (
                <motion.div
                  key={i}
                  initial={v.initial}
                  animate={v.animate}
                  exit={v.exit}
                  transition={v.transition}
                  className="relative w-full text-center"
                >
                  <div className="divider-glow w-24 mx-auto mb-4 opacity-60" />
                  <p className={`${rClass} ${cClass} ${sClass} whitespace-pre-line`}>
                    {block.text}
                  </p>
                  <div className="divider-glow w-24 mx-auto mt-4 opacity-60" />
                </motion.div>
              );
            }

            return (
              <motion.p
                key={i}
                initial={v.initial}
                animate={v.animate}
                exit={v.exit}
                transition={v.transition}
                className={`${rClass} ${cClass} ${sClass} ${aClass} whitespace-pre-line w-full ${
                  block.highlight ? "glass-card rounded-2xl px-8 py-6" : ""
                }`}
              >
                {block.text}
              </motion.p>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
