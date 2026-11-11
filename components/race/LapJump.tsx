"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
} from "react";
import { clamp } from "@/lib/race";

type LapJumpProps = {
  lap: number;
  laps: number;
  onJump: (lap: number) => void;
  variant?: "compact" | "display";
};

export function LapJump({
  lap,
  laps,
  onJump,
  variant = "compact",
}: LapJumpProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(lap));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(lap));
  }, [lap, editing]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  function begin() {
    setDraft(String(lap));
    setEditing(true);
  }

  function cancel() {
    setDraft(String(lap));
    setEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(draft);

    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(lap));
      inputRef.current?.select();
      return;
    }

    const target = clamp(Math.round(parsed), 1, laps);
    setDraft(String(target));
    setEditing(false);
    onJump(target);
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) {
      cancel();
    }
  }

  const isDisplay = variant === "display";
  const labelClass = isDisplay
    ? "text-[9px] uppercase tracking-[0.2em] text-white/25"
    : "text-[8px] uppercase tracking-[0.18em] text-white/25";
  const valueClass = isDisplay
    ? "font-display text-3xl leading-none text-white"
    : "font-mono text-xs tabular-nums text-white/70 transition-colors group-hover:text-white";
  const totalClass = isDisplay
    ? "ml-1 text-sm text-white/25"
    : "ml-1 text-[10px] text-white/25";
  const inputClass = isDisplay
    ? "w-14 bg-transparent text-left font-display text-3xl leading-none text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    : "w-9 bg-transparent text-right font-mono text-xs tabular-nums text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        onBlur={handleBlur}
        title={`Jump to lap (1-${laps})`}
        className={`flex flex-col ${isDisplay ? "items-start" : "items-end"}`}
      >
        <span className={labelClass}>Lap</span>
        <span className="mt-0.5 flex items-baseline gap-1">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={laps}
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
            aria-label={`Jump to lap, current lap ${lap} of ${laps}`}
            className={inputClass}
          />
          <span className="font-mono text-[10px] text-white/25">/ {laps}</span>
        </span>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={begin}
      title={`Jump to lap (1-${laps})`}
      aria-label={`Jump to lap, current lap ${lap} of ${laps}`}
      className={`group flex flex-col ${
        isDisplay ? "items-start" : "items-end"
      } cursor-text rounded-md outline-none transition-colors focus-visible:ring-1 focus-visible:ring-pit-red/50`}
    >
      <span className={`${labelClass} transition-colors group-hover:text-white/40`}>
        Lap
      </span>
      <span className={`mt-0.5 ${valueClass}`}>
        {String(lap).padStart(2, "0")}
        <span className={totalClass}>/ {laps}</span>
      </span>
    </button>
  );
}
