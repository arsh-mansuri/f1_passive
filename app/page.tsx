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
import { TrackHero } from "@/components/marketing/TrackHero";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { ScrollDrift } from "@/components/ui/ScrollDrift";

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

const TICKER = [
  "Lights out",
  "Real overtakes",
  "Zero buffering",
  "Timing tower",
  "No talking heads",
  "2024 — 2026",
  "Ambient by design",
  "Every round",
];

export default async function HomePage() {
  const user = await getSessionUser();
  const featured = featuredRace();
  const trackPath = buildPathD(featured.trackPreview);
  const enterHref = user ? "/dashboard" : "/login";

  return (
    <div className="relative overflow-hidden">
      <ScrollProgress />
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#idea"
              className="group relative text-[12px] font-medium text-pit-muted transition-colors hover:text-white"
            >
              The idea
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-pit-red transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#how"
              className="group relative text-[12px] font-medium text-pit-muted transition-colors hover:text-white"
            >
              How it works
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-pit-red transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#ambient"
              className="group relative text-[12px] font-medium text-pit-muted transition-colors hover:text-white"
            >
              Ambient mode
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-pit-red transition-all duration-300 group-hover:w-full" />
            </a>
          </nav>
          <Link
            href={enterHref}
            className="btn-shine group hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-pit-red hover:text-white sm:inline-flex"
          >
            <span className="relative z-[2] flex items-center gap-2">
              Enter the paddock
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </header>

      <ScrollDrift>
        <section
          id="idea"
        className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-32 lg:pb-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <InteractiveBackground variant="landing" />
          <div className="absolute inset-0 grid-lines grid-drift opacity-70" />
          <TrackHero trackPath={trackPath} />
          <div className="absolute -left-[20%] top-[30%] h-[42rem] w-[42rem] rounded-full bg-pit-red/[0.06] blur-[140px]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-pit-black to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
            <Stagger className="relative" gap={0.09}>
              <StaggerItem>
                <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.025] px-3.5 py-1.5 backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pit-red opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pit-red shadow-red-glow-sm" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                    Ambient F1 replayer · 2024-2026
                  </span>
                </div>
              </StaggerItem>

              <StaggerItem>
                <h1 className="font-display text-[clamp(3.4rem,8.7vw,7.4rem)] leading-[0.88] text-white">
                  The race,
                  <br />
                  at a{" "}
                  <span className="text-pit-red text-glow-red">glance.</span>
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className="mt-8 max-w-xl text-[15px] leading-7 text-white/55 sm:text-base">
                  Watch every round from 2024 through São Paulo 2026 as a live
                  timing-tower visualization — dots gliding around the real
                  circuit, overtakes in real time, commentary on the side. Built
                  for people who want the race on in the background while they
                  work.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={enterHref}
                    className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-pit-red px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-red-glow transition-all duration-300 hover:bg-[#ff1a12] hover:shadow-red-glow"
                  >
                    <span className="relative z-[2] flex items-center gap-3">
                      Enter the paddock
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                  <a
                    href="#how"
                    className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-[12px] font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white"
                  >
                    See how it works
                    <span className="h-1 w-1 rounded-full bg-pit-red/0 transition-colors duration-300 group-hover:bg-pit-red" />
                  </a>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/[0.07] pt-6">
                  {[
                    [String(raceCatalog.length), "pre-baked races"],
                    ["20-22", "cars on track"],
                    ["0", "talking heads"],
                  ].map(([value, label]) => (
                    <div key={label} className="flex items-baseline gap-2">
                      <span className="font-display text-xl text-white">
                        {value}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-pit-muted">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </StaggerItem>
            </Stagger>

            <Reveal
              className="relative lg:pl-6"
              delay={0.15}
              y={30}
              duration={0.9}
            >
              <RacePreviewCard
                trackPoints={featured.trackPreview}
                circuit={featured.circuit}
                round={featured.round}
                laps={featured.laps}
              />
            </Reveal>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
          <span className="text-[9px] uppercase tracking-[0.32em] text-white/20">
            Scroll
          </span>
          <span className="relative h-9 w-px overflow-hidden bg-white/10">
            <span className="scroll-cue absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-transparent via-pit-red to-transparent" />
          </span>
        </div>
      </section>

      <div className="relative border-y border-white/[0.06] bg-[#080808] py-4">
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-10 pr-10"
                aria-hidden={copy === 1}
              >
                {TICKER.map((item) => (
                  <span
                    key={`${copy}-${item}`}
                    className="flex shrink-0 items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-white/30"
                  >
                    <span className="h-1 w-1 rounded-full bg-pit-red" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section id="how" className="relative border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <Reveal>
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
                No setup. No streams. No 2-hour video. Pick a race and let it
                run.
              </p>
            </div>
          </Reveal>

          <Stagger
            className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-3"
            gap={0.1}
          >
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <StaggerItem
                  key={step.number}
                  className="group relative bg-[#0d0d0d] p-8 transition-colors duration-300 hover:bg-[#111] lg:p-10"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pit-red/0 to-transparent transition-all duration-500 group-hover:via-pit-red/70" />
                  <div className="flex items-start justify-between">
                    <span className="font-display text-3xl text-white/15 transition-colors duration-300 group-hover:text-pit-red/60">
                      {step.number}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/50 transition-all duration-300 group-hover:scale-110 group-hover:border-pit-red/40 group-hover:text-pit-red">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-12 text-lg font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-pit-muted">
                    {step.body}
                  </p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <section
        id="ambient"
        className="relative border-y border-white/[0.06] bg-[#0c0c0c]"
      >
        <Stagger
          className="mx-auto grid max-w-7xl divide-y divide-white/[0.06] px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-0"
          gap={0.12}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem
                key={feature.title}
                className="group relative px-0 py-10 md:px-10 md:py-14 lg:px-12"
              >
                <span className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-pit-red transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-pit-red/40 group-hover:shadow-red-glow-sm">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="text-base font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-pit-muted">
                  {feature.body}
                </p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0d0d0d] px-6 py-16 sm:px-12 lg:px-16 lg:py-24">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 grid-lines grid-drift opacity-50" />
              <div className="absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-pit-red/10 blur-[120px]" />
              <div className="absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-pit-red/[0.05] blur-[100px]" />
              <div className="absolute -right-24 top-1/2 hidden h-[30rem] w-[30rem] -translate-y-1/2 lg:block">
                <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-white/[0.07]" />
                <div className="absolute inset-14 animate-spin-slow-reverse rounded-full border border-dashed border-pit-red/15" />
                <div className="absolute inset-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pit-red/70 blur-[1px]" />
              </div>
            </div>

            <Reveal className="relative z-10 max-w-3xl" y={20} duration={0.8}>
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
                  className="btn-shine group inline-flex items-center gap-3 rounded-full bg-pit-red px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-red-glow transition-all duration-300 hover:bg-[#ff1a12]"
                >
                  <span className="relative z-[2] flex items-center gap-3">
                    Enter the paddock
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">
                  Free · Email or Google · No card
                </span>
              </div>
            </Reveal>
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
      </ScrollDrift>
    </div>
  );
}
