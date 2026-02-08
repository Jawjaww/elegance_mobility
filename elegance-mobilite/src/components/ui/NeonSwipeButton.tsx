"use client";

import {
  motion,
  useMotionValue,
  useAnimationFrame,
  animate,
} from "framer-motion";
import { useState } from "react";

export function NeonSwipeButton({ onConfirm }: { onConfirm: () => void }) {
  const x = useMotionValue(0);
  const [vibrated, setVibrated] = useState(false);
  const threshold = 140;
  const containerWidth = 200;

  useAnimationFrame(() => {
    const currentX = x.get();
    if (currentX > threshold && !vibrated) {
      if ("vibrate" in navigator) navigator.vibrate(15);
      setVibrated(true);
    } else if (currentX < threshold && vibrated) {
      setVibrated(false);
    }
  });

  const handleDragEnd = async () => {
    const currentX = x.get();

    if (currentX > threshold) {
      if ("vibrate" in navigator) navigator.vibrate([20, 40]);
      await animate(x, containerWidth, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
      setTimeout(onConfirm, 150);
    } else {
      await animate(x, 0, {
        type: "spring",
        stiffness: 800,
        damping: 35,
        mass: 0.6,
      });
    }
  };

  return (
    <div className="w-full max-w-[260px] mx-auto select-none">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: containerWidth }}
        dragMomentum={false}
        dragElastic={0}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative h-12 w-full rounded-full flex items-center overflow-hidden cursor-grab active:cursor-grabbing"
        animate={{
          boxShadow: [
            "0 0 20px rgba(34, 197, 94, 0.4)",
            "0 0 40px rgba(34, 197, 94, 0.7)",
            "0 0 20px rgba(34, 197, 94, 0.4)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Fond dégradé multi-verts vibrant */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400" />

        {/* Gradient animé qui bouge */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background: "linear-gradient(90deg, #00ff88, #00cc66, #00ff88)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Gradient blanc réduit (top-1 bottom-1) qui disparaît dans le vert */}
        <div
          className="absolute top-1 bottom-1 left-1 right-[30%] rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 100%)",
            zIndex: 12,
          }}
        />

        {/* Glass overlay subtil */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        />

        {/* Contenu texte */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-white text-[10px] font-black tracking-tighter uppercase pointer-events-none z-20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <span>Glisser pour accepter</span>
          <motion.span
            className="text-sm opacity-80"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ≫≫≫
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}
