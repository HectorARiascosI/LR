"use client";
/**
 * PhotoCard — Tarjeta de foto con efecto cinematográfico
 * - Parallax suave al hover
 * - Borde con glow animado
 * - Overlay de gradiente
 * - Aparece con animación desde abajo
 */
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

interface PhotoCardProps {
  src: string;
  alt: string;
  caption?: string;
  glowColor?: string;
  size?: "sm" | "md" | "lg" | "full";
  delay?: number;
}

export default function PhotoCard({
  src, alt, caption, glowColor = "#d4b8ff", size = "md", delay = 0,
}: PhotoCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const sizes = {
    sm:   { w: 220, h: 280 },
    md:   { w: 300, h: 380 },
    lg:   { w: 360, h: 460 },
    full: { w: 420, h: 520 },
  };
  const { w, h } = sizes[size];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        perspective: 800,
        display: "inline-block",
      }}
    >
      <motion.div
        animate={{ rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          position: "relative",
          width: w,
          height: h,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: `0 0 0 1px ${glowColor}33, 0 8px 40px rgba(0,0,0,0.5), 0 0 30px ${glowColor}22`,
          cursor: "default",
        }}
      >
        {/* Borde glow animado */}
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: 0, zIndex: 3,
            borderRadius: 18,
            border: `1px solid ${glowColor}55`,
            pointerEvents: "none",
          }}
        />

        {/* Foto */}
        <Image
          src={src}
          alt={alt}
          fill
          style={{ objectFit: "cover", objectPosition: "center top" }}
          sizes={`${w}px`}
        />

        {/* Overlay gradiente inferior */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: caption ? "45%" : "25%",
          background: `linear-gradient(to top, rgba(3,1,15,0.88) 0%, transparent 100%)`,
          zIndex: 2,
        }} />

        {/* Caption */}
        {caption && (
          <div style={{
            position: "absolute", bottom: "1rem", left: "1rem", right: "1rem",
            zIndex: 4, textAlign: "center",
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(0.85rem, 2vw, 1.05rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.5,
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            }}>
              {caption}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
