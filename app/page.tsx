import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { RacePreviewCard } from "@/components/marketing/RacePreviewCard";
import {
  AmbientIcon,
  ArrowRightIcon,
  CircuitIcon,
  FlagIcon,
  SparkIcon,
  TimerIcon,
} from "@/components/ui/icons";
import { getSessionUser } from "@/lib/auth";
import { featuredRace, raceCatalog } from "@/lib/catalog";
import { buildPathD } from "@/lib/track";

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Pick a race",
    body: "Every round from 2024 through São Paulo 2026 — pre-baked and ready. No streams, no buffering, no searching.",
    icon: CircuitIcon,
  },
  {
    number: "02",
    title: "Hit lights out",
    body: "Five red lights, one heartbeat. Then the field comes alive around the circuit.",
    icon: FlagIcon,
  },
  {
    number: "03",
    title: "Glance, don't stare",
    body: "Dots glide. Overtakes land. Commentary rolls in. Get on with your actual work.",
    icon: AmbientIcon,
  },
];

const FEATURES = [
  {
    title: "Real overtakes, real positions",
    body: "Every pass is detected from frame-to-frame position changes. No filler, no fake racing lines.",
    icon: TimerIcon,
  },
  {
    title: "High-energy commentary",
    body: "Pre-baked, Crofty-style one-liners slide into the radio feed as the race unfolds.",
    icon: SparkIcon,
  },
  {
    title: "Ambient by design",
    body: "No video. No talking heads. No noise. Just a clean timing-tower view you can leave running.",
    icon: AmbientIcon,
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const featured = featuredRace();
  const trackPath = buildPathD(featured.trackPreview);
  const enterHref = user ? "/dashboard" : "/login";

  return (
    <div className="relative overflow-hidden">
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#idea"
              className="text-[12px] font-medium text-pit-muted transition-colors hover:text-white"
            >
              The idea
            </a>
            <a
              href="#how"
              className="text-[12px] font-medium text-pit-muted transition-colors hover:text-white"
            >
              How it works
            </a>
            <a
              href="#ambient"
              className="text-[12px] font-medium text-pit-muted transition-colors hover:text-white"
            >
              Ambient mode
            </a>
          </nav>
          <Link
            href={enterHref}
            className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-pit-red hover:text-white sm:inline-flex"
          >
            Enter the paddock
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section
        id="idea"
        className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-32 lg:pb-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-lines opacity-70" />
          <div className="absolute -right-[22%] -top-[8%] h-[95vw] w-[95vw] max-h-[1100px] max-w-[1100px] rotate-[-9deg] opacity-90">
            <svg
              viewBox="0 0 1000 1000"
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
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
                strokeOpacity="0.5"
                pathLength={1}
                className="track-line-animated-slow"
              />
              <path
                d={trackPath}
                fill="none"
                stroke="#F5F5F5"
                strokeWidth="1"
                strokeLinejoin="round"
                strokeOpacity="0.18"
                pathLength={1}
                className="track-line-animated"
              />
            </svg>
          </div>
          <div className="absolute -left-[20%] top-[30%] h-[42rem] w-[42rem] rounded-full bg-pit-red/[0.06] blur-[140px]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-pit-black to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
            <div>
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.025] px-3.5 py-1.5 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-pit-red shadow-red-glow-sm" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  Ambient F1 replayer · 2024-2026
                </span>
              </div>

              <h1 className="font-display text-[clamp(3.4rem,8.7vw,7.4rem)] leading-[0.88] text-white">
                The race,
                <br />
                at a <span className="text-pit-red">glance.</span>
              </h1>

              <p className="mt-8 max-w-xl text-[15px] leading-7 text-white/55 sm:text-base">
                Watch every round from 2024 through São Paulo 2026 as a live
                timing-tower visualization — dots gliding around the real
                circuit, overtakes in real time, commentary on the side. Built
                for people who want the race on in the background while they
                work.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={enterHref}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-pit-red px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-red-glow transition-all duration-300 hover:bg-[#ff1a12] hover:shadow-red-glow"
                >
                  Enter the paddock
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-[12px] font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/[0.07] pt-6">
                {[
                  [String(raceCatalog.length), "pre-baked races"],
                  ["20-22", "cars on track"],
                  ["0", "talking heads"],
                ].map(([value, label]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="font-display text-xl text-white">{value}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-pit-muted">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-6">
              <RacePreviewCard
                trackPoints={featured.trackPreview}
                circuit={featured.circuit}
                round={featured.round}
                laps={featured.laps}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="relative border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">How it works</p>
              <h2 className="font-display text-4xl leading-[1.02] text-white sm:text-5xl lg:text-6xl">
                Three steps to
                <br />
                lights out.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-pit-muted md:text-right">
              No setup. No streams. No 2-hour video. Pick a race and let it run.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative bg-[#0d0d0d] p-8 transition-colors duration-300 hover:bg-[#111] lg:p-10"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-3xl text-white/15 transition-colors duration-300 group-hover:text-pit-red/60">
                      {step.number}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-pit-red/40 group-hover:text-pit-red">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-12 text-lg font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-pit-muted">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="ambient"
        className="relative border-y border-white/[0.06] bg-[#0c0c0c]"
      >
        <div className="mx-auto grid max-w-7xl divide-y divide-white/[0.06] px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-0">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group px-0 py-10 md:px-10 md:py-14 lg:px-12"
              >
                <span className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-pit-red transition-colors duration-300 group-hover:border-pit-red/40">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="text-base font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-pit-muted">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0d0d0d] px-6 py-16 sm:px-12 lg:px-16 lg:py-24">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 grid-lines opacity-50" />
              <div className="absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-pit-red/10 blur-[120px]" />
              <div className="absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-pit-red/[0.05] blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-3xl">
              <p className="eyebrow mb-5">Your second screen</p>
              <h2 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.92] text-white">
                Have the race on.
              </h2>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/50">
                Not a broadcast. A pulse. PitWall turns a race into something
                you can keep in the corner of your eye — and still know exactly
                what just happened.
              </p>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link
                  href={enterHref}
                  className="group inline-flex items-center gap-3 rounded-full bg-pit-red px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-red-glow transition-all duration-300 hover:bg-[#ff1a12]"
                >
                  Enter the paddock
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">
                  Free · Email or Google · No card
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-6">
              <Logo />
              <span className="hidden text-[11px] text-white/25 sm:block">
                The race, at a glance.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-pit-muted">
              <a
                href="https://github.com/bacinger/f1-circuits"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white"
              >
                Circuit geometry (MIT)
              </a>
              <span className="text-white/15">/</span>
              <span>Not affiliated with Formula 1, the FIA, or any team.</span>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-2 border-t border-white/[0.05] pt-5 text-[10px] uppercase tracking-[0.14em] text-white/20 sm:flex-row">
            <span>© 2026 PitWall</span>
            <span>Simulated race data · Circuit geometry by bacinger/f1-circuits</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
