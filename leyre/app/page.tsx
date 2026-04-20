"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";

const World3D = dynamic(() => import("@/components/World3D"), {
  ssr: false,
  loading: () => null,
});

// ─── FADE IN WRAPPER ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SECCIONES DE CONTENIDO ───────────────────────────────────────────────────
const sections = [
  // 0 — VOID / INTRO
  null,

  // 1 — AWAKENING
  <div key="awakening" className="text-block">
    <FadeIn>
      <p className="t-caption c-dim" style={{ marginBottom: "1rem" }}>
        ✦ &nbsp; para leyre &nbsp; ✦
      </p>
    </FadeIn>
    <FadeIn delay={0.3}>
      <h1 className="t-hero text-shimmer" style={{ marginBottom: "1.5rem" }}>
        Leyre
      </h1>
    </FadeIn>
    <FadeIn delay={0.6}>
      <p className="t-body c-dim">
        Hay momentos que Dios prepara<br />
        mucho antes de que los veas venir.
      </p>
    </FadeIn>
    <FadeIn delay={0.9}>
      <p className="t-jp c-dim" style={{ marginTop: "1.5rem" }}>
        運命 — destino
      </p>
    </FadeIn>
  </div>,

  // 2 — ORIGIN (chat)
  <div key="origin" className="text-block">
    <FadeIn>
      <p className="t-caption c-lilac" style={{ marginBottom: "2rem" }}>
        17 de marzo · 6:01 am
      </p>
    </FadeIn>
    <FadeIn delay={0.2}>
      <p className="t-title c-dim" style={{ marginBottom: "2rem" }}>
        Mientras el mundo dormía,<br />
        <span className="c-white">Dios movió algo.</span>
      </p>
    </FadeIn>
    <FadeIn delay={0.5}>
      <div className="bubble-wrap" style={{ margin: "0 auto" }}>
        <div className="bubble bubble-sent">
          Holaap
          <div className="bubble-time">6:01 am</div>
        </div>
        <div className="bubble bubble-recv">
          Holaaaa 😊
          <div className="bubble-time">6:02 am</div>
        </div>
        <div className="bubble bubble-sent">¿Cómo estás?</div>
        <div className="bubble bubble-recv">
          Con sueño 😴
          <div className="bubble-time">6:03 am</div>
        </div>
      </div>
    </FadeIn>
    <FadeIn delay={1.0}>
      <p className="t-verse c-dim" style={{ marginTop: "2rem" }}>
        Con sueño a las 6am.<br />
        Y aun así respondiste.
      </p>
    </FadeIn>
  </div>,

  // 3 — FORMATION
  <div key="formation" className="text-block">
    <FadeIn>
      <p className="t-caption c-sakura" style={{ marginBottom: "1.5rem" }}>
        花 — flor
      </p>
    </FadeIn>
    <FadeIn delay={0.3}>
      <h2 className="t-title c-white glow-white" style={{ marginBottom: "1.5rem" }}>
        Hay personas que Dios pone<br />
        en tu camino y sin hacer ruido,
      </h2>
    </FadeIn>
    <FadeIn delay={0.6}>
      <p className="t-hero c-lilac glow-lilac">
        lo reorganizan todo.
      </p>
    </FadeIn>
    <FadeIn delay={0.9}>
      <p className="t-body c-dim" style={{ marginTop: "2rem" }}>
        Como Merlin ante Escanor —<br />
        una presencia que lo cambia todo<br />
        sin siquiera intentarlo.
      </p>
    </FadeIn>
  </div>,

  // 4 — HEARTBEAT
  <div key="heartbeat" className="text-block">
    <FadeIn>
      <p className="t-hero text-shimmer">Un mes.</p>
    </FadeIn>
    <FadeIn delay={0.4}>
      <div className="divider" />
    </FadeIn>
    <FadeIn delay={0.6}>
      <p className="t-title c-dim">
        Treinta días que cambiaron<br />
        la forma en que veo las mañanas.
      </p>
    </FadeIn>
    <FadeIn delay={1.0}>
      <p className="t-body c-dim" style={{ marginTop: "1.5rem" }}>
        Treinta días en los que<br />
        mi corazón aprendió tu nombre.
      </p>
    </FadeIn>
  </div>,

  // 5 — LETTER 1: quién eres
  <div key="letter1" className="text-block">
    <FadeIn>
      <p className="t-caption c-lilac" style={{ marginBottom: "1.5rem" }}>
        sobre ti
      </p>
    </FadeIn>
    <FadeIn delay={0.2}>
      <h2 className="t-title c-white glow-white" style={{ marginBottom: "1.5rem" }}>
        Eres espectacular, Leyre.
      </h2>
    </FadeIn>
    <FadeIn delay={0.5}>
      <p className="t-body c-dim">
        No lo digo porque sí.<br />
        Lo digo porque lo veo.
      </p>
    </FadeIn>
    <FadeIn delay={0.8}>
      <div className="divider" />
    </FadeIn>
    <FadeIn delay={1.0}>
      <p className="t-body c-dim">
        Eres de las personas que piensan<br />
        antes de hablar. Que cuidan lo que dicen<br />
        porque saben que las palabras pesan.
      </p>
    </FadeIn>
    <FadeIn delay={1.4}>
      <p className="t-verse c-lilac glow-lilac" style={{ marginTop: "1.5rem" }}>
        Eso es raro. Y es tuyo.
      </p>
    </FadeIn>
    <FadeIn delay={1.8}>
      <p className="t-body c-dim" style={{ marginTop: "1.5rem" }}>
        Tu inteligencia no es la que presume.<br />
        Es la que resuelve, la que escucha,<br />
        la que entiende sin que le expliquen dos veces.
      </p>
    </FadeIn>
  </div>,

  // 6 — LETTER 2: lo que siento
  <div key="letter2" className="text-block">
    <FadeIn>
      <p className="t-caption c-pink" style={{ marginBottom: "1.5rem" }}>
        lo que me haces sentir
      </p>
    </FadeIn>
    <FadeIn delay={0.3}>
      <h2 className="t-title c-pink glow-pink" style={{ marginBottom: "1.5rem" }}>
        Se me acelera el corazón<br />
        cada vez que sé que te voy a ver.
      </h2>
    </FadeIn>
    <FadeIn delay={0.7}>
      <p className="t-body c-dim">
        Cuando estás cerca,<br />
        hay algo en el aire que cambia.
      </p>
    </FadeIn>
    <FadeIn delay={1.0}>
      <div className="divider" />
    </FadeIn>
    <FadeIn delay={1.2}>
      <p className="t-verse c-gold glow-gold">
        Como Escanor al sol —<br />
        tu presencia me hace brillar<br />
        más de lo que creía posible.
      </p>
    </FadeIn>
    <FadeIn delay={1.6}>
      <p className="t-body c-dim" style={{ marginTop: "1.5rem" }}>
        Contigo no tengo que calcular lo que digo.<br />
        Simplemente soy.
      </p>
    </FadeIn>
  </div>,

  // 7 — LETTER 3: lo que me das
  <div key="letter3" className="text-block">
    <FadeIn>
      <p className="t-caption c-sakura" style={{ marginBottom: "1.5rem" }}>
        lo que me das
      </p>
    </FadeIn>
    <FadeIn delay={0.2}>
      <h2 className="t-title c-white" style={{ marginBottom: "1.5rem" }}>
        Me encanta tu color de piel.
      </h2>
    </FadeIn>
    <FadeIn delay={0.5}>
      <p className="t-body c-dim">
        Me encanta tu forma tan sencilla<br />
        y genuina de ser.
      </p>
    </FadeIn>
    <FadeIn delay={0.8}>
      <p className="t-body c-dim" style={{ marginTop: "1rem" }}>
        Tu pensamiento. Tus decisiones.<br />
        Cómo ves el mundo.
      </p>
    </FadeIn>
    <FadeIn delay={1.1}>
      <p className="t-verse c-lilac glow-lilac" style={{ marginTop: "1.5rem" }}>
        Me encanta sentir tu presencia.
      </p>
    </FadeIn>
    <FadeIn delay={1.4}>
      <p className="t-body c-dim" style={{ marginTop: "1.5rem" }}>
        Tu bondad es silenciosa.<br />
        No la anuncias. No la usas.<br />
        Simplemente la tienes.
      </p>
    </FadeIn>
  </div>,

  // 8 — LETTER 4: fe y futuro
  <div key="letter4" className="text-block">
    <FadeIn>
      <p className="t-caption c-gold" style={{ marginBottom: "1.5rem" }}>
        fe y futuro
      </p>
    </FadeIn>
    <FadeIn delay={0.3}>
      <h2 className="t-title c-gold glow-gold" style={{ marginBottom: "1.5rem" }}>
        Dios sabe lo que hace.
      </h2>
    </FadeIn>
    <FadeIn delay={0.6}>
      <p className="t-body c-dim">
        Y creo que esto — lo que hay entre tú y yo —<br />
        no es casualidad.
      </p>
    </FadeIn>
    <FadeIn delay={1.0}>
      <div className="divider" />
    </FadeIn>
    <FadeIn delay={1.2}>
      <p className="t-title c-white glow-white" style={{ marginTop: "0.5rem" }}>
        Eres la mujer con la que<br />
        quiero tener mis hijos algún día.
      </p>
    </FadeIn>
    <FadeIn delay={1.6}>
      <p className="t-body c-dim" style={{ marginTop: "1.5rem" }}>
        Lo digo con el corazón. Sin miedo.<br />
        Contigo no tengo miedo.
      </p>
    </FadeIn>
    <FadeIn delay={2.0}>
      <p className="t-verse c-gold glow-gold" style={{ marginTop: "1.5rem" }}>
        «El amor es sufrido, es benigno;<br />
        el amor no tiene envidia.»<br />
        <span className="t-caption c-dim">— 1 Corintios 13:4</span>
      </p>
    </FadeIn>
  </div>,

  // 9 — FINAL
  <div key="final" className="text-block">
    <FadeIn>
      <p className="t-caption c-dim" style={{ marginBottom: "1.5rem" }}>
        ✦ &nbsp; un mes &nbsp; ✦
      </p>
    </FadeIn>
    <FadeIn delay={0.3}>
      <h1 className="t-hero text-shimmer" style={{ marginBottom: "1.5rem" }}>
        Gracias,<br />Leyre.
      </h1>
    </FadeIn>
    <FadeIn delay={0.7}>
      <p className="t-body c-dim">
        Por llegar con sueño y quedarte despierta.<br />
        Por ser exactamente como eres.<br />
        Por dejarme conocerte.
      </p>
    </FadeIn>
    <FadeIn delay={1.1}>
      <div className="divider" />
    </FadeIn>
    <FadeIn delay={1.4}>
      <p className="t-verse c-pink glow-pink">
        Esto apenas comienza.
      </p>
    </FadeIn>
    <FadeIn delay={1.8}>
      <p className="t-jp c-gold glow-gold" style={{ marginTop: "2rem", fontSize: "1.2rem" }}>
        ✦ &nbsp; te quiero &nbsp; ✦
      </p>
    </FadeIn>
  </div>,
];

// ─── CURSOR PERSONALIZADO ─────────────────────────────────────────────────────
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
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      dot.style.transform  = `translate(${mx - 3}px, ${my - 3}px)`;
      ring.style.transform = `translate(${rx - 15}px, ${ry - 15}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function Home() {
  const scrollRef = useRef<number>(0);
  const [heartVisible, setHeartVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scroll
  useEffect(() => {
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;

    const init = async () => {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({ lerp: 0.08, smoothWheel: true }) as unknown as { raf: (t: number) => void; destroy: () => void };

      let raf: number;
      const animate = (time: number) => {
        lenis!.raf(time);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      // Scroll progress
      const onScroll = () => {
        const el = document.documentElement;
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
        scrollRef.current = progress;

        // Detectar sección activa
        const total = sections.length;
        const sec = Math.floor(progress * total);
        setActiveSection(Math.min(sec, total - 1));

        // Corazón visible en secciones 4-9
        setHeartVisible(progress > 0.38);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(raf);
      };
    };

    const cleanup = init();
    return () => {
      cleanup.then(fn => fn?.());
      lenis?.destroy();
    };
  }, []);

  return (
    <>
      {/* Canvas 3D fijo */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <World3D scrollRef={scrollRef as React.RefObject<number>} heartVisible={heartVisible} />
      </div>

      {/* Cursor */}
      <div id="cursor-dot" />
      <div id="cursor-ring" />
      <CustomCursor />

      {/* Label */}
      <div id="site-label">para leyre · 2026</div>

      {/* Progress dots */}
      <div id="progress-bar">
        {sections.map((_, i) => (
          <div
            key={i}
            className={`progress-dot${activeSection === i ? " active" : ""}`}
          />
        ))}
      </div>

      {/* Scroll container — cada sección es 100vh */}
      <div ref={containerRef} id="scroll-root">
        {sections.map((content, i) => (
          <section
            key={i}
            className="scene-section"
            style={{ minHeight: i === 0 ? "100vh" : "120vh" }}
          >
            {content}
          </section>
        ))}
      </div>
    </>
  );
}
