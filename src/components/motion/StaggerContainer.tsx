"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { RevealFrom } from "@/components/motion/FadeIn";

const EASE = [0.22, 1, 0.36, 1] as const;

function hiddenOffset(from: RevealFrom, distance: number) {
  if (from === "left") return { opacity: 0, x: -distance, y: 0 };
  if (from === "right") return { opacity: 0, x: distance, y: 0 };
  return { opacity: 0, x: 0, y: Math.min(distance, 18) };
}

type StaggerContainerProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}>;

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
}: StaggerContainerProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: 0.06 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  from?: RevealFrom;
  distance?: number;
}>;

export function StaggerItem({
  children,
  className,
  from = "up",
  distance = 36,
}: StaggerItemProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const hidden = hiddenOffset(from, distance);

  return (
    <motion.div
      className={className}
      variants={{
        hidden,
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.5, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
