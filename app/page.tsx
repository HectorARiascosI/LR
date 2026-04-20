"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";

const World3D = dynamic(() => import("@/components/World3D"), {
  ssr: false,
  loading: () => null,
});

// ─── MÚSICA PROCEDURAL — Piano suave con Web Audio API ────────────────────────
function usePianoMusic() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const gainRef   = useRef<GainNode | null>(null);
  const playingRef = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escala pentatónica menor — suena melancólica y hermosa
  const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  const playNote = useCallback((freq: number, time: number, dur: number) => {
    const ctx = ctxRef.current;
    if (!ctx || !gainRef.current) return;

    const osc  = ctx.createOscillator();
    const env  = ctx.createGain();
    const filt = ctx.createBiquadFilter();

    filt.type = "lowpass";
    filt.frequency.value = 1200;

    osc.type = "triangle";
    osc.frequency.value = freq;

    // Envelope suave tipo piano
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.12, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filt);
    filt.connect(env);
    env.connect(gainRef.current);

    osc.start(time);
    osc.stop(time + dur + 0.1);
  }, []);

  const playPhrase = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;

    const now = ctx.currentTime;
    // Melodía aleatoria pero armónica
    const phrase = [0, 2, 4, 7, 4, 2, 0, 4, 2, 7, 4, 0];
    const octave = Math.random() > 0.5 ? 1 : 0.5;

    phrase.forEach((idx, i) => {
      const freq = notes[idx % notes.length] * octave;
      const jitter = (Math.random() - 0.5) * 0.05;
      playNote(freq, now + i * 0.38 + jitter, 1.2);
    });

    // Bajo suave
    [0, 4, 7].forEach((idx, i) => {
      playNote(notes[idx % notes.length] * 0.25, now + i * 1.5, 2.5);
    });

    // Siguiente frase en ~5 segundos
    timerRef.current = setTimeout(playPhrase, 5200);
  }, [notes, playNote]);

  const start = useCallback(() => {
    if (playingRef.current) return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      const master = ctxRef.current.createGain();
      master.gain.value = 0.5;
      master.connect(ctxRef.current.destination);
      gainRef.current = master;
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    playingRef.current = true;
    playPhrase();
  }, [playPhrase]);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (gainRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime ?? 0) + 0.5);
    }
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) stop();
    else start();
    return !playingRef.current;
  }, [start, stop]);

  return { toggle, isPlaying: () => playingRef.current };
}

// ─── FADE IN ──────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SECCIONES ────────────────────────────────────────────────────────────────
const SECTIONS = [
  // 0 — intro vacía (solo 3D)
  null,

  // 1 — awakening
  <div key="awakening" className="text-block">
    <FadeIn><p className="t-caption" style={{ marginBottom: "1.2rem" }}>✦ &nbsp; para leyre &nbsp; ✦</p></FadeIn>
    <FadeIn delay={0.25}><h1 className="t-hero text-shimmer" style={{ marginBottom: "1.4rem" }}>Leyre</h1></FadeIn>
    <FadeIn delay={0.5}>
      <p className="t-body">
        Hay momentos que Dios prepara<br />
        mucho antes de que los veas venir.
      </p>
    </FadeIn>
    <FadeIn delay={0.8}><p className="t-jp" style={{ marginTop: "1.2rem" }}>運命 — destino</p></FadeIn>
  </div>,

  // 2 — origin
  <div key="origin" className="text-block">
    <FadeIn><p className="t-caption c-lilac" style={{ marginBottom: "1.5rem" }}>17 de marzo · 6:01 am</p></FadeIn>
    <FadeIn delay={0.2}>
      <p className="t-title c-white" style={{ marginBottom: "1.8rem" }}>
        Mientras el mundo dormía,<br />
        <span className="c-lilac glow-lilac">Dios movió algo.</span>
      </p>
    </FadeIn>
    <FadeIn delay={0.5}>
      <div className="bubble-wrap">
        <div className="bubble bubble-sent">Holaap<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Holaaaa 😊<div className="bubble-time">6:02 am</div></div>
        <div className="bubble bubble-sent">¿Cómo estás?</div>
        <div className="bubble bubble-recv">Con sueño 😴<div className="bubble-time">6:03 am</div></div>
      </div>
    </FadeIn>
    <FadeIn delay={0.9}>
      <p className="t-verse" style={{ marginTop: "1.8rem" }}>
        Con sueño a las 6am.<br />Y aun así respondiste.
      </p>
    </FadeIn>
  </div>,

  // 3 — formation
  <div key="formation" className="text-block">
    <FadeIn><p className="t-caption c-sakura" style={{ marginBottom: "1.2rem" }}>花 — flor</p></FadeIn>
    <FadeIn delay={0.25}>
      <h2 className="t-title c-white glow-white" style={{ marginBottom: "1.4rem" }}>
        Hay personas que Dios pone<br />en tu camino y sin hacer ruido,
      </h2>
    </FadeIn>
    <FadeIn delay={0.55}>
      <p className="t-hero c-lilac glow-lilac">lo reorganizan todo.</p>
    </FadeIn>
    <FadeIn delay={0.85}>
      <p className="t-body" style={{ marginTop: "1.5rem" }}>
        Como Merlin ante Escanor —<br />
        una presencia que lo cambia todo<br />
        sin siquiera intentarlo.
      </p>
    </FadeIn>
  </div>,

  // 4 — heartbeat
  <div key="heartbeat" className="text-block">
    <FadeIn><p className="t-hero text-shimmer">Un mes.</p></FadeIn>
    <FadeIn delay={0.3}><div className="divider" /></FadeIn>
    <FadeIn delay={0.5}>
      <p className="t-title c-white" style={{ marginBottom: "1rem" }}>
        Treinta días que cambiaron<br />la forma en que veo las mañanas.
      </p>
    </FadeIn>
    <FadeIn delay={0.85}>
      <p className="t-body">
        Treinta días en los que<br />mi corazón aprendió tu nombre.
      </p>
    </FadeIn>
  </div>,

  // 5 — letter 1
  <div key="letter1" className="text-block">
    <FadeIn><p className="t-caption c-lilac" style={{ marginBottom: "1.2rem" }}>sobre ti</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-white glow-white" style={{ marginBottom: "1.2rem" }}>Eres espectacular, Leyre.</h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">No lo digo porque sí.<br />Lo digo porque lo veo.</p></FadeIn>
    <FadeIn delay={0.65}><div className="divider" /></FadeIn>
    <FadeIn delay={0.85}>
      <p className="t-body">
        Eres de las personas que piensan antes de hablar.<br />
        Que cuidan lo que dicen porque saben que las palabras pesan.
      </p>
    </FadeIn>
    <FadeIn delay={1.1}>
      <p className="t-verse c-lilac glow-lilac" style={{ marginTop: "1.2rem" }}>Eso es raro. Y es tuyo.</p>
    </FadeIn>
    <FadeIn delay={1.4}>
      <p className="t-body" style={{ marginTop: "1rem" }}>
        Tu inteligencia no es la que presume.<br />
        Es la que resuelve, la que escucha,<br />
        la que entiende sin que le expliquen dos veces.
      </p>
    </FadeIn>
  </div>,

  // 6 — letter 2
  <div key="letter2" className="text-block">
    <FadeIn><p className="t-caption c-pink" style={{ marginBottom: "1.2rem" }}>lo que me haces sentir</p></FadeIn>
    <FadeIn delay={0.25}>
      <h2 className="t-title c-pink glow-pink" style={{ marginBottom: "1.2rem" }}>
        Se me acelera el corazón<br />cada vez que sé que te voy a ver.
      </h2>
    </FadeIn>
    <FadeIn delay={0.55}><p className="t-body">Cuando estás cerca,<br />hay algo en el aire que cambia.</p></FadeIn>
    <FadeIn delay={0.75}><div className="divider" /></FadeIn>
    <FadeIn delay={0.95}>
      <p className="t-verse c-gold glow-gold">
        Como Escanor al sol —<br />
        tu presencia me hace brillar<br />
        más de lo que creía posible.
      </p>
    </FadeIn>
    <FadeIn delay={1.3}>
      <p className="t-body" style={{ marginTop: "1rem" }}>
        Contigo no tengo que calcular lo que digo.<br />Simplemente soy.
      </p>
    </FadeIn>
  </div>,

  // 7 — letter 3
  <div key="letter3" className="text-block">
    <FadeIn><p className="t-caption c-sakura" style={{ marginBottom: "1.2rem" }}>lo que me das</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-white" style={{ marginBottom: "1.2rem" }}>Me encanta tu color de piel.</h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">Me encanta tu forma tan sencilla<br />y genuina de ser.</p></FadeIn>
    <FadeIn delay={0.65}><p className="t-body" style={{ marginTop: "0.8rem" }}>Tu pensamiento. Tus decisiones.<br />Cómo ves el mundo.</p></FadeIn>
    <FadeIn delay={0.9}>
      <p className="t-verse c-lilac glow-lilac" style={{ marginTop: "1.2rem" }}>Me encanta sentir tu presencia.</p>
    </FadeIn>
    <FadeIn delay={1.15}>
      <p className="t-body" style={{ marginTop: "1rem" }}>
        Tu bondad es silenciosa.<br />
        No la anuncias. No la usas.<br />
        Simplemente la tienes.
      </p>
    </FadeIn>
  </div>,

  // 8 — letter 4
  <div key="letter4" className="text-block">
    <FadeIn><p className="t-caption c-gold" style={{ marginBottom: "1.2rem" }}>fe y futuro</p></FadeIn>
    <FadeIn delay={0.25}><h2 className="t-title c-gold glow-gold" style={{ marginBottom: "1.2rem" }}>Dios sabe lo que hace.</h2></FadeIn>
    <FadeIn delay={0.5}><p className="t-body">Y creo que esto — lo que hay entre tú y yo —<br />no es casualidad.</p></FadeIn>
    <FadeIn delay={0.75}><div className="divider" /></FadeIn>
    <FadeIn delay={0.95}>
      <p className="t-title c-white glow-white">
        Eres la mujer con la que<br />quiero tener mis hijos algún día.
      </p>
    </FadeIn>
    <FadeIn delay={1.3}><p className="t-body" style={{ marginTop: "1rem" }}>Lo digo con el corazón. Sin miedo.<br />Contigo no tengo miedo.</p></FadeIn>
    <FadeIn delay={1.65}>
      <p className="t-verse c-gold glow-gold" style={{ marginTop: "1.2rem" }}>
        «El amor es sufrido, es benigno;<br />
        el amor no tiene envidia.»<br />
        <span className="t-caption" style={{ color: "rgba(255,255,255,0.4)" }}>— 1 Corintios 13:4</span>
      </p>
    </FadeIn>
  </div>,

  // 9 — final
  <div key="final" className="text-block">
    <FadeIn><p className="t-caption" style={{ marginBottom: "1.2rem" }}>✦ &nbsp; un mes &nbsp; ✦</p></FadeIn>
    <FadeIn delay={0.25}><h1 className="t-hero text-shimmer" style={{ marginBottom: "1.4rem" }}>Gracias,<br />Leyre.</h1></FadeIn>
    <FadeIn delay={0.55}>
      <p className="t-body">
        Por llegar con sueño y quedarte despierta.<br />
        Por ser exactamente como eres.<br />
        Por dejarme conocerte.
      </p>
    </FadeIn>
    <FadeIn delay={0.85}><div className="divider" /></FadeIn>
    <FadeIn delay={1.05}><p className="t-verse c-pink glow-pink">Esto apenas comienza.</p></FadeIn>
    <FadeIn delay={1.4}>
      <p className="t-jp c-gold glow-gold" style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>
        ✦ &nbsp; te quiero &nbsp; ✦
      </p>
    </FadeIn>
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
  const scrollRef     = useRef<number>(0);
  const [section, setSection] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const { toggle }    = usePianoMusic();

  // Lenis smooth scroll
  useEffect(() => {
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let rafId: number;

    const init = async () => {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true }) as unknown as {
        raf: (t: number) => void; destroy: () => void;
      };
      const animate = (time: number) => {
        lenis!.raf(time);
        rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);

      const onScroll = () => {
        const el = document.documentElement;
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
        scrollRef.current = progress;
        const sec = Math.min(
          Math.floor(progress * SECTIONS.length),
          SECTIONS.length - 1
        );
        setSection(sec);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(rafId);
      };
    };

    const cleanup = init();
    return () => {
      cleanup.then(fn => fn?.());
      lenis?.destroy();
    };
  }, []);

  const handleAudio = () => {
    const nowPlaying = toggle();
    setMusicOn(nowPlaying);
  };

  return (
    <>
      {/* Canvas 3D fijo */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <World3D scrollRef={scrollRef as React.RefObject<number>} section={section} />
      </div>

      {/* Cursor */}
      <div id="cursor-dot" />
      <div id="cursor-ring" />
      <CustomCursor />

      {/* Label */}
      <div id="site-label">para leyre · 2026</div>

      {/* Botón de música */}
      <button id="audio-btn" onClick={handleAudio} title={musicOn ? "Silenciar" : "Reproducir música"}>
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
          <section
            key={i}
            className="scene-section"
            style={{ minHeight: i === 0 ? "100vh" : "130vh" }}
          >
            {content}
          </section>
        ))}
      </div>
    </>
  );
}
