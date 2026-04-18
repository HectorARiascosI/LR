"use client";
import type { JSX } from "react";
import { motion } from "framer-motion";

interface Props {
  key?: React.Key;
  text: string;
  side: "sent" | "received";
  color: string;
  subtext?: string;
  variants: {
    initial: object;
    animate: object;
    exit: object;
    transition: object;
  };
}

export default function ChatBubble({ text, side, color, subtext, variants }: Props) {
  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={variants.transition}
      className={`flex flex-col max-w-[75%] ${side === "sent" ? "self-end items-end" : "self-start items-start"}`}
    >
      <div className={side === "sent" ? "chat-bubble-sent px-5 py-3" : "chat-bubble-received px-5 py-3"}>
        <p className={`font-body text-[clamp(0.9rem,2vw,1.05rem)] font-light leading-relaxed ${color}`}>
          {text}
        </p>
      </div>
      {subtext && (
        <span className="font-body text-[0.65rem] text-[#5a6080] mt-1 px-2 tracking-wide">
          {subtext}
        </span>
      )}
    </motion.div>
  );
}
