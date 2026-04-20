"use client";
/**
 * Sprites SVG de Escanor y Merlin — dibujados fielmente a los personajes.
 * Escanor: musculoso, sin camisa, pantalón verde, bigote, Rhitta al hombro.
 * Merlin: elegante, capa lila, pelo negro, orbe verde, botas altas.
 * Animados con framer-motion — breathing, idle sway, cast.
 */
import { motion } from "framer-motion";

// ─── ESCANOR SVG ──────────────────────────────────────────────────────────────
export function EscanorSprite({ section }: { section: number }) {
  const isProud    = section === 5 || section === 6;
  const isBowing   = section === 8 || section === 9;
  const isWalking  = section === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", width: 220, height: 420, userSelect: "none" }}
    >
      {/* Aura solar */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", inset: -30,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,200,80,0.25) 0%, rgba(245,160,20,0.1) 50%, transparent 70%)",
          filter: "blur(12px)",
          zIndex: 0,
        }}
      />

      <motion.svg
        viewBox="0 0 220 420"
        width={220}
        height={420}
        style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 0 18px rgba(245,200,80,0.4))" }}
        animate={isWalking ? { x: [0, 3, 0, -3, 0] } : {}}
        transition={isWalking ? { duration: 0.6, repeat: Infinity } : {}}
      >
        {/* ── RHITTA (hacha solar) ── */}
        <motion.g
          animate={isProud
            ? { rotate: [-15, -10, -15], originX: "110px", originY: "80px" }
            : { rotate: [0, 2, 0], originX: "110px", originY: "80px" }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Mango */}
          <rect x="148" y="30" width="8" height="120" rx="4" fill="#8b6914" />
          {/* Cabeza del hacha — sol */}
          <ellipse cx="165" cy="38" rx="22" ry="18" fill="#f5c832" opacity="0.95" />
          <ellipse cx="165" cy="38" rx="16" ry="12" fill="#f5d98a" />
          {/* Rayos del sol */}
          {[0,45,90,135,180,225,270,315].map((angle, i) => (
            <line key={i}
              x1={165 + Math.cos(angle * Math.PI/180) * 16}
              y1={38  + Math.sin(angle * Math.PI/180) * 12}
              x2={165 + Math.cos(angle * Math.PI/180) * 26}
              y2={38  + Math.sin(angle * Math.PI/180) * 20}
              stroke="#f5c832" strokeWidth="2.5" strokeLinecap="round"
            />
          ))}
          <circle cx="165" cy="38" r="6" fill="#fff8e0" />
        </motion.g>

        {/* ── CUERPO ── */}
        {/* Pantalón verde */}
        <motion.g
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Pierna derecha */}
          <rect x="82" y="250" width="38" height="110" rx="10" fill="#3a6b2a" />
          <rect x="82" y="340" width="38" height="28" rx="6" fill="#2a4a1e" />
          {/* Bota derecha */}
          <ellipse cx="101" cy="368" rx="22" ry="10" fill="#5a3a1a" />
          {/* Pierna izquierda */}
          <rect x="100" y="250" width="38" height="110" rx="10" fill="#3a6b2a" />
          <rect x="100" y="340" width="38" height="28" rx="6" fill="#2a4a1e" />
          {/* Bota izquierda */}
          <ellipse cx="119" cy="368" rx="22" ry="10" fill="#5a3a1a" />
          {/* Cinturón */}
          <rect x="78" y="245" width="64" height="14" rx="4" fill="#8b4513" />
          <rect x="104" y="247" width="12" height="10" rx="2" fill="#c8a020" />
        </motion.g>

        {/* Torso musculoso */}
        <motion.g
          animate={isBowing
            ? { rotate: [0, 25, 0], originX: "110px", originY: "200px" }
            : { y: [0, -2, 0] }
          }
          transition={isBowing
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* Torso principal */}
          <path d="M72 160 Q65 200 68 250 L152 250 Q155 200 148 160 Q130 145 110 143 Q90 145 72 160Z"
            fill="#d4956a" />
          {/* Pectorales */}
          <ellipse cx="95" cy="185" rx="20" ry="16" fill="#c8855a" opacity="0.6" />
          <ellipse cx="125" cy="185" rx="20" ry="16" fill="#c8855a" opacity="0.6" />
          {/* Abdominales */}
          <ellipse cx="95"  cy="210" rx="12" ry="9" fill="#c0784e" opacity="0.5" />
          <ellipse cx="125" cy="210" rx="12" ry="9" fill="#c0784e" opacity="0.5" />
          <ellipse cx="95"  cy="230" rx="11" ry="8" fill="#c0784e" opacity="0.4" />
          <ellipse cx="125" cy="230" rx="11" ry="8" fill="#c0784e" opacity="0.4" />
          {/* Línea central */}
          <line x1="110" y1="160" x2="110" y2="248" stroke="#b86840" strokeWidth="1.5" opacity="0.4" />

          {/* Brazo derecho */}
          <motion.g
            animate={isProud
              ? { rotate: [-110, -105, -110], originX: "72px", originY: "170px" }
              : { rotate: [8, 12, 8], originX: "72px", originY: "170px" }
            }
            transition={{ duration: isProud ? 2 : 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="62" cy="185" rx="18" ry="14" fill="#d4956a" />
            <rect x="44" y="185" width="28" height="55" rx="14" fill="#d4956a" />
            {/* Bícep */}
            <ellipse cx="58" cy="195" rx="14" ry="10" fill="#c8855a" opacity="0.5" />
            {/* Antebrazo */}
            <rect x="46" y="235" width="24" height="45" rx="12" fill="#d4956a" />
            {/* Mano */}
            <ellipse cx="58" cy="282" rx="14" ry="10" fill="#c8855a" />
          </motion.g>

          {/* Brazo izquierdo */}
          <motion.g
            animate={{ rotate: [-8, -12, -8], originX: "148px", originY: "170px" }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="158" cy="185" rx="18" ry="14" fill="#d4956a" />
            <rect x="148" y="185" width="28" height="55" rx="14" fill="#d4956a" />
            <ellipse cx="162" cy="195" rx="14" ry="10" fill="#c8855a" opacity="0.5" />
            <rect x="150" y="235" width="24" height="45" rx="12" fill="#d4956a" />
            <ellipse cx="162" cy="282" rx="14" ry="10" fill="#c8855a" />
          </motion.g>

          {/* Cuello */}
          <rect x="100" y="143" width="20" height="22" rx="8" fill="#d4956a" />

          {/* Cabeza */}
          <motion.g
            animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Cráneo */}
            <ellipse cx="110" cy="115" rx="38" ry="40" fill="#d4956a" />
            {/* Mandíbula */}
            <path d="M78 125 Q80 148 110 152 Q140 148 142 125Z" fill="#d4956a" />

            {/* Pelo rojizo-naranja */}
            <path d="M74 105 Q72 75 90 65 Q110 55 130 65 Q148 75 146 105 Q135 88 110 85 Q85 88 74 105Z"
              fill="#c8600a" />
            <path d="M74 105 Q68 95 70 82 Q75 68 85 62" fill="none" stroke="#c8600a" strokeWidth="8" strokeLinecap="round" />
            <path d="M146 105 Q152 95 150 82 Q145 68 135 62" fill="none" stroke="#c8600a" strokeWidth="8" strokeLinecap="round" />

            {/* Barba/bigote característico */}
            <path d="M88 132 Q110 140 132 132 Q125 148 110 150 Q95 148 88 132Z" fill="#a84a08" />
            <path d="M92 128 Q110 135 128 128" stroke="#a84a08" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Bigote */}
            <path d="M94 122 Q102 118 110 120 Q118 118 126 122" stroke="#8b3a06" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* Ojos azules */}
            <ellipse cx="96" cy="110" rx="10" ry="9" fill="#e8f0ff" />
            <ellipse cx="124" cy="110" rx="10" ry="9" fill="#e8f0ff" />
            <ellipse cx="96" cy="110" rx="7" ry="7" fill="#4a7aee" />
            <ellipse cx="124" cy="110" rx="7" ry="7" fill="#4a7aee" />
            <ellipse cx="96" cy="110" rx="4" ry="4" fill="#1a2a6e" />
            <ellipse cx="124" cy="110" rx="4" ry="4" fill="#1a2a6e" />
            <circle cx="99" cy="107" r="2" fill="white" />
            <circle cx="127" cy="107" r="2" fill="white" />

            {/* Cejas gruesas */}
            <path d="M84 100 Q96 95 108 98" stroke="#8b3a06" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M112 98 Q124 95 136 100" stroke="#8b3a06" strokeWidth="4" fill="none" strokeLinecap="round" />
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}

// ─── MERLIN SVG ───────────────────────────────────────────────────────────────
export function MerlinSprite({ section }: { section: number }) {
  const isCasting = section === 4 || section === 5 || section === 7;
  const isWaving  = section === 6 || section === 9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", width: 190, height: 420, userSelect: "none" }}
    >
      {/* Aura mágica */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", inset: -25,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(100,60,200,0.3) 0%, rgba(60,20,150,0.1) 50%, transparent 70%)",
          filter: "blur(14px)",
          zIndex: 0,
        }}
      />

      <motion.svg
        viewBox="0 0 190 420"
        width={190}
        height={420}
        style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 0 16px rgba(140,80,255,0.5))" }}
      >
        {/* ── ORBE MÁGICO ── */}
        <motion.g
          animate={isCasting
            ? { x: [0, 15, 0], y: [0, -20, 0], scale: [1, 1.4, 1] }
            : { y: [0, -8, 0], rotate: [0, 360] }
          }
          transition={isCasting
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 4, repeat: Infinity, ease: "easeInOut", rotate: { duration: 6, repeat: Infinity, ease: "linear" } }
          }
          style={{ originX: "145px", originY: "200px" }}
        >
          <circle cx="145" cy="200" r="22" fill="rgba(60,200,120,0.15)" />
          <circle cx="145" cy="200" r="16" fill="rgba(60,200,120,0.3)" />
          <circle cx="145" cy="200" r="10" fill="#40c878" opacity="0.9" />
          <circle cx="145" cy="200" r="5"  fill="#80ffb0" />
          {/* Anillos del orbe */}
          <ellipse cx="145" cy="200" rx="20" ry="6" fill="none" stroke="#40c878" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="145" cy="200" rx="6" ry="20" fill="none" stroke="#40c878" strokeWidth="1.5" opacity="0.6" />
        </motion.g>

        {/* ── CUERPO ── */}
        {/* Botas altas negras */}
        <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
          {/* Bota derecha */}
          <rect x="68" y="300" width="28" height="95" rx="8" fill="#1a0a2e" />
          <ellipse cx="82" cy="395" rx="18" ry="8" fill="#0d0520" />
          {/* Bota izquierda */}
          <rect x="94" y="300" width="28" height="95" rx="8" fill="#1a0a2e" />
          <ellipse cx="108" cy="395" rx="18" ry="8" fill="#0d0520" />
          {/* Detalle botas */}
          <line x1="68" y1="340" x2="96" y2="340" stroke="#2a1a4e" strokeWidth="1.5" />
          <line x1="94" y1="340" x2="122" y2="340" stroke="#2a1a4e" strokeWidth="1.5" />
        </motion.g>

        {/* Falda/shorts lila */}
        <path d="M62 260 Q60 300 68 310 L122 310 Q130 300 128 260Z" fill="#3a1a6e" />
        {/* Detalle dorado */}
        <path d="M62 260 Q95 270 128 260" stroke="#c8a020" strokeWidth="2" fill="none" />

        {/* Torso */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Cuerpo principal */}
          <path d="M68 175 Q62 220 62 260 L128 260 Q128 220 122 175 Q110 162 95 160 Q80 162 68 175Z"
            fill="#e8c4a0" />

          {/* Ropa interior/bikini top lila */}
          <path d="M70 185 Q95 195 120 185 Q118 205 95 208 Q72 205 70 185Z" fill="#3a1a6e" />
          <path d="M70 185 Q95 178 120 185" stroke="#5a2a9e" strokeWidth="2" fill="none" />

          {/* Capa lila — lado izquierdo */}
          <motion.path
            d="M62 175 Q40 200 35 280 Q45 290 55 285 Q58 220 68 185Z"
            fill="#4a1a8e"
            animate={{ d: [
              "M62 175 Q40 200 35 280 Q45 290 55 285 Q58 220 68 185Z",
              "M62 175 Q38 205 32 285 Q42 295 52 290 Q56 225 68 185Z",
              "M62 175 Q40 200 35 280 Q45 290 55 285 Q58 220 68 185Z",
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Capa lila — lado derecho */}
          <motion.path
            d="M128 175 Q150 200 155 280 Q145 290 135 285 Q132 220 122 185Z"
            fill="#4a1a8e"
            animate={{ d: [
              "M128 175 Q150 200 155 280 Q145 290 135 285 Q132 220 122 185Z",
              "M128 175 Q152 205 158 285 Q148 295 138 290 Q134 225 122 185Z",
              "M128 175 Q150 200 155 280 Q145 290 135 285 Q132 220 122 185Z",
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />

          {/* Cuello de piel blanca */}
          <rect x="88" y="158" width="14" height="20" rx="6" fill="#f0e0d0" />

          {/* Brazo derecho */}
          <motion.g
            animate={isCasting
              ? { rotate: [-60, -55, -60], originX: "68px", originY: "180px" }
              : isWaving
              ? { rotate: [-80, -70, -80], originX: "68px", originY: "180px" }
              : { rotate: [10, 14, 10], originX: "68px", originY: "180px" }
            }
            transition={{ duration: isCasting ? 1.5 : 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="52" y="178" width="22" height="55" rx="11" fill="#e8c4a0" />
            {/* Guante negro */}
            <rect x="52" y="225" width="22" height="35" rx="10" fill="#1a0a2e" />
            <ellipse cx="63" cy="262" rx="13" ry="9" fill="#1a0a2e" />
          </motion.g>

          {/* Brazo izquierdo */}
          <motion.g
            animate={isCasting
              ? { rotate: [60, 55, 60], originX: "122px", originY: "180px" }
              : { rotate: [-10, -14, -10], originX: "122px", originY: "180px" }
            }
            transition={{ duration: isCasting ? 1.5 : 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="116" y="178" width="22" height="55" rx="11" fill="#e8c4a0" />
            <rect x="116" y="225" width="22" height="35" rx="10" fill="#1a0a2e" />
            <ellipse cx="127" cy="262" rx="13" ry="9" fill="#1a0a2e" />
          </motion.g>

          {/* Cabeza */}
          <motion.g
            animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Cráneo */}
            <ellipse cx="95" cy="128" rx="32" ry="34" fill="#f0e0d0" />
            {/* Mandíbula */}
            <path d="M68 135 Q70 155 95 160 Q120 155 122 135Z" fill="#f0e0d0" />

            {/* Pelo negro largo */}
            <path d="M65 120 Q63 90 78 72 Q95 58 112 72 Q127 90 125 120 Q115 100 95 97 Q75 100 65 120Z"
              fill="#0d0520" />
            {/* Mechones laterales */}
            <path d="M65 120 Q55 140 52 180 Q58 185 64 178 Q66 145 72 125Z" fill="#0d0520" />
            <path d="M125 120 Q135 140 138 180 Q132 185 126 178 Q124 145 118 125Z" fill="#0d0520" />
            {/* Pelo trasero largo */}
            <path d="M68 130 Q60 180 58 260 Q65 265 72 258 Q74 185 80 140Z" fill="#0d0520" opacity="0.8" />
            <path d="M122 130 Q130 180 132 260 Q125 265 118 258 Q116 185 110 140Z" fill="#0d0520" opacity="0.8" />
            {/* Flequillo */}
            <path d="M68 108 Q80 95 95 98 Q110 95 122 108 Q115 102 95 100 Q75 102 68 108Z" fill="#0d0520" />

            {/* Ojos grandes lila */}
            <ellipse cx="83" cy="122" rx="11" ry="12" fill="#f8f0ff" />
            <ellipse cx="107" cy="122" rx="11" ry="12" fill="#f8f0ff" />
            <ellipse cx="83" cy="122" rx="8" ry="9" fill="#7a3aee" />
            <ellipse cx="107" cy="122" rx="8" ry="9" fill="#7a3aee" />
            <ellipse cx="83" cy="123" rx="5" ry="5.5" fill="#2a0a6e" />
            <ellipse cx="107" cy="123" rx="5" ry="5.5" fill="#2a0a6e" />
            <circle cx="86" cy="119" r="2.5" fill="white" />
            <circle cx="110" cy="119" r="2.5" fill="white" />
            {/* Pestañas */}
            <path d="M73 113 Q78 109 83 111" stroke="#0d0520" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M107 111 Q112 109 117 113" stroke="#0d0520" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Cejas finas */}
            <path d="M73 112 Q83 107 93 110" stroke="#0d0520" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M97 110 Q107 107 117 112" stroke="#0d0520" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Boca */}
            <path d="M87 142 Q95 147 103 142" stroke="#c06080" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M90 142 Q95 145 100 142" fill="#e08090" opacity="0.6" />

            {/* Cuello de piel */}
            <path d="M80 155 Q95 162 110 155" stroke="#f0e0d0" strokeWidth="3" fill="none" />
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
