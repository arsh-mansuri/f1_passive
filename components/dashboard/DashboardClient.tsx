"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { MiniTrack } from "@/components/marketing/MiniTrack";
import { ArrowRightIcon, CircuitIcon, SignOutIcon } from "@/components/ui/icons";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { ScrollDrift } from "@/components/ui/ScrollDrift";
import { RacePicker } from "@/components/dashboard/RacePicker";
import type { RaceMeta, SessionUser } from "@/lib/types";

type DashboardClientProps = {
  races: RaceMeta[];
  user: SessionUser;
};

const SEASON_OPTIONS = [2024, 2025, 2026];

const PREVIEW_COLORS = [
  "#27F4D2",
  "#3671C6",
  "#FF8000",
  "#E8002D",
  "#B6BABD",
  "#64C4FF",
];

const PREVIEW_DOTS = PREVIEW_COLORS.map((color, index) => ({
  fraction: 0.14 + index * 0.055,
  color,
  delay: index * 0.32,
}));

function minutesLabel(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function SignOutButton({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (demo) {
      router.push("/");
      return;
    }

    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
    } catch {
      // The redirect still gets the user out of the protected route.
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-[11px] font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
    >
      <SignOutIcon className="h-3.5 w-3.5" />
      {loading ? "Signing out" : "Sign out"}
    </button>
  );
}

export function DashboardClient({ races, user }: DashboardClientProps) {
  const router = useRouter();

  const initialSeason = useMemo(() => {
    const withRaces = SEASON_OPTIONS.find((season) =>
      races.some((race) => race.season === season),
    );
    return withRaces ?? 2024;
  }, [races]);

  const [season, setSeason] = useState(initialSeason);
  const [round, setRound] = useState<number | null>(() => {
    const first = races
      .filter((race) => race.season === initialSeason)
      .sort((a, b) => a.round - b.round)[0];
    return first?.round ?? null;
  });

  const seasonRaces = useMemo(
    () =>
      races
        .filter((race) => race.season === season)
        .sort((a, b) => a.round - b.round),
    [races, season],
  );

  const selected = useMemo(
    () => seasonRaces.find((race) => race.round === round) ?? null,
    [seasonRaces, round],
  );

  function handleSeasonChange(value: number) {
    setSeason(value);
    const first = races
      .filter((race) => race.season === value)
      .sort((a, b) => a.round - b.round)[0];
    setRound(first?.round ?? null);
  }

  function loadRace(targetSeason = season, targetRound = round) {
    if (!targetSeason || !targetRound) return;
    router.push(`/race/${targetSeason}/${targetRound}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <InteractiveBackground variant="dashboard" density={0.85} fixed />
        <div className="absolute inset-0 grid-lines grid-drift opacity-50" />
        <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-pit-red/[0.06] blur-[140px]" />
        <div className="absolute -left-32 top-[38%] h-[30rem] w-[30rem] rounded-full bg-pit-red/[0.035] blur-[150px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pit-red/40 to-transparent" />
      </div>

      <ScrollDrift className="relative z-10" intensity={0.4}>
        <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" />
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30 sm:block">
              The paddock
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user.demo ? (
              <span className="hidden rounded-full border border-amber-300/25 bg-amber-300/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200/80 sm:inline">
                Preview mode
              </span>
            ) : null}
            <span className="hidden max-w-[220px] truncate text-[11px] text-white/40 md:inline">
              {user.email}
            </span>
            <SignOutButton demo={Boolean(user.demo)} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-14 lg:px-10 lg:pt-20">
        {user.demo ? (
          <div className="mb-8 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] px-4 py-3 text-[11px] leading-5 text-amber-100/60">
            You are previewing PitWall without Supabase. Auth is bypassed via{" "}
            <code className="text-amber-100/90">PITWALL_DEMO=1</code>. Unset it
            for real accounts.
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-16"
        >
          <div className="relative z-20">
            <p className="eyebrow mb-4">Round selection</p>
            <h1 className="font-display text-[clamp(2.6rem,5.5vw,4.6rem)] leading-[0.95] text-white">
              Choose
              <br />
              your race.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-pit-muted">
              Two clicks. Then the lights. Every replay is baked to static JSON
              — no live feeds, no buffering, no waiting for the broadcast.
            </p>

            <RacePicker
              seasons={SEASON_OPTIONS}
              races={races}
              season={season}
              round={round}
              onSeasonChange={handleSeasonChange}
              onRoundChange={setRound}
            />

            <button
              type="button"
              onClick={() => loadRace()}
              disabled={!selected}
              className="btn-shine group mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-pit-red text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-red-glow-sm transition-all duration-300 hover:bg-[#ff1a12] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/30 disabled:shadow-none"
            >
              <span className="relative z-[2] flex items-center gap-3">
                Load race
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </button>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-white/25">
              <span className="inline-flex items-center gap-1.5">
                <CircuitIcon className="h-3.5 w-3.5" />
                {seasonRaces.length} replay{seasonRaces.length === 1 ? "" : "s"}
              </span>
              <span>Static JSON</span>
              <span>Works offline</span>
            </div>
          </div>

          <div>
            {selected ? (
              <motion.div
                key={`${selected.season}-${selected.round}`}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="edge-glow relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0e0e0e] shadow-card"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                  <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pit-red opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pit-red" />
                    </span>
                    Selected replay
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-white/35">
                    Round {selected.round}
                  </span>
                </div>

                <div className="relative aspect-[1.18/1] overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(225,6,0,0.09),transparent_62%)]" />
                  <div className="pointer-events-none absolute inset-8 rounded-full border border-dashed border-white/[0.05] animate-spin-slow" />
                  <div className="pointer-events-none absolute inset-20 rounded-full border border-dashed border-pit-red/[0.09] animate-spin-slow-reverse" />
                  <MiniTrack
                    points={selected.trackPreview}
                    className="absolute inset-0 h-full w-full p-2"
                    strokeWidth={8}
                    dots={PREVIEW_DOTS}
                    live
                  />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-pit-red">
                        {selected.season} · {selected.country}
                      </p>
                      <p className="mt-1 font-display text-xl leading-tight text-white sm:text-2xl">
                        {selected.eventName}
                      </p>
                      <p className="mt-1 text-[10px] text-white/35">
                        {selected.circuit} · {selected.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadRace(selected.season, selected.round)}
                      className="btn-shine group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-pit-red hover:text-white"
                    >
                      <span className="relative z-[2] flex items-center gap-2">
                        Enter
                        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-white/[0.08] border-t border-white/[0.08]">
                  {[
                    ["Laps", selected.laps],
                    ["Cars", selected.drivers],
                    ["Runtime", minutesLabel(selected.duration)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="px-5 py-3.5">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">
                        {label}
                      </p>
                      <p className="mt-0.5 text-sm font-medium tabular-nums text-white/85">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-white/[0.015] px-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 text-white/30">
                  <CircuitIcon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-sm font-medium text-white/70">
                  No replays for {season} yet
                </p>
                <p className="mt-2 max-w-[260px] text-[12px] leading-5 text-pit-muted">
                  The paddock refuels after each race weekend. Try 2024 or 2025.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <section className="mt-24 border-t border-white/[0.06] pt-10">
          <Reveal>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow mb-3">The archive</p>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Available replays
                </h2>
              </div>
              <p className="text-[11px] text-white/30">
                Data baked at build time · no runtime API calls
              </p>
            </div>
          </Reveal>

          <Stagger
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            gap={0.05}
          >
            {races.map((race) => (
              <StaggerItem key={`${race.season}-${race.round}`} y={18}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/race/${race.season}/${race.round}`)
                  }
                  className="edge-glow hover-lift group relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left hover:border-pit-red/35 hover:bg-white/[0.035]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent transition-all duration-500 group-hover:via-pit-red/70" />
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">
                      {race.season} · R{String(race.round).padStart(2, "0")}
                    </span>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-pit-red" />
                  </div>

                  <div className="relative mt-2 aspect-[2/1.05] overflow-hidden rounded-lg bg-black/20">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(225,6,0,0.07),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <MiniTrack
                      points={race.trackPreview}
                      className="absolute inset-0 h-full w-full p-2 transition-transform duration-500 group-hover:scale-[1.04]"
                      strokeWidth={7}
                      showStartLine={false}
                    />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {race.eventName}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/30">
                        {race.circuit} · {race.location}
                      </p>
                    </div>
                    <span className="text-[10px] tabular-nums text-white/25">
                      {race.laps} LAPS
                    </span>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-16 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Add a race
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-pit-muted">
                Drop a normalized raw JSON into{" "}
                <code className="text-white/60">/raw</code>, then rebuild the
                archive and bake commentary.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <code className="rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1.5 text-[10px] text-white/50">
                npm run build:data
              </code>
              <code className="rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1.5 text-[10px] text-white/50">
                npm run gen:commentary
              </code>
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-col gap-2 border-t border-white/[0.05] pt-6 text-[10px] uppercase tracking-[0.14em] text-white/20 sm:flex-row sm:justify-between">
          <span>PitWall · The race, at a glance.</span>
          <Link href="/" className="transition-colors hover:text-white/50">
            Public site
          </Link>
        </footer>
      </main>
      </ScrollDrift>
    </div>
  );
}
