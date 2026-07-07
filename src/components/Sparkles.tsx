"use client";
import { AnimatePresence, motion } from "motion/react";

// A short, celebratory sparkle burst. Re-mounts whenever `trigger` changes
// (e.g. a new illustrated page), animating a handful of stars outward.
const PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return { dx: Math.cos(angle) * 120, dy: Math.sin(angle) * 120, delay: (i % 5) * 0.03 };
});

export function Sparkles({ trigger }: { trigger: string | number }) {
  return (
    <AnimatePresence>
      <motion.div
        key={trigger}
        className="no-print"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            style={{ position: "absolute", fontSize: 22 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{ x: p.dx, y: p.dy, scale: [0, 1.1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          >
            ✨
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
