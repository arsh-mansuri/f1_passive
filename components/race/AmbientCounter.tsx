"use client";

import { motion } from "framer-motion";

type AmbientCounterProps = {
  lap: number;
  laps: number;
  clock: string;
  finished: boolean;
  onExit: () => void;
};

export function AmbientCounter({
  lap,
  laps,
  clock,
  finished,
  onExit,
}: AmbientCounterProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute bottom-5 left-5 z-20 flex items-end gap-3 sm:bottom-7 sm:left-7"
      >
        <span
          className={`mb-1.5 h-1.5 w-1.5 rounded-full ${
            finished ? "bg-white" : "bg-pit-red shadow-red-glow-sm"
          }`}
        />
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl leading-none text-white sm:text-5xl">
              {String(lap).padStart(2, "0")}
            </span>
            <span className="text-[11px] tabular-nums text-white/25">
              / {laps}
            </span>
          </div>
          <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-white/25">
            {finished ? "Chequered flag" : "Lap"} · {clock}
          </p>
        </div>
      </motion.div>

      <button
        type="button"
        onClick={onExit}
        title="Exit ambient mode (A)"
        className="absolute bottom-5 right-5 z-20 rounded-full border border-white/[0.06] px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-white/15 transition-all duration-300 hover:border-white/20 hover:text-white/60 sm:bottom-7 sm:right-7"
      >
        Exit ambient
      </button>
    </>
  );
}
