"use client";

import {
  motion,
  useAnimate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

type Props = {
  durationMs: number;
  startKey?: unknown;
  onExpire?: () => void;
  className?: string;
};

export function NeonProgress({
  durationMs,
  startKey,
  onExpire,
  className,
}: Props) {
  const [scope, animate] = useAnimate();
  const progress = useMotionValue(0);

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: durationMs / 1000,
      ease: "linear",
      onComplete: onExpire,
    });
    return () => controls.stop();
  }, [durationMs, startKey, animate, progress, onExpire]);

  // Positions des "gouttes" de couleur qui se déplacent
  const blob1X = useMotionValue(-20);
  const blob2X = useMotionValue(-40);
  const blob3X = useMotionValue(-60);

  useEffect(() => {
    // Les blobs glissent de gauche à droite en boucle
    const b1 = animate(blob1X, [0, 120], {
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    });
    const b2 = animate(blob2X, [0, 120], {
      duration: 4,
      repeat: Infinity,
      ease: "linear",
      delay: 1,
    });
    const b3 = animate(blob3X, [0, 120], {
      duration: 2.5,
      repeat: Infinity,
      ease: "linear",
      delay: 0.5,
    });

    return () => {
      b1.stop();
      b2.stop();
      b3.stop();
    };
  }, [blob1X, blob2X, blob3X, animate]);

  // Masque les blobs avant le début de la barre
  const currentWidth = useTransform(progress, (v) => `${v}%`);

  return (
    <div
      ref={scope}
      className={`relative h-1.5 w-full overflow-hidden rounded-full bg-slate-950/90 border border-green-500/30 ${className}`}
    >
      {/* Conteneur qui se remplit */}
      <motion.div
        className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
        style={{ width: currentWidth }}
      >
        {/* Gradient de base */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500" />

        {/* BLOB 1 - Vert fluo */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-xl"
          style={{
            left: useTransform(blob1X, (v) => `${v}%`),
            background: "radial-gradient(circle, #00ff88 0%, transparent 70%)",
            opacity: 0.9,
          }}
        />

        {/* BLOB 2 - Cyan */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-lg"
          style={{
            left: useTransform(blob2X, (v) => `${v}%`),
            background: "radial-gradient(circle, #00ffcc 0%, transparent 70%)",
            opacity: 0.8,
          }}
        />

        {/* BLOB 3 - Vert lime */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl"
          style={{
            left: useTransform(blob3X, (v) => `${v}%`),
            background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
            opacity: 0.7,
          }}
        />

        {/* Ligne de lumière au bord */}
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-2"
          style={{
            background:
              "linear-gradient(180deg, transparent, #53ffaf, transparent)",
            boxShadow: "0 0 20px #00ff88, 0 0 40px #00ff88",
          }}
        />
      </motion.div>

      {/* Glow externe qui suit */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 h-8 w-1 rounded-full blur-xl bg-green-400"
        style={{
          left: currentWidth,
          opacity: useTransform(progress, [0, 5, 100], [0, 1, 1]),
        }}
      />
    </div>
  );
}
