"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export type SwipeVariant = "emerald" | "amber" | "indigo";

/**
 * Same chrome as Expo NeonSwipeButton / login Sign In pill:
 * vibrant gradient + left white sheen + glow. Only colors / label change.
 */
const VARIANT: Record<
  SwipeVariant,
  { track: string; glow: string; knobIcon: string }
> = {
  emerald: {
    track: "linear-gradient(90deg, #10b981, #4ade80, #2dd4bf)",
    glow: "rgba(34, 197, 94, 0.55)",
    knobIcon: "#059669",
  },
  amber: {
    track: "linear-gradient(90deg, #f59e0b, #fbbf24, #fb923c)",
    glow: "rgba(245, 158, 11, 0.55)",
    knobIcon: "#d97706",
  },
  indigo: {
    track: "linear-gradient(90deg, #6366f1, #818cf8, #22d3ee)",
    glow: "rgba(99, 102, 241, 0.55)",
    knobIcon: "#4f46e5",
  },
};

const BUTTON_HEIGHT = 56;
const KNOB = BUTTON_HEIGHT - 8;

type NeonSwipeButtonProps = Readonly<{
  onConfirm: () => void;
  label?: string;
  variant?: SwipeVariant;
  resetKey?: string;
}>;

export function NeonSwipeButton({
  onConfirm,
  label,
  variant = "emerald",
  resetKey,
}: NeonSwipeButtonProps) {
  const colors = VARIANT[variant];
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(280);
  const [done, setDone] = useState(false);
  const x = useMotionValue(0);
  const maxTravel = Math.max(trackWidth - KNOB - 8, 0);
  const threshold = maxTravel * 0.6;
  const labelOpacity = useTransform(
    x,
    [0, Math.max(threshold / 2, 1)],
    [1, 0],
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setTrackWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setDone(false);
    void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }, [resetKey, x]);

  const confirmOnce = useCallback(() => {
    if (done) return;
    setDone(true);
    if ("vibrate" in navigator) navigator.vibrate([20, 40]);
    onConfirm();
  }, [done, onConfirm]);

  const handleDragEnd = async () => {
    if (done) return;
    if (x.get() > threshold) {
      await animate(x, maxTravel, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
      confirmOnce();
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
    <div
      ref={trackRef}
      className="relative w-full select-none overflow-hidden"
      style={{
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        boxShadow: `0 0 20px ${colors.glow}`,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: colors.track }}
        aria-hidden
      />

      {/* Sign In white glass sheen */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          left: 4,
          right: "30%",
          top: 4,
          bottom: 4,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 100%)",
        }}
        aria-hidden
      />

      <motion.div
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none px-14"
        style={{ opacity: labelOpacity }}
      >
        {label ? (
          <span className="text-white text-sm font-black uppercase tracking-tighter drop-shadow-md truncate">
            {label}
          </span>
        ) : (
          <span className="flex items-center text-white text-xl font-black tracking-tighter drop-shadow-md">
            <span className="opacity-95">≫</span>
            <span className="opacity-65 -ml-1">≫</span>
            <span className="opacity-35 -ml-1">≫</span>
          </span>
        )}
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxTravel }}
        dragMomentum={false}
        dragElastic={0}
        style={{
          x,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          top: 4,
          left: 4,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(241,245,249,0.32))",
          border: "1px solid rgba(255,255,255,0.45)",
        }}
        onDragEnd={() => {
          void handleDragEnd();
        }}
        className="absolute z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.knobIcon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.div>
    </div>
  );
}
