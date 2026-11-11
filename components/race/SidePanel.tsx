"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LapJump } from "./LapJump";
import { lapAt, lastName, raceClock, standingsAt } from "@/lib/race";
import type { Race, RaceEvent, RaceFeedItem } from "@/lib/types";

type SidePanelProps = {
  race: Race;
  t: number;
  feed: RaceFeedItem[];
  onClose: () => void;
  onJumpToLap: (lap: number) => void;
};

function typeLabel(type: RaceEvent["type"]): string {
  switch (type) {
    case "lead_change":
      return "Lead";
    case "pit":
      return "Pit";
    case "start":
      return "Start";
    case "finish":
      return "Flag";
    default:
      return "Pass";
  }
}

function typeClass(type: RaceEvent["type"]): string {
  switch (type) {
    case "lead_change":
      return "border-pit-red/30 bg-pit-red/15 text-red-200";
    case "pit":
      return "border-amber-300/25 bg-amber-300/10 text-amber-200/80";
    case "start":
      return "border-white/15 bg-white/10 text-white/70";
    case "finish":
      return "border-emerald-300/25 bg-emerald-300/10 text-emerald-200/80";
    default:
      return "border-white/10 bg-white/[0.06] text-white/55";
  }
}

function typeAccent(type: RaceEvent["type"]): string {
  switch (type) {
    case "lead_change":
      return "border-l-pit-red/80";
    case "pit":
      return "border-l-amber-300/60";
    case "start":
      return "border-l-white/40";
    case "finish":
      return "border-l-emerald-300/60";
    default:
      return "border-l-white/20";
  }
}

export function SidePanel({
  race,
  t,
  feed,
  onClose,
  onJumpToLap,
}: SidePanelProps) {
  const lap = lapAt(race, t);
  const standings = standingsAt(race, t);

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden border-l border-white/[0.07] bg-[#0b0b0b]/95 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_30%_0%,rgba(225,6,0,0.1),transparent_62%)]" />
      <div className="relative flex items-start justify-between border-b border-white/[0.07] px-5 pb-4 pt-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pit-red opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pit-red" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Live timing
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-white/85">
            {race.eventName}{" "}
            <span className="text-white/25">
              &middot; {race.season} R{String(race.round).padStart(2, "0")}
            </span>
          </p>
          <p className="mt-1 text-[9px] text-white/30">
            {race.circuit} &middot; {race.location}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close timing panel"
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-white/35 transition-colors hover:border-white/20 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="flex items-end justify-between border-b border-white/[0.07] px-5 py-4">
        <LapJump
          variant="display"
          lap={lap}
          laps={race.laps}
          onJump={onJumpToLap}
        />
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/25">
            Race time
          </p>
          <p className="mt-1 font-mono text-lg tabular-nums leading-none text-white/80">
            {raceClock(t)}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-[1.08] flex-col border-b border-white/[0.07]">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Standings
          </span>
          <span className="text-[9px] uppercase tracking-[0.14em] text-white/20">
            Gap
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          <ol className="space-y-px">
            {standings.map((driver, index) => {
              const position = index + 1;
              const isLeader = position === 1;
              return (
                <motion.li
                  key={driver.code}
                  layout="position"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={`group grid grid-cols-[18px_3px_36px_1fr_52px] items-center gap-2 rounded-md px-1.5 py-[5px] transition-colors hover:bg-white/[0.03] ${
                    isLeader ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <span
                    className={`text-right text-[10px] tabular-nums ${
                      isLeader ? "font-semibold text-pit-red" : "text-white/30"
                    }`}
                  >
                    {position}
                  </span>
                  <span
                    className="h-3.5 w-[3px] rounded-full transition-shadow group-hover:shadow-[0_0_10px_currentColor]"
                    style={{ backgroundColor: driver.color, color: driver.color }}
                  />
                  <span className="text-[11px] font-semibold tracking-wide text-white/90">
                    {driver.code}
                  </span>
                  <span className="truncate text-[10px] text-white/35">
                    {lastName(driver.name)}
                  </span>
                  <span
                    className="flex items-center justify-end gap-1.5 font-mono text-[9px] tabular-nums text-white/30"
                    title="Stylised gap"
                  >
                    {isLeader ? (
                      <span className="flex items-center gap-1 text-pit-red/80">
                        <span className="h-1 w-1 animate-soft-pulse rounded-full bg-pit-red" />
                        LEADER
                      </span>
                    ) : (
                      <>
                        <span
                          className="h-[2px] rounded-full bg-white/15"
                          style={{
                            width: `${Math.min(16, 4 + position * 0.9)}px`,
                          }}
                        />
                        <span>+{((position - 1) * 0.68).toFixed(1)}s</span>
                      </>
                    )}
                  </span>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Race radio
          </span>
          <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-white/25">
            Pre-baked
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
          {feed.length === 0 ? (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 flex gap-1.5">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-white/25"
                    style={{ animationDelay: `${index * 0.25}s` }}
                  />
                ))}
              </span>
              <p className="text-[11px] leading-5 text-white/30">
                Radio silence. The lights are about to go out.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {feed.map((item) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className={`rounded-xl border border-l-2 border-white/[0.07] bg-white/[0.025] px-3 py-2.5 transition-colors hover:bg-white/[0.04] ${typeAccent(
                      item.event.type,
                    )}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] ${typeClass(item.event.type)}`}
                      >
                        {typeLabel(item.event.type)}
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.14em] text-white/20">
                        Lap {item.event.lap}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-medium leading-[1.45] text-white/80">
                      {item.event.commentary}
                    </p>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-5 py-2.5">
          <p className="text-[8px] uppercase tracking-[0.14em] text-white/15">
            Commentary baked at build time · no live calls
          </p>
        </div>
      </div>
    </aside>
  );
}
