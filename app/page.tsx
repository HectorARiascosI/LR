"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const CosmosWorld = dynamic(() => import("@/components/CosmosWorld"), {
  ssr: false,
  loading: () => null,
});

// ─── CONTENIDO POR OBJETO ─────────────────────────────────────────────────────
const OBJECT_CONTENT: Record<string, { title: string; body: string; color: string }> = {
  heart: {
    title: "Te quiero",
    body: "Se me acelera el corazón cada vez que sé que te voy a ver.\nContigo no tengo que calcular lo que digo. Simplemente soy.",
    color: "#ff6090",
  },
  envelope: {
    title: "17 de marzo · 6:01 am",
    body: "Mientras el mundo dormía, Dios movió algo.\nMe escribiste con sueño a las 6am. Y aun así respondiste.",
    color: "#d4b8ff",
  },
  flower: {
    title: "Eres espectacular",
    body: "Hay personas que Dios pone en tu camino y sin hacer ruido, lo reorganizan todo.\nEso eres tú, Leyre.",
    color: "#ffb8d4",
  },
  star: {
    title: "Dios sabe lo que hace",
    body: "Creo que esto no es casualidad.\nEres la mujer con la que quiero tener mis hijos algún día.\nLo digo con el corazón. Sin miedo.",
    color: "#f5d98a",
  },
};

// ─── MODAL DE OBJETO ──────────────────────────────────────────────────────────
function ObjectModal({ id, onClose }: { id: string; onClose: () => void }) {
  const content = OBJECT_CONTENT[id];
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 10 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          background: "rgba(3, 1, 15, 0.92)",
          border: `1px solid ${content.color}33`,
          borderRadius: "20px",
          padding: "2.5rem 3rem",
          maxWidth: "520px",
          width: "100%",
          boxShadow: `0 0 60px ${content.color}22, 0 0 0 1px ${content.color}11`,
          textAlign: "center",
          backdropFilter: "blur(20px)",
        }}
      >
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 300,
          color: content.color,
          textShadow: `0 0 30px ${content.color}99`,
          marginBottom: "1.2rem",
          lineHeight: 1.1,
        }}>
          {content.title}
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)",
          fontWeight: 300,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.9,
          whiteSpace: "pre-line",
        }}>
          {content.body}
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: "2rem",
            background: "transparent",
            border: `1px solid ${content.color}55`,
            borderRadius: "50px",
            padding: "0.5rem 1.8rem",
            color: content.color,
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          cerrar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── INTRO OVERLAY ────────────────────────────────────────────────────────────
function IntroOverlay({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#03010f",
        cursor: "pointer",
      }}
      onClick={onEnter}
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "rgba(180,142,232,0.5)",
          marginBottom: "1.5rem",
        }}
      >
        ✦ &nbsp; para leyre &nbsp; ✦
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(4rem, 14vw, 9rem)",
          fontWeight: 300,
          lineHeight: 0.9,
          background: "linear-gradient(135deg, #b48ee8 0%, #ffb8d4 40%, #f5d98a 70%, #d4b8ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "2.5rem",
          textAlign: "center",
        }}
      >
        Leyre
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
        transition={{ delay: 1.8, duration: 2, repeat: Infinity }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.62rem",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        toca para entrar
      </motion.p>
    </motion.div>
  );
}

// ─── HINT OBJETOS ─────────────────────────────────────────────────────────────
function ObjectHints() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1.5 }}
      style={{
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <motion.p
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "rgba(212,184,255,0.5)",
        }}
      >
        toca los objetos
      </motion.p>
    </motion.div>
  );
}

// ─── PÁGINA ───────────────────────────────────────────────────────────────────
export default function Home() {
  const scrollRef = useRef<number>(0);
  const [entered, setEntered] = useState(false);
  const [activeObject, setActiveObject] = useState<string | null>(null);

  useEffect(() => {
    if (!entered) return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let rafId: number;
    const init = async () => {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true }) as unknown as { raf: (t: number) => void; destroy: () => void };
      const animate = (time: number) => { lenis!.raf(time); rafId = requestAnimationFrame(animate); };
      rafId = requestAnimationFrame(animate);
      const onScroll = () => {
        const el = document.documentElement;
        scrollRef.current = el.scrollTop / (el.scrollHeight - el.clientHeight);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId); };
    };
    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); lenis?.destroy(); };
  }, [entered]);

  return (
    <>
      {/* Canvas 3D */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        {entered && (
          <CosmosWorld
            scrollRef={scrollRef as React.RefObject<number>}
            onObjectClick={(id: string) => setActiveObject(id)}
            activeObject={activeObject}
          />
        )}
      </div>

      {/* Intro */}
      <AnimatePresence>
        {!entered && <IntroOverlay onEnter={() => setEntered(true)} />}
      </AnimatePresence>

      {/* Modal objeto */}
      <AnimatePresence>
        {activeObject && (
          <ObjectModal id={activeObject} onClose={() => setActiveObject(null)} />
        )}
      </AnimatePresence>

      {/* Hint */}
      {entered && !activeObject && <ObjectHints />}

      {/* Label */}
      {entered && (
        <div style={{
          position: "fixed", top: "1.4rem", left: "1.4rem",
          zIndex: 100, fontFamily: "'Inter', sans-serif",
          fontSize: "0.58rem", letterSpacing: "0.42em",
          textTransform: "uppercase", color: "rgba(180,142,232,0.4)",
          pointerEvents: "none",
        }}>
          para leyre · 2026
        </div>
      )}

      {/* Scroll space */}
      <div style={{ height: "500vh", position: "relative", zIndex: 10, pointerEvents: "none" }} />
    </>
  );
}
