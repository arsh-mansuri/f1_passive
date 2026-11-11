"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

type TrackHeroProps = {
  trackPath: string;
};

export function TrackHero({ trackPath }: TrackHeroProps) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(-9);

  const springX = useSpring(x, { stiffness: 44, damping: 22, mass: 0.7 });
  const springY = useSpring(y, { stiffness: 44, damping: 22, mass: 0.7 });
  const springRotate = useSpring(rotate, {
    stiffness: 44,
    damping: 22,
    mass: 0.7,
  });

  useEffect(() => {
    if (reduced) return;

    function handleMove(event: PointerEvent) {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      x.set(nx * -46);
      y.set(ny * -34);
      rotate.set(-9 + nx * 2.4);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reduced, rotate, x, y]);

  return (
    <div className="pointer-events-none absolute -right-[22%] -top-[8%] h-[95vw] w-[95vw] max-h-[1100px] max-w-[1100px]">
      <motion.div
        className="relative h-full w-full opacity-90"
        style={
          reduced
            ? { rotate: -9 }
            : { x: springX, y: springY, rotate: springRotate }
        }
      >
        <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pit-red/[0.055] blur-[120px]" />
        <svg
          viewBox="0 0 1000 1000"
          className="relative h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <filter id="hero-track-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          <path
            d={trackPath}
            fill="none"
            stroke="#1b1b1b"
            strokeWidth="46"
            strokeLinejoin="round"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="#E10600"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeOpacity="0.38"
            pathLength={1}
            className="track-line-animated-slow"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="#E10600"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeOpacity="0.5"
            filter="url(#hero-track-glow)"
            pathLength={1}
            className="track-comet"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="#F5F5F5"
            strokeWidth="1"
            strokeLinejoin="round"
            strokeOpacity="0.16"
            pathLength={1}
            className="track-line-animated"
          />
        </svg>
      </motion.div>
    </div>
  );
}
