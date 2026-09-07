"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export type RevealFrom = "up" | "left" | "right";

const EASE = [0.22, 1, 0.36, 1] as const;

function offsetFor(from: RevealFrom, distance: number) {
  if (from === "left") return { x: -distance, y: 0 };
  if (from === "right") return { x: distance, y: 0 };
  return { x: 0, y: distance };
}

type FadeInProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  /** Vertical travel when `from="up"` (default). */
  y?: number;
  /** Horizontal travel when `from` is left/right. */
  distance?: number;
  from?: RevealFrom;
}>;

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.55,
  y = 16,
  distance = 48,
  from = "up",
}: FadeInProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const start =
    from === "up" ? { x: 0, y } : offsetFor(from, distance);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...start }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
