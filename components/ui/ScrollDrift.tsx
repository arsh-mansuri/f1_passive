"use client";

import type { ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

type ScrollDriftProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
};

export function ScrollDrift({
  children,
  className = "",
  intensity = 1,
}: ScrollDriftProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, {
    stiffness: 300,
    damping: 55,
    mass: 0.55,
  });

  const y = useTransform(
    smooth,
    [-2200, 0, 2200],
    [9 * intensity, 0, -9 * intensity],
    { clamp: true },
  );

  return (
    <motion.div
      className={className}
      style={reduceMotion ? undefined : { y }}
    >
      {children}
    </motion.div>
  );
}
