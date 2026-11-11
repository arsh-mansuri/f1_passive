"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { AmbientCounter } from "./AmbientCounter";
import { FinishOverlay } from "./FinishOverlay";
import { LapJump } from "./LapJump";
import { LightsOut } from "./LightsOut";
import { PointerGlow } from "./PointerGlow";
import { RaceCanvas, type RaceCanvasHandle } from "./RaceCanvas";
import { RaceControls } from "./RaceControls";
import { SidePanel } from "./SidePanel";
import { buildPathD } from "@/lib/track";
import { clamp, lapAt, lapStartAt, raceClock } from "@/lib/race";
import type { PlaybackSpeed, Race, RaceFeedItem } from "@/lib/types";

type RaceTheatreProps = {
  race: Race;
};

const FEED_LIMIT = 40;

export function RaceTheatre({ race }: RaceTheatreProps) {
  const [introDone, setIntroDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [ambient, setAmbient] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [uiT, setUiT] = useState(0);
  const [feed, setFeed] = useState<RaceFeedItem[]>([]);
  const [finished, setFinished] = useState(false);

  const tRef = useRef(0);
  const cursorRef = useRef(0);
  const uiStampRef = useRef(0);
  const canvasRef = useRef<RaceCanvasHandle>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setPanelOpen(false);
    }
  }, []);

  const trackPath = useMemo(
    () => buildPathD(race.trackPoints),
    [race.trackPoints],
  );

  const lap = lapAt(race, uiT);
  const clock = raceClock(uiT);
  const progress = Math.max(0, Math.min(1, uiT / Math.max(1, race.duration)));

  const flushFeed = useCallback(
    (upTo: number, force = false) => {
      const events = race.events;
      const items: RaceFeedItem[] = [];

      while (
        cursorRef.current < events.length &&
        (force || events[cursorRef.current].t <= upTo)
      ) {
        const index = cursorRef.current;
        items.push({
          id: `${index}-${events[index].t}`,
          event: events[index],
        });
        cursorRef.current += 1;
      }

      if (items.length > 0) {
        setFeed((previous) =>
          [...items.reverse(), ...previous].slice(0, FEED_LIMIT),
        );
      }
    },
    [race.events],
  );

  useEffect(() => {
    if (!introDone || !playing || finished) return;

    let raf = 0;
    let last: number | null = null;

    const tick = (timestamp: number) => {
      if (last === null) last = timestamp;
      const delta = Math.min(0.25, (timestamp - last) / 1000);
      last = timestamp;

      const next = Math.min(race.duration, tRef.current + delta * speed);
      tRef.current = next;
      canvasRef.current?.render(next);

      if (timestamp - uiStampRef.current > 160) {
        uiStampRef.current = timestamp;
        setUiT(next);
        flushFeed(next);
      }

      if (next >= race.duration) {
        setUiT(race.duration);
        flushFeed(race.duration, true);
        setPlaying(false);
        setFinished(true);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    introDone,
    playing,
    speed,
    finished,
    race.duration,
    flushFeed,
  ]);

  const handleIntroComplete = useCallback(() => {
    tRef.current = 0;
    cursorRef.current = 0;
    setUiT(0);
    setFeed([]);
    setFinished(false);
    setIntroDone(true);
    setPlaying(true);
    canvasRef.current?.reset(0);
  }, []);

  const restart = useCallback(() => {
    tRef.current = 0;
    cursorRef.current = 0;
    setUiT(0);
    setFeed([]);
    setFinished(false);
    setPlaying(true);
    canvasRef.current?.reset(0);
  }, []);

  const replayIntro = useCallback(() => {
    tRef.current = 0;
    cursorRef.current = 0;
    setUiT(0);
    setFeed([]);
    setFinished(false);
    setPlaying(false);
    setIntroDone(false);
    canvasRef.current?.reset(0);
  }, []);

  const jumpToLap = useCallback(
    (targetLap: number) => {
      const lapNumber = clamp(Math.round(targetLap), 1, race.laps);
      const target = lapStartAt(race, lapNumber);
      let cursor = 0;

      while (
        cursor < race.events.length &&
        race.events[cursor].t <= target
      ) {
        cursor += 1;
      }

      const start = Math.max(0, cursor - FEED_LIMIT);

      tRef.current = target;
      cursorRef.current = cursor;
      setUiT(target);
      setFeed(
        race.events
          .slice(start, cursor)
          .map((event, index) => ({
            id: `${start + index}-${event.t}`,
            event,
          }))
          .reverse(),
      );
      setFinished(false);
      if (finished) setPlaying(true);
      canvasRef.current?.reset(target);
    },
    [finished, race],
  );

  const togglePlay = useCallback(() => {
    if (finished) return;
    setPlaying((value) => !value);
  }, [finished]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          target.tagName,
        ) ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        if (introDone && !finished) setPlaying((value) => !value);
      } else if (event.key.toLowerCase() === "r") {
        if (introDone) restart();
      } else if (event.key.toLowerCase() === "a") {
        setAmbient((value) => !value);
      } else if (event.key === "Escape") {
        setAmbient(false);
      } else if (event.key === "1") {
        setSpeed(1);
      } else if (event.key === "2") {
        setSpeed(2);
      } else if (event.key === "4") {
        setSpeed(4);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [introDone, finished, restart]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#070707]">
      <div className="flex h-full w-full">
        <div className="relative min-w-0 flex-1">
          <RaceCanvas ref={canvasRef} race={race} />
          {!ambient ? <PointerGlow className="hidden md:block" /> : null}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/75 via-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {!ambient ? (
            <div className="pointer-events-none absolute inset-3 z-[9] hidden md:block">
              {[
                "left-0 top-0 border-l border-t",
                "right-0 top-0 border-r border-t",
                "bottom-0 left-0 border-b border-l",
                "bottom-0 right-0 border-b border-r",
              ].map((position) => (
                <span
                  key={position}
                  className={`absolute h-4 w-4 border-white/15 ${position}`}
                />
              ))}
            </div>
          ) : null}

          {!ambient ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Logo href="/dashboard" showWordmark={false} />
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-medium uppercase tracking-[0.18em] text-white/35">
                    {race.season} &middot; Round {race.round} &middot; {race.location}
                  </p>
                  <h1 className="truncate text-[13px] font-semibold tracking-tight text-white sm:text-sm">
                    {race.eventName}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden sm:block">
                  <LapJump lap={lap} laps={race.laps} onJump={jumpToLap} />
                </div>
                <div className="edge-glow flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/45 px-3 py-1.5 backdrop-blur-md">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      finished
                        ? "bg-white"
                        : playing
                          ? "animate-blink-slow bg-pit-red shadow-red-glow-sm"
                          : "bg-amber-300"
                    }`}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    {finished ? "Flag" : playing ? "Live" : "Paused"}
                  </span>
                </div>
                <span className="hidden rounded-full border border-white/[0.06] bg-black/30 px-3 py-1.5 font-mono text-xs tabular-nums text-white/45 backdrop-blur md:inline">
                  {clock}
                </span>
              </div>
            </motion.div>
          ) : null}

          {!ambient ? (
            <RaceControls
              playing={playing}
              finished={finished}
              speed={speed}
              ambient={ambient}
              panelOpen={panelOpen}
              lap={lap}
              laps={race.laps}
              onTogglePlay={togglePlay}
              onRestart={restart}
              onSpeed={setSpeed}
              onToggleAmbient={() => setAmbient((value) => !value)}
              onTogglePanel={() => setPanelOpen((value) => !value)}
              onJumpToLap={jumpToLap}
            />
          ) : (
            <AmbientCounter
              lap={lap}
              laps={race.laps}
              clock={clock}
              finished={finished}
              onExit={() => setAmbient(false)}
            />
          )}

          {!ambient ? (
            <div className="pointer-events-none absolute bottom-24 left-6 z-[14] hidden items-baseline gap-2 lg:flex">
              <span className="font-display text-5xl leading-none text-white/[0.09]">
                {String(lap).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                / {race.laps} laps
              </span>
            </div>
          ) : null}

          {!ambient ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[2px] bg-white/[0.04]">
              <div
                className="relative h-full bg-gradient-to-r from-pit-red to-[#ff4a42] shadow-[0_0_12px_rgba(225,6,0,0.6)] transition-[width] duration-150 ease-linear"
                style={{ width: `${progress * 100}%` }}
              >
                <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-red-glow-sm" />
              </div>
            </div>
          ) : null}

          {!ambient && finished ? (
            <FinishOverlay
              race={race}
              onReplay={restart}
              onReplayIntro={replayIntro}
            />
          ) : null}
        </div>

        {!ambient && panelOpen ? (
          <button
            type="button"
            aria-label="Close timing panel"
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[1px] lg:hidden"
          />
        ) : null}

        <AnimatePresence initial={false}>
          {!ambient && panelOpen ? (
            <motion.aside
              key="timing-panel"
              initial={{ x: 36, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 36, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-30 w-[340px] max-w-[88vw] lg:relative lg:inset-auto lg:z-10 lg:w-[340px] lg:max-w-none"
            >
              <SidePanel
                race={race}
                t={uiT}
                feed={feed}
                onClose={() => setPanelOpen(false)}
                onJumpToLap={jumpToLap}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      {!introDone ? (
        <LightsOut
          eventName={race.eventName}
          circuit={race.circuit}
          round={race.round}
          season={race.season}
          trackPath={trackPath}
          onComplete={handleIntroComplete}
        />
      ) : null}
    </div>
  );
}
