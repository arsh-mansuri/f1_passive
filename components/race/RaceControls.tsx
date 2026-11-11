"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AmbientIcon,
  ArrowLeftIcon,
  PanelIcon,
  PauseIcon,
  PlayIcon,
  RestartIcon,
} from "@/components/ui/icons";
import type { PlaybackSpeed } from "@/lib/types";

type RaceControlsProps = {
  playing: boolean;
  finished: boolean;
  speed: PlaybackSpeed;
  ambient: boolean;
  panelOpen: boolean;
  lap: number;
  laps: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSpeed: (speed: PlaybackSpeed) => void;
  onToggleAmbient: () => void;
  onTogglePanel: () => void;
  onJumpToLap: (lap: number) => void;
};

const SPEEDS: PlaybackSpeed[] = [1, 2, 4];

function iconButtonClass(active = false): string {
  return `grid h-8 w-8 place-items-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 sm:h-9 sm:w-9 ${
    active
      ? "border-pit-red/40 bg-pit-red/10 text-pit-red shadow-red-glow-sm"
      : "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
  }`;
}

export function RaceControls({
  playing,
  finished,
  speed,
  ambient,
  panelOpen,
  lap,
  laps,
  onTogglePlay,
  onRestart,
  onSpeed,
  onToggleAmbient,
  onTogglePanel,
  onJumpToLap,
}: RaceControlsProps) {
  const [lapInput, setLapInput] = useState(String(lap));
  const lapInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== lapInputRef.current) {
      setLapInput(String(lap));
    }
  }, [lap]);

  function handleLapSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(lapInput);

    if (lapInput.trim() === "" || !Number.isFinite(parsed)) {
      setLapInput(String(lap));
      lapInputRef.current?.select();
      return;
    }

    const target = Math.max(1, Math.min(laps, Math.round(parsed)));
    setLapInput(String(target));
    onJumpToLap(target);
    lapInputRef.current?.blur();
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="edge-glow pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-white/[0.09] bg-[#0d0d0d]/85 px-1.5 py-1.5 shadow-card backdrop-blur-xl sm:gap-1.5 sm:px-2 sm:py-2"
      >
        <Link
          href="/dashboard"
          title="Back to the paddock"
          aria-label="Back to the paddock"
          className={iconButtonClass()}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>

        <span className="mx-0.5 hidden h-6 w-px bg-white/[0.08] sm:block" />

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={finished}
          title={playing ? "Pause (space)" : "Play (space)"}
          aria-label={playing ? "Pause" : "Play"}
          className="btn-shine grid h-9 w-9 place-items-center rounded-full bg-pit-red text-white shadow-red-glow-sm transition-all duration-300 hover:scale-105 hover:bg-[#ff1a12] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:h-10 sm:w-10"
        >
          {playing ? (
            <PauseIcon className="relative z-[2] h-4 w-4" />
          ) : (
            <PlayIcon className="relative z-[2] ml-0.5 h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onRestart}
          title="Restart (R)"
          aria-label="Restart race"
          className={iconButtonClass()}
        >
          <RestartIcon className="h-4 w-4" />
        </button>

        <form
          onSubmit={handleLapSubmit}
          title={`Jump to lap (1-${laps})`}
          className="hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-black/30 px-2 py-1 sm:flex"
        >
          <label
            htmlFor="lap-jump"
            className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/25"
          >
            Lap
          </label>
          <input
            ref={lapInputRef}
            id="lap-jump"
            type="number"
            min={1}
            max={laps}
            inputMode="numeric"
            value={lapInput}
            onChange={(event) => setLapInput(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={`Jump to lap, current lap ${lap} of ${laps}`}
            className="h-6 w-8 appearance-none bg-transparent text-center font-mono text-[11px] tabular-nums text-white/85 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="font-mono text-[9px] text-white/25">/{laps}</span>
          <button
            type="submit"
            aria-label="Jump to typed lap"
            className="rounded-md px-1.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-pit-red transition-colors hover:bg-pit-red/10"
          >
            Go
          </button>
        </form>

        <span className="mx-0.5 hidden h-6 w-px bg-white/[0.08] sm:block" />

        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.06] bg-black/30 p-0.5">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSpeed(value)}
              title={`${value}x speed`}
              aria-label={`Set speed to ${value}x`}
              aria-pressed={speed === value}
              className={`rounded-lg px-1.5 py-1.5 text-[10px] font-semibold tabular-nums transition-all duration-300 sm:px-2.5 ${
                speed === value
                  ? "scale-105 bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.18)]"
                  : "text-white/35 hover:text-white/75"
              }`}
            >
              {value}×
            </button>
          ))}
        </div>

        <span className="mx-0.5 hidden h-6 w-px bg-white/[0.08] sm:block" />

        <button
          type="button"
          onClick={onToggleAmbient}
          title="Ambient mode (A)"
          aria-label="Toggle ambient mode"
          aria-pressed={ambient}
          className={iconButtonClass(ambient)}
        >
          <AmbientIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onTogglePanel}
          title="Toggle timing panel"
          aria-label="Toggle timing panel"
          aria-pressed={panelOpen}
          className={iconButtonClass(panelOpen)}
        >
          <PanelIcon className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
}
