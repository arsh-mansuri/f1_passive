"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

export function PointerGlow({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const springX = useSpring(x, { stiffness: 60, damping: 24, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 60, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    const element = ref.current;
    if (!element) return;

    function handleMove(event: PointerEvent) {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      x.set(event.clientX - rect.left);
      y.set(event.clientY - rect.top);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reduced, x, y]);

  if (reduced) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(225,6,0,0.1),rgba(225,6,0,0.03)_38%,transparent_66%)] blur-[30px]"
        style={{ left: springX, top: springY }}
      />
    </div>
  );
}
