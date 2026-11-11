"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MiniTrack } from "@/components/marketing/MiniTrack";
import { countryLabel } from "@/lib/catalog";
import {
  CheckIcon,
  ChevronDownIcon,
  CircuitIcon,
  SearchIcon,
} from "@/components/ui/icons";
import type { RaceMeta } from "@/lib/types";

type RacePickerProps = {
  seasons: number[];
  races: RaceMeta[];
  season: number;
  round: number | null;
  onSeasonChange: (season: number) => void;
  onRoundChange: (round: number | null) => void;
};

function roundLabel(round: number) {
  return `R${String(round).padStart(2, "0")}`;
}

export function RacePicker({
  seasons,
  races,
  season,
  round,
  onSeasonChange,
  onRoundChange,
}: RacePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [panelMaxHeight, setPanelMaxHeight] = useState(360);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const seasonRaces = useMemo(
    () =>
      races
        .filter((race) => race.season === season)
        .sort((a, b) => a.round - b.round),
    [races, season],
  );

  const seasonCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const race of races) {
      counts.set(race.season, (counts.get(race.season) ?? 0) + 1);
    }
    return counts;
  }, [races]);

  const selected = useMemo(
    () => seasonRaces.find((race) => race.round === round) ?? null,
    [seasonRaces, round],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seasonRaces;
    return seasonRaces.filter((race) =>
      `${race.eventName} ${race.circuit} ${race.location} ${race.country} ${roundLabel(race.round)}`
        .toLowerCase()
        .includes(q),
    );
  }, [seasonRaces, query]);

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewport = window.innerHeight;
    const spaceBelow = viewport - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const next =
      spaceBelow >= 300 || spaceBelow >= spaceAbove ? "bottom" : "top";
    const space = next === "bottom" ? spaceBelow : spaceAbove;

    setPlacement(next);
    setPanelMaxHeight((previous) => {
      const target = Math.min(380, Math.max(148, Math.round(space)));
      return Math.abs(previous - target) >= 12 ? target : previous;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    updatePlacement();
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return;

    const handleLayout = () => updatePlacement();
    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);

    return () => {
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex((index) =>
      Math.min(index, Math.max(0, filtered.length - 1)),
    );
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const node = list?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    if (!list || !node) return;

    const listRect = list.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    if (nodeRect.top < listRect.top) {
      list.scrollTop -= listRect.top - nodeRect.top;
    } else if (nodeRect.bottom > listRect.bottom) {
      list.scrollTop += nodeRect.bottom - listRect.bottom;
    }
  }, [activeIndex, open]);

  function chooseRace(race: RaceMeta) {
    onRoundChange(race.round);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function chooseSeason(value: number) {
    if (value !== season) onSeasonChange(value);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(0, filtered.length - 1)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const race = filtered[activeIndex];
      if (race) chooseRace(race);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }

  return (
    <div ref={containerRef} className="mt-9 space-y-5">
      <div>
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Season
        </span>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1">
          {seasons.map((option) => {
            const count = seasonCounts.get(option) ?? 0;
            const active = option === season;
            const disabled = count === 0;

            return (
              <button
                key={option}
                type="button"
                onClick={() => chooseSeason(option)}
                disabled={disabled}
                aria-pressed={active}
                className={`relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
                  active ? "text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="season-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.12] to-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_-12px_rgba(0,0,0,0.9)]"
                  />
                ) : null}
                <span className="relative z-10 text-[13px] font-semibold tabular-nums tracking-wide">
                  {option}
                </span>
                <span
                  className={`relative z-10 text-[8px] uppercase tracking-[0.14em] ${
                    active ? "text-pit-red/80" : "text-white/25"
                  }`}
                >
                  {count} rds
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Grand Prix
        </span>
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              if (!open) updatePlacement();
              setOpen((value) => !value);
            }}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            disabled={seasonRaces.length === 0}
            className={`group flex w-full items-center gap-3 rounded-xl border bg-white/[0.03] px-3 py-2.5 text-left outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
              open
                ? "border-pit-red/50 bg-white/[0.05] shadow-[0_0_0_3px_rgba(225,6,0,0.08)]"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.045]"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-black/30 text-pit-red/80">
              <CircuitIcon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
              {selected ? (
                <>
                  <span className="block text-[9px] uppercase tracking-[0.16em] text-white/35">
                    {selected.season} · {roundLabel(selected.round)} ·{" "}
                    {countryLabel(selected.country)}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-medium text-white">
                    {selected.eventName}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-white/30">
                    {selected.circuit} · {selected.location}
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-[9px] uppercase tracking-[0.16em] text-white/30">
                    {season}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-white/45">
                    {seasonRaces.length === 0
                      ? "No replays yet"
                      : "Select a grand prix"}
                  </span>
                </>
              )}
            </span>

            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.08] text-white/35 transition-all duration-300 group-hover:border-white/15 group-hover:text-white/70 ${
                open ? "rotate-180 border-pit-red/40 text-pit-red" : ""
              }`}
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </span>
          </button>

          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: placement === "top" ? 6 : -6,
                  scale: 0.985,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: placement === "top" ? 4 : -4,
                  scale: 0.99,
                }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ maxHeight: panelMaxHeight }}
                className={`absolute inset-x-0 z-40 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d]/95 shadow-[0_28px_70px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl ${
                  placement === "top"
                    ? "bottom-[calc(100%+8px)]"
                    : "top-[calc(100%+8px)]"
                }`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pit-red/60 to-transparent" />

                <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
                  <SearchIcon className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search round, circuit, city..."
                    aria-label="Search grand prix"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                      filtered.length > 0
                        ? `${listId}-option-${activeIndex}`
                        : undefined
                    }
                    className="h-6 w-full bg-transparent text-[12px] text-white placeholder:text-white/25 outline-none"
                  />
                  <kbd className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/25">
                    Esc
                  </kbd>
                </div>

                <div
                  ref={listRef}
                  id={listId}
                  role="listbox"
                  aria-label="Grand prix"
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin]"
                >
                  {filtered.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-[12px] text-white/50">
                        No races match “{query.trim()}”
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">
                        Try a circuit name or round number.
                      </p>
                    </div>
                  ) : (
                    filtered.map((race, index) => {
                      const active = index === activeIndex;
                      const isSelected = race.round === round;

                      return (
                        <button
                          key={race.round}
                          id={`${listId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={-1}
                          data-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => chooseRace(race)}
                          className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                            active ? "bg-white/[0.06]" : "bg-transparent"
                          }`}
                        >
                          <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-black/40">
                            <MiniTrack
                              points={race.trackPreview}
                              className="h-full w-full p-0.5"
                              strokeWidth={7}
                              showStartLine={false}
                              glow={false}
                              live={false}
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span
                                className={`font-mono text-[9px] tabular-nums ${
                                  isSelected ? "text-pit-red" : "text-white/30"
                                }`}
                              >
                                {roundLabel(race.round)}
                              </span>
                              <span className="truncate text-[12px] font-medium text-white/85">
                                {race.eventName}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-white/30">
                              {race.circuit} · {race.location}
                            </span>
                          </span>

                          <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-white/20">
                            {race.laps} laps
                          </span>

                          <span className="grid h-4 w-4 shrink-0 place-items-center">
                            {isSelected ? (
                              <CheckIcon className="h-3.5 w-3.5 text-pit-red" />
                            ) : active ? (
                              <span className="h-1 w-1 rounded-full bg-white/25" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/[0.07] px-3 py-2 text-[8px] uppercase tracking-[0.14em] text-white/25">
                  <span>
                    {filtered.length} round{filtered.length === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-white/10 px-1 py-0.5 font-mono">
                      ↑↓
                    </kbd>
                    navigate
                    <kbd className="ml-1 rounded border border-white/10 px-1 py-0.5 font-mono">
                      ↵
                    </kbd>
                    select
                  </span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
