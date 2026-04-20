"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import { useKoreanMusic } from "@/hooks/useKoreanMusic";
import PhotoCard from "@/components/PhotoCard";

const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
  loading: () => null,
});

// ─── CONTADOR DE TIEMPO EXACTO ────────────────────────────────────────────────
const ORIGIN = new Date("2026-03-17T05:01:00.000Z");

function useTimeSince() {
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - ORIGIN.getTime();
      const s = Math.floor(diff / 1000);
      setElapsed({ days: Math.floor(s/86400), hours: Math.floor((s%86400)/3600), minutes: Math.floor((s%3600)/60), seconds: s%60 });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return elapsed;
}

// ─── FADE IN ──────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}

// ─── CONTADOR VIVO ────────────────────────────────────────────────────────────
function LiveCounter() {
  const { days, hours, minutes, seconds } = useTimeSince();
  return (
    <div className="live-counter">
      <div className="counter-unit">
        <span className="counter-num">{String(days).padStart(3,"0")}</span>
        <span className="counter-label">días</span>
      </div>
      <span className="counter-sep">:</span>
      <div className="counter-unit">
        <span className="counter-num">{String(hours).padStart(2,"0")}</span>
        <span className="counter-label">horas</span>
      </div>
      <span className="counter-sep">:</span>
      <div className="counter-unit">
        <span className="counter-num">{String(minutes).padStart(2,"0")}</span>
        <span className="counter-label">min</span>
      </div>
      <span className="counter-sep">:</span>
      <div className="counter-unit">
        <span className="counter-num">{String(seconds).padStart(2,"0")}</span>
        <span className="counter-label">seg</span>
      </div>
    </div>
  );
}

// ─── SECCIONES ────────────────────────────────────────────────────────────────
// Arco: intro → origen → primer mensaje → ella (fotos) → lo que siento →
// nosotros (fotos) → el tiempo → momento especial (manos) → Barak →
// fe → futuro → cierre
const SECTIONS = [

  // 0 — intro (solo canvas)
  null,

  // 1 — el origen
  <div key="1" className="text-block">
    <FadeIn><p className="t-caption">✦ &nbsp; para leyre &nbsp; ✦</p></FadeIn>
    <FadeIn delay={0.2}><h1 className="t-hero text-shimmer" style={{ marginTop:"0.8rem", marginBottom:"1.2rem" }}>Leyre</h1></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">
      Hay cosas que Dios prepara en silencio.<br />
      Sin anunciarlo. Sin pedirte permiso.<br />
      Solo las pone delante de ti<br />
      y espera a ver si las ves.
    </p></FadeIn>
    <FadeIn delay={0.7}><div className="divider" /></FadeIn>
    <FadeIn delay={0.9}><p className="t-verse c-lilac glow-lilac">
      Yo te vi.<br />
      Y desde ese momento<br />
      algo en mí supo que eras diferente.
    </p></FadeIn>
    <FadeIn delay={1.1}><p className="t-jp" style={{ marginTop:"1.2rem" }}>運命 — destino</p></FadeIn>
  </div>,

  // 2 — el primer mensaje (conversación real)
  <div key="2" className="text-block">
    <FadeIn><p className="t-caption c-lilac" style={{ marginBottom:"0.8rem" }}>17 de marzo · 6:01 am · Instagram</p></FadeIn>
    <FadeIn delay={0.15}><p className="t-title c-white" style={{ marginBottom:"1.4rem" }}>
      Mientras el mundo dormía,<br />
      <span className="c-lilac glow-lilac">Dios movió algo.</span>
    </p></FadeIn>
    <FadeIn delay={0.4}>
      <div className="bubble-wrap">
        <div className="bubble bubble-sent">Holaap<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Holaaaa<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-sent">Como estás?<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Con sueño 😫<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Jajaja muy bien y tú?<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-sent">Jaja no debes madrugar?<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Me despierto a las 5:50<br />pero aún así me da mucho sueño<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Soy de pasto y tu?<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-sent">También soy de Pasto :))<div className="bubble-time">6:01 am</div></div>
        <div className="bubble bubble-recv">Yeeei<div className="bubble-time">6:01 am</div></div>
      </div>
    </FadeIn>
    <FadeIn delay={0.85}><p className="t-verse" style={{ marginTop:"1.4rem" }}>
      Con sueño a las 5:50 de la mañana.<br />
      Y aun así respondiste.<br />
      Y encima resultamos ser del mismo lugar.<br />
      <span className="c-pink">Eso no es casualidad.</span>
    </p></FadeIn>
  </div>,

  // 3 — ella (fotos: manos en cara + gorra)
  <div key="3" className="text-block" style={{ maxWidth:700 }}>
    <FadeIn><p className="t-caption c-pink" style={{ marginBottom:"1rem" }}>así te veo yo</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-white glow-white" style={{ marginBottom:"1.4rem" }}>
      Eres de esas personas que<br />
      no necesitan hacer ruido<br />
      para llenar una habitación.
    </h2></FadeIn>
    <FadeIn delay={0.4}>
      <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
        <PhotoCard src="/photos/leyre-manos.jpg" alt="Leyre" caption="Esa pose. Esos labios. Ese pelo. Dios mío." glowColor="#ff4da6" size="md" delay={0.1} />
        <PhotoCard src="/photos/leyre-gorra.jpg" alt="Leyre con gorra" caption="Nuestras manitos :3 " glowColor="#d4b8ff" size="md" delay={0.3} />
      </div>
    </FadeIn>
    <FadeIn delay={0.7}><p className="t-body" style={{ marginTop:"1.2rem" }}>
      Tienes algo que no se aprende ni se finge.<br />
      Una forma de estar presente que es tuya sola.<br />
      Cuando hablas, la gente escucha.<br />
      Cuando callas, también.
    </p></FadeIn>
  </div>,

  // 4 — ella fuerte (fotos: rizado + músculo)
  <div key="4" className="text-block" style={{ maxWidth:700 }}>
    <FadeIn delay={0.15}>
      <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
        <PhotoCard src="/photos/leyre-rizado.jpg" alt="Leyre pelo rizado" caption="Tu pelo rizado suelto es una de mis cosas favoritas." glowColor="#ffb8d4" size="lg" delay={0.1} />
        <PhotoCard src="/photos/leyre-musculo.jpg" alt="Leyre fuerte" caption="Y como siempre, muy guapa y muy fuerte!!!" glowColor="#ff7733" size="lg" delay={0.3} />
      </div>
    </FadeIn>
    <FadeIn delay={0.6}><p className="t-verse c-pink glow-pink" style={{ marginTop:"1.4rem" }}>
      Me encanta tu color de piel.<br />
      Me encanta tu forma tan sencilla y genuina de ser.<br />
      Tu bondad es silenciosa.<br />
      No la anuncias. Simplemente la tienes.<br />
      <span className="c-white">Eso es raro. Y es tuyo.</span>
    </p></FadeIn>
  </div>,

  // 5 — lo que siento cuando estás cerca
  <div key="5" className="text-block">
    <FadeIn><p className="t-caption c-pink" style={{ marginBottom:"1rem" }}>lo que me haces sentir</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-pink glow-pink" style={{ marginBottom:"1.2rem" }}>
      Se me acelera el corazón<br />
      cada vez que sé que te voy a ver.
    </h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">
      No es nervios. No es ansiedad.<br />
      Es algo más limpio que eso.<br />
      Es la certeza de que algo bueno<br />
      está a punto de pasar.
    </p></FadeIn>
    <FadeIn delay={0.7}><div className="divider" /></FadeIn>
    <FadeIn delay={0.9}><p className="t-verse c-gold glow-gold">
      Cuando estás cerca,<br />
      hay algo en el aire que cambia.<br />
      Como si el mundo bajara el volumen<br />
      para que yo solo te escuche a ti.
    </p></FadeIn>
    <FadeIn delay={1.2}><p className="t-body" style={{ marginTop:"1rem" }}>
      Contigo no tengo que calcular lo que digo.<br />
      No tengo que ser más ni menos.<br />
      Simplemente soy.<br />
      <span className="c-pink">Y eso es lo más raro y lo más bonito.</span>
    </p></FadeIn>
  </div>,

  // 6 — nosotros (fotos juntos)
  <div key="6" className="text-block" style={{ maxWidth:700 }}>
    <FadeIn><p className="t-caption c-lilac" style={{ marginBottom:"1rem" }}>nosotros</p></FadeIn>
    <FadeIn delay={0.2}><h2 className="t-title c-white glow-white" style={{ marginBottom:"1.4rem" }}>
      La primera vez que estuvimos<br />
      en el mismo lugar al mismo tiempo.
    </h2></FadeIn>
    <FadeIn delay={0.35}>
      <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
        <PhotoCard src="/photos/juntos-1.jpg" alt="Nosotros juntos" caption="Esa bufanda roja. Esa sonrisa tuya. No me la olvido." glowColor="#ff4da6" size="lg" delay={0.1} />
        <PhotoCard src="/photos/juntos-2.jpg" alt="Nosotros abrazados" caption="Así quiero estar siempre. Cerca." glowColor="#d4b8ff" size="lg" delay={0.3} />
      </div>
    </FadeIn>
    <FadeIn delay={0.7}><p className="t-verse c-lilac glow-lilac" style={{ marginTop:"1.4rem" }}>
      Hay fotos que guardan momentos.<br />
      Y hay fotos que guardan <em>todo</em>.<br />
      Estas son de las segundas.
    </p></FadeIn>
  </div>,

  // 7 — el tiempo exacto
  <div key="7" className="text-block">
    <FadeIn><p className="t-caption c-gold" style={{ marginBottom:"1rem" }}>llevamos juntos exactamente</p></FadeIn>
    <FadeIn delay={0.3}><LiveCounter /></FadeIn>
    <FadeIn delay={0.6}><div className="divider" /></FadeIn>
    <FadeIn delay={0.8}><p className="t-body">
      Treinta días en los que mi corazón<br />
      aprendió tu nombre.<br />
      En los que empecé a esperar tus mensajes<br />
      sin darme cuenta de que los esperaba.
    </p></FadeIn>
    <FadeIn delay={1.1}><p className="t-verse c-gold glow-gold" style={{ marginTop:"1rem" }}>
      Y ahora no me imagino<br />
      las mañanas sin saber de ti.
    </p></FadeIn>
  </div>,

  // 8 — el momento de la carpa
  <div key="8" className="text-block" style={{ maxWidth:560 }}>
    <FadeIn delay={0.2}><p className="t-verse c-gold glow-gold">
      Dentro de una carpa.<br />
      El campo verde afuera.<br />
      Nuestras manos entrelazadas.<br />
      Sin decir nada, diciéndolo todo.
    </p></FadeIn>
    <FadeIn delay={0.6}><div className="divider" /></FadeIn>
    <FadeIn delay={0.8}><p className="t-body">
      Quiero más momentos así contigo.<br />
      <span className="c-gold">Quietos. Juntos. Sin prisa.</span>
    </p></FadeIn>
  </div>,

  // 9 — Barak
  <div key="9" className="text-block" style={{ maxWidth:560 }}>
    <FadeIn delay={0.2}><h2 className="t-title c-white" style={{ marginBottom:"1.2rem" }}>Barak.</h2></FadeIn>
    <FadeIn delay={0.35}>
      <PhotoCard src="/photos/barak.jpg" alt="Barak el pekinés" caption="Dos meses. Dormidito. Como si el mundo no existiera." glowColor="#f5d98a" size="full" delay={0} />
    </FadeIn>
    <FadeIn delay={0.6}><p className="t-body" style={{ marginTop:"1.5rem" }}>
      Sé que lo quieres como a un hijo.<br />
      Y eso me dice mucho de ti.<br />
      Que tienes un corazón enorme<br />
      que cabe todo lo que amas.
    </p></FadeIn>
  </div>,

  // 10 — fe y destino (sin título frío)
  <div key="10" className="text-block">
    <FadeIn delay={0.2}><h2 className="t-title c-gold glow-gold" style={{ marginBottom:"1.2rem" }}>Dios sabe lo que hace.</h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">
      No creo en las casualidades.<br />
      Creo en que hay un Dios que mueve piezas<br />
      mucho antes de que tú las veas.<br />
      Y creo que tú eres una de esas piezas<br />
      que Él puso en mi vida con intención.
    </p></FadeIn>
    <FadeIn delay={0.7}><div className="divider" /></FadeIn>
    <FadeIn delay={0.9}><p className="t-body">
      Lo que hay entre tú y yo<br />
      no tiene la textura de lo accidental.<br />
      Tiene la textura de algo<br />
      <span className="c-gold">sembrado antes de que nos conociéramos.</span>
    </p></FadeIn>
    <FadeIn delay={1.2}><p className="t-verse c-gold glow-gold" style={{ marginTop:"1rem" }}>
      «El amor es sufrido, es benigno;<br />
      el amor no tiene envidia.»<br />
      <span className="t-caption" style={{ color:"rgba(255,255,255,0.35)" }}>— 1 Corintios 13:4</span>
    </p></FadeIn>
  </div>,

  // 11 — el futuro (sin título frío)
  <div key="11" className="text-block">
    <FadeIn delay={0.2}><h2 className="t-title c-white glow-white" style={{ marginBottom:"1.2rem" }}>
      Eres la mujer con la que<br />
      quiero tener mis hijos algún día.
    </h2></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">
      Lo digo con el corazón. Sin miedo.<br />
      Sin calcular si es pronto o tarde.<br />
      Porque cuando algo es verdad<br />
      no necesita el momento perfecto<br />
      para ser dicho.
    </p></FadeIn>
    <FadeIn delay={0.7}><p className="t-body" style={{ marginTop:"0.8rem" }}>
      Me imagino construir algo contigo.<br />
      Una vida que tenga tu risa,<br />
      tu forma de ver las cosas,<br />
      tu bondad silenciosa<br />
      corriendo por las paredes de nuestra casa.
    </p></FadeIn>
    <FadeIn delay={0.95}><div className="divider" /></FadeIn>
    <FadeIn delay={1.1}><p className="t-verse c-lilac glow-lilac">
      No sé todo lo que viene.<br />
      Pero sé que quiero que vengas tú.
    </p></FadeIn>
  </div>,

  // 12 — cierre
  <div key="12" className="text-block">
    <FadeIn><p className="t-caption" style={{ marginBottom:"1rem" }}>✦ &nbsp; un mes &nbsp; ✦</p></FadeIn>
    <FadeIn delay={0.2}><h1 className="t-hero text-shimmer" style={{ marginBottom:"1.2rem" }}>Gracias,<br />Leyre.</h1></FadeIn>
    <FadeIn delay={0.45}><p className="t-body">
      Por llegar con sueño y quedarte despierta.<br />
      Por responder a las 6 de la mañana.<br />
      Por ser exactamente como eres<br />
      sin intentar ser nada más.
    </p></FadeIn>
    <FadeIn delay={0.7}><p className="t-body" style={{ marginTop:"0.8rem" }}>
      Por dejarme conocerte.<br />
      Por cada conversación que se alargó<br />
      más de lo que ninguno planeaba.<br />
      Por cada vez que me hiciste reír<br />
      cuando no lo esperaba.
    </p></FadeIn>
    <FadeIn delay={0.95}><div className="divider" /></FadeIn>
    <FadeIn delay={1.1}><p className="t-verse c-pink glow-pink">
      Esto apenas comienza.<br />
      Y ya es lo mejor que me ha pasado<br />
      en mucho tiempo.
    </p></FadeIn>
    <FadeIn delay={1.4}><p className="t-jp c-gold glow-gold" style={{ marginTop:"1.5rem", fontSize:"1.1rem" }}>
      ✦ &nbsp; te quiero &nbsp; ✦
    </p></FadeIn>
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
  const { toggle } = useKoreanMusic();

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

  return (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:0 }}>
        <SceneCanvas scrollProgress={scrollRef as React.RefObject<number>} section={section} />
      </div>

      <div id="cursor-dot" />
      <div id="cursor-ring" />
      <CustomCursor />

      <div id="site-label">para leyre · 2026</div>

      <button id="audio-btn" onClick={() => setMusicOn(toggle())} title={musicOn ? "Silenciar" : "Música"}>
        {musicOn ? "♪" : "♩"}
      </button>

      <div id="progress-bar">
        {SECTIONS.map((_, i) => (
          <div key={i} className={`progress-dot${section === i ? " active" : ""}`} />
        ))}
      </div>

      <div id="scroll-root">
        {SECTIONS.map((content, i) => (
          <section key={i} className="scene-section" style={{ minHeight: i === 0 ? "100vh" : "140vh" }}>
            {content}
          </section>
        ))}
      </div>
    </>
  );
}
