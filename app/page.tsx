"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";

const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
  loading: () => null,
});

// ─── MÚSICA ───────────────────────────────────────────────────────────────────
function usePianoMusic() {
  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const playingRef = useRef(false);
  const rafRef     = useRef<number>(0);
  const nextNoteAt = useRef(0);
  const noteIdx    = useRef(0);

  const MELODY = [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25];
  const PATTERN = [0, 2, 3, 5, 4, 2, 0, 3, 2, 5, 3, 0, 2, 4, 3, 1];

  const playNote = useCallback((freq: number, when: number, dur: number, vol = 0.1) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterRef.current) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 900;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(masterRef.current);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }, []);

  const schedule = useCallback(() => {
    if (!ctxRef.current || !playingRef.current) return;
    const ctx = ctxRef.current;
    while (nextNoteAt.current < ctx.currentTime + 0.1) {
      const idx = PATTERN[noteIdx.current % PATTERN.length];
      const freq = MELODY[idx];
      playNote(freq, nextNoteAt.current, 1.4, 0.09);
      if (noteIdx.current % 4 === 0) playNote(freq * 0.25, nextNoteAt.current, 2.2, 0.07);
      nextNoteAt.current += 0.42;
      noteIdx.current++;
    }
    rafRef.current = requestAnimationFrame(schedule);
  }, [MELODY, PATTERN, playNote]);

  const start = useCallback(() => {
    if (playingRef.current) return;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const master = ctxRef.current.createGain();
      master.gain.value = 0.55;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    playingRef.current = true;
    nextNoteAt.current = ctxRef.current.currentTime + 0.1;
    schedule();
  }, [schedule]);

  const stop = useCallback(() => {
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (masterRef.current) {
      masterRef.current.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime ?? 0) + 0.5);
      setTimeout(() => { if (masterRef.current) masterRef.current.gain.value = 0.55; }, 600);
    }
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) { stop(); return false; }
    else { start(); return true; }
  }, [start, stop]);

  return { toggle };
}

// ─── FADE IN ──────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── SECCIONES ────────────────────────────────────────────────────────────────
const SECTIONS = [
  null, // 0 — intro
  // 1
  <div key="1" className="text-block">
    <FadeIn><p className="t-caption">✦ &nbsp; para leyre &nbsp; ✦</p></FadeIn>
    <FadeIn delay={0.25}><h1 className="t-hero text-shimmer" style={{ marginTop: "0.8rem", marginBottom: "1rem" }}>Leyre</h1></FadeIn>
    <FadeIn delay={0.5}><p className="t-body">Hay momentos que Dios prepara<br />mucho antes de que los veas venir.</p></FadeIn>
    <FadeIn delay={0.8}><p className="t-jp" style={{ marginTop: "1rem" }}>運命 — destino</p></FadeIn>
  </div>,
  // 2
  <div key="2" className="text-block">
    <FadeIn><p className="t-caption c-lilac" style={{ marginBottom: "1.2rem" }}>17 de marzo · 6:01 am</p></FadeIn>
    <FadeIn delay={0.2}><p className="t-title c-white" style={{ marginBottom: "1.5rem" }}>Mientras el mundo dormía,<br /><span className="c-lilac glow-lilac">Dios movió algo.</span></p></FadeIn>
    <FadeIn delay={0.5}>
      <div className="bubble-wrap">
        <div className="bubble bubble-sent">Holaap<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Holaaaa 😊<div className="bubble-time">6:02 am</div></div>
        <div className="bubble bubble-sent">¿Cómo estás?</div>
        <div className="bubble bubble-recv">Con sueño 😴<div className="bubble-time">6:03 am</div></div>
      </div>
    </FadeIn>
    <FadeIn delay={0.9}><p className="t-verse" style={{ marginTop: "1.5rem" }}>Con sueño a las 6am.<br />Y aun así respondiste.</p></FadeIn>
  </div>,
  // 3
  <div key="3" className="text-block">
    <FadeIn><p className="t-caption c-sakura" style={{ marginBottom: "1rem" }}>花 — flor</p></FadeIn>
    <FadeIn delay={0.25}><h2 className="t-title c-white glow-white" style={{ marginBottom: "1.2rem" }}>Hay personas que Dios pone<br />en tu camino y sin hacer ruido,</h2></FadeIn>
    <FadeIn delay={0.55}><p className="t-hero c-lilac glow-lilac">lo reorganizan todo.</p></FadeIn>
    <FadeIn delay={0.85}><p className="t-body" style={{ marginTop: "1.2rem" }}>Como cuando alguien llega<br />y sin intentarlo,<br />lo cambia todo.</p></FadeIn>
  </div>,
  // 4
  <div key="4" className="text-block">
    <FadeIn><p className="t-hero text-shimmer">Un mes.</p></FadeIn>
    <FadeIn delay={0.3}><div className="divider" /></FadeIn>
    <FadeIn delay={0.5}><p className="t-title c-white" style={{ marginBottom: "1rem" }}>Treinta días que cambiaron<br />la forma en que veo las mañanas.</p></FadeIn>
    <FadeIn delay={0.85}><p className="t-body">Treinta días en los que<br />mi corazón aprendió tu nombre.</p></FadeIn>
  </div>,
  // 5
  <div key="5" className="text-block">
    <FadeIn><p className="t-caption c-lilac" style={{ marginBottom: "1rem" }}>sobre ti</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-white glow-white" style={{ marginBottom: "1rem" }}>Eres espectacular, Leyre.</h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">No lo digo porque sí. Lo digo porque lo veo.</p></FadeIn>
    <FadeIn delay={0.65}><div className="divider" /></FadeIn>
    <FadeIn delay={0.85}><p className="t-body">Eres de las personas que piensan antes de hablar.<br />Que cuidan lo que dicen porque saben que las palabras pesan.</p></FadeIn>
    <FadeIn delay={1.1}><p className="t-verse c-lilac glow-lilac" style={{ marginTop: "1rem" }}>Eso es raro. Y es tuyo.</p></FadeIn>
  </div>,
  // 6
  <div key="6" className="text-block">
    <FadeIn><p className="t-caption c-pink" style={{ marginBottom: "1rem" }}>lo que me haces sentir</p></FadeIn>
    <FadeIn delay={0.25}><h2 className="t-title c-pink glow-pink" style={{ marginBottom: "1rem" }}>Se me acelera el corazón<br />cada vez que sé que te voy a ver.</h2></FadeIn>
    <FadeIn delay={0.55}><p className="t-body">Cuando estás cerca,<br />hay algo en el aire que cambia.</p></FadeIn>
    <FadeIn delay={0.75}><div className="divider" /></FadeIn>
    <FadeIn delay={0.95}><p className="t-verse c-gold glow-gold">Tu presencia me hace brillar<br />más de lo que creía posible.</p></FadeIn>
    <FadeIn delay={1.3}><p className="t-body" style={{ marginTop: "1rem" }}>Contigo no tengo que calcular lo que digo.<br />Simplemente soy.</p></FadeIn>
  </div>,
  // 7
  <div key="7" className="text-block">
    <FadeIn><p className="t-caption c-sakura" style={{ marginBottom: "1rem" }}>lo que me das</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-white" style={{ marginBottom: "1rem" }}>Me encanta tu color de piel.</h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">Me encanta tu forma tan sencilla y genuina de ser.<br />Tu pensamiento. Tus decisiones. Cómo ves el mundo.</p></FadeIn>
    <FadeIn delay={0.9}><p className="t-verse c-lilac glow-lilac" style={{ marginTop: "1rem" }}>Me encanta sentir tu presencia.</p></FadeIn>
    <FadeIn delay={1.15}><p className="t-body" style={{ marginTop: "1rem" }}>Tu bondad es silenciosa.<br />No la anuncias. No la usas. Simplemente la tienes.</p></FadeIn>
  </div>,
  // 8
  <div key="8" className="text-block">
    <FadeIn><p className="t-caption c-gold" style={{ marginBottom: "1rem" }}>fe y futuro</p></FadeIn>
    <FadeIn delay={0.25}><h2 className="t-title c-gold glow-gold" style={{ marginBottom: "1rem" }}>Dios sabe lo que hace.</h2></FadeIn>
    <FadeIn delay={0.5}><p className="t-body">Y creo que esto — lo que hay entre tú y yo —<br />no es casualidad.</p></FadeIn>
    <FadeIn delay={0.75}><div className="divider" /></FadeIn>
    <FadeIn delay={0.95}><p className="t-title c-white glow-white">Eres la mujer con la que<br />quiero tener mis hijos algún día.</p></FadeIn>
    <FadeIn delay={1.3}><p className="t-body" style={{ marginTop: "1rem" }}>Lo digo con el corazón. Sin miedo.</p></FadeIn>
    <FadeIn delay={1.65}><p className="t-verse c-gold glow-gold" style={{ marginTop: "1rem" }}>«El amor es sufrido, es benigno;<br />el amor no tiene envidia.»<br /><span className="t-caption" style={{ color: "rgba(255,255,255,0.4)" }}>— 1 Corintios 13:4</span></p></FadeIn>
  </div>,
  // 9
  <div key="9" className="text-block">
    <FadeIn><p className="t-caption" style={{ marginBottom: "1rem" }}>✦ &nbsp; un mes &nbsp; ✦</p></FadeIn>
    <FadeIn delay={0.25}><h1 className="t-hero text-shimmer" style={{ marginBottom: "1.2rem" }}>Gracias,<br />Leyre.</h1></FadeIn>
    <FadeIn delay={0.55}><p className="t-body">Por llegar con sueño y quedarte despierta.<br />Por ser exactamente como eres.<br />Por dejarme conocerte.</p></FadeIn>
    <FadeIn delay={0.85}><div className="divider" /></FadeIn>
    <FadeIn delay={1.05}><p className="t-verse c-pink glow-pink">Esto apenas comienza.</p></FadeIn>
    <FadeIn delay={1.4}><p className="t-jp c-gold glow-gold" style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>✦ &nbsp; te quiero &nbsp; ✦</p></FadeIn>
  </div>,
];

// ─── CURSOR ───────────────────────────────────────────────────────────────────
function CustomCursor() {
  useEffect(() => {
    const dot  = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    let mx = -100, my = -100, rx = -100, ry = -100;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const tick = () => {
      rx += (mx - rx) * 0.11; ry += (my - ry) * 0.11;
      dot.style.transform  = `translate(${mx - 3}px, ${my - 3}px)`;
      ring.style.transform = `translate(${rx - 14}px, ${ry - 14}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
}

// ─── PÁGINA ───────────────────────────────────────────────────────────────────
export default function Home() {
  const scrollRef = useRef<number>(0);
  const [section, setSection] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const { toggle } = usePianoMusic();

  useEffect(() => {
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let rafId: number;
    const init = async () => {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true }) as unknown as { raf: (t: number) => void; destroy: () => void };
      const animate = (time: number) => { lenis!.raf(time); rafId = requestAnimationFrame(animate); };
      rafId = requestAnimationFrame(animate);
      const onScroll = () => {
        const el = document.documentElement;
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
        scrollRef.current = progress;
        const sec = Math.min(Math.floor(progress * SECTIONS.length), SECTIONS.length - 1);
        setSection(sec);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId); };
    };
    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); lenis?.destroy(); };
  }, []);

  const handleAudio = () => {
    const on = toggle();
    setMusicOn(on);
  };

  // section usado para futura expansión
  void section;

  return (
    <>
      {/* Canvas 3D — shader nebulosa + partículas morphing */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <SceneCanvas scrollProgress={scrollRef as React.RefObject<number>} />
      </div>

      {/* Cursor */}
      <div id="cursor-dot" />
      <div id="cursor-ring" />
      <CustomCursor />

      {/* Label */}
      <div id="site-label">para leyre · 2026</div>

      {/* Audio */}
      <button id="audio-btn" onClick={handleAudio} title={musicOn ? "Silenciar" : "Música"}>
        {musicOn ? "♪" : "♩"}
      </button>

      {/* Progress */}
      <div id="progress-bar">
        {SECTIONS.map((_, i) => (
          <div key={i} className={`progress-dot${section === i ? " active" : ""}`} />
        ))}
      </div>

      {/* Scroll content */}
      <div id="scroll-root">
        {SECTIONS.map((content, i) => (
          <section key={i} className="scene-section" style={{ minHeight: i === 0 ? "100vh" : "130vh" }}>
            {content}
          </section>
        ))}
      </div>
    </>
  );
}
