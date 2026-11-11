import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { featuredRace } from "@/lib/catalog";
import { buildPathD } from "@/lib/track";

type AuthLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
}: AuthLayoutProps) {
  const featured = featuredRace();
  const trackPath = buildPathD(featured.trackPreview);

  return (
    <main className="relative min-h-[100svh] overflow-hidden lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#080808] lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-lines opacity-60" />
          <div className="absolute left-[8%] top-[10%] h-[85%] w-[85%] rotate-[-12deg]">
            <svg
              viewBox="0 0 1000 1000"
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path
                d={trackPath}
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="38"
                strokeLinejoin="round"
              />
              <path
                d={trackPath}
                fill="none"
                stroke="#E10600"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeOpacity="0.45"
                pathLength={1}
                className="track-line-animated"
              />
            </svg>
          </div>
          <div className="absolute -bottom-32 -left-20 h-[30rem] w-[30rem] rounded-full bg-pit-red/[0.08] blur-[110px]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#080808] to-transparent" />
        </div>

        <div className="relative z-10 p-10 xl:p-14">
          <Logo />
        </div>

        <div className="relative z-10 max-w-lg p-10 xl:p-14">
          <p className="eyebrow mb-5">Lights out, heads down</p>
          <p className="font-display text-[clamp(2.4rem,4.2vw,4rem)] leading-[0.94] text-white">
            The race,
            <br />
            at a glance.
          </p>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/40">
            A timing tower, a circuit, twenty dots and a commentary feed. No
            video, no noise — just enough race to keep one eye on.
          </p>
          <div className="mt-10 flex items-center gap-6 border-t border-white/[0.08] pt-6">
            {[
              ["3", "replays"],
              ["20", "cars"],
              ["0", "video"],
            ].map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="font-display text-lg text-white">{value}</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="relative flex min-h-[100svh] flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Logo />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/25">
            {featured.circuit}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:py-16">
          <div className="w-full max-w-[420px]">
            <p className="eyebrow mb-4">{eyebrow}</p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[34px]">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-pit-muted">{subtitle}</p>
            <div className="mt-9">{children}</div>
          </div>
        </div>

        <div className="hidden px-10 py-6 text-[10px] uppercase tracking-[0.14em] text-white/15 lg:block">
          PitWall · Not affiliated with Formula 1
        </div>
      </section>
    </main>
  );
}
