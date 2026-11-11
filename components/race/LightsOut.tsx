"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type LightsOutProps = {
  eventName: string;
  circuit: string;
  round: number;
  season: number;
  trackPath: string;
  onComplete: () => void;
};

const LIGHT_COUNT = 5;

export function LightsOut({
  eventName,
  circuit,
  round,
  season,
  trackPath,
  onComplete,
}: LightsOutProps) {
  const [lit, setLit] = useState(0);
  const [extinguished, setExtinguished] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(() => onCompleteRef.current(), 380);
  }, []);

  useEffect(() => {
    const timers: number[] = [];

    for (let light = 1; light <= LIGHT_COUNT; light += 1) {
      timers.push(
        window.setTimeout(() => setLit(light), 600 + light * 1000),
      );
    }

    timers.push(
      window.setTimeout(() => {
        setExtinguished(true);
        setShowTitle(true);
      }, 6200),
    );

    timers.push(window.setTimeout(() => finish(), 9600));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#060606]"
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      aria-label="Lights out sequence"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-lines opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[80vw] w-[80vw] max-h-[900px] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg]">
          <svg
            viewBox="0 0 1000 1000"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <path
              d={trackPath}
              fill="none"
              stroke="#1c1c1c"
              strokeWidth="30"
              strokeLinejoin="round"
            />
            <path
              d={trackPath}
              fill="none"
              stroke="#E10600"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeOpacity="0.5"
              pathLength={1}
              className="track-line-animated"
            />
          </svg>
        </div>
        <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pit-red/[0.07] blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6">
        <AnimatePresence mode="wait">
          {!showTitle ? (
            <motion.div
              key="lights"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
                {circuit} · {season} · Round {round}
              </p>

              <div className="relative rounded-2xl border border-white/[0.1] bg-[#101010] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.8)] sm:px-8 sm:py-7">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center gap-3 sm:gap-5">
                  {Array.from({ length: LIGHT_COUNT }).map((_, index) => {
                    const isOn = !extinguished && lit > index;
                    return (
                      <div
                        key={index}
                        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-black/70 sm:h-[72px] sm:w-[72px]"
                      >
                        <motion.span
                          className="block rounded-full"
                          animate={{
                            width: isOn ? "72%" : "62%",
                            height: isOn ? "72%" : "62%",
                            backgroundColor: isOn ? "#FF1A12" : "#210706",
                            boxShadow: isOn
                              ? "0 0 28px 8px rgba(225,6,0,0.65), inset 0 0 14px rgba(255,255,255,0.35)"
                              : "inset 0 2px 8px rgba(0,0,0,0.9)",
                          }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        />
                        {isOn ? (
                          <motion.span
                            className="absolute inset-0 rounded-full border border-pit-red/40"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.25 }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">
                {extinguished
                  ? "Lights out"
                  : lit === 0
                    ? "Formation complete"
                    : `${lit} of ${LIGHT_COUNT} lights`}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-pit-red">
                Lights out
              </p>
              <h1 className="font-display text-[clamp(2.4rem,7.6vw,6.6rem)] uppercase leading-[0.9] text-white">
                {eventName}
                <br />
                is <span className="text-pit-red">underway.</span>
              </h1>
              <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.24em] text-white/30">
                {circuit} · Round {round} · {season}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-6 right-6 rounded-full border border-white/10 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/35 transition-colors hover:border-white/25 hover:text-white/70"
      >
        Skip intro
      </button>
    </motion.div>
  );
}
