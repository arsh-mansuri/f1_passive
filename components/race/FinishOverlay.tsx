"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { standingsAt } from "@/lib/race";
import type { Race } from "@/lib/types";
import { PlayIcon, RestartIcon } from "@/components/ui/icons";

type FinishOverlayProps = {
  race: Race;
  onReplay: () => void;
  onReplayIntro: () => void;
};

export function FinishOverlay({
  race,
  onReplay,
  onReplayIntro,
}: FinishOverlayProps) {
  const podium = standingsAt(race, race.duration).slice(0, 3);
  const winner = podium[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-5 backdrop-blur-[3px]"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="edge-glow relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e0e] shadow-card"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-pit-red/15 blur-[80px]" />
        <div
          className="h-2 w-full opacity-20"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#fff 0% 25%, #000 0% 50%)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="px-7 pb-7 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-pit-red">
            Chequered flag
          </p>
          <h2 className="mt-3 font-display text-4xl leading-[0.95] text-white">
            <span className="text-pit-red text-glow-red">
              {winner ? winner.code : "—"}
            </span>{" "}
            takes it.
          </h2>
          <p className="mt-2 text-sm text-white/45">
            {winner?.name} · {winner?.team}
          </p>

          <div className="mt-6 space-y-1.5 border-t border-white/[0.08] pt-4">
            {podium.map((driver, index) => (
              <div
                key={driver.code}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5"
              >
                <span className="w-5 text-[10px] font-semibold tabular-nums text-white/25">
                  P{index + 1}
                </span>
                <span
                  className="h-3.5 w-[3px] rounded-full"
                  style={{ backgroundColor: driver.color }}
                />
                <span className="text-[12px] font-semibold tracking-wide text-white/85">
                  {driver.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-white/30">
                  {driver.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-pit-red px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#ff1a12]"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              Replay
            </button>
            <button
              type="button"
              onClick={onReplayIntro}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-[11px] font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              <RestartIcon className="h-3.5 w-3.5" />
              Lights out
            </button>
          </div>

          <Link
            href="/dashboard"
            className="mt-4 block text-center text-[10px] uppercase tracking-[0.16em] text-white/25 transition-colors hover:text-white/60"
          >
            Back to the paddock
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
