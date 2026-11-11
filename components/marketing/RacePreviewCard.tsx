import { MiniTrack } from "./MiniTrack";
import type { TrackPoint } from "@/lib/types";

type RacePreviewCardProps = {
  trackPoints: TrackPoint[];
  circuit: string;
  round: number;
  laps: number;
};

const PREVIEW_DOTS = [
  { fraction: 0.18, color: "#27F4D2", delay: 0 },
  { fraction: 0.205, color: "#3671C6", delay: 0.35 },
  { fraction: 0.23, color: "#FF8000", delay: 0.7 },
  { fraction: 0.255, color: "#FF8000", delay: 1.05 },
  { fraction: 0.28, color: "#E8002D", delay: 1.4 },
  { fraction: 0.86, color: "#B6BABD", delay: 1.75 },
];

export function RacePreviewCard({
  trackPoints,
  circuit,
  round,
  laps,
}: RacePreviewCardProps) {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div className="absolute -inset-8 rounded-[40px] bg-pit-red/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0e0e0e] shadow-card">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pit-red opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pit-red" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
              Live replay
            </span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-pit-muted">
            {circuit} · R{String(round).padStart(2, "0")}
          </span>
        </div>

        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(225,6,0,0.08),transparent_60%)]" />
          <MiniTrack
            points={trackPoints}
            dots={PREVIEW_DOTS.map((dot, index) => ({
              ...dot,
              code: ["HAM", "VER", "NOR", "PIA", "LEC", "PER"][index],
            }))}
            className="absolute inset-0 h-full w-full"
            strokeWidth={8}
          />

          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/60 backdrop-blur">
            Lap 34 / {laps}
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-pit-red">
                  Race radio
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Lap 34
                </span>
              </div>
              <p className="text-[13px] font-medium leading-snug text-white/90">
                HAMILTON AROUND THE OUTSIDE!
                <span className="text-white/55"> Silverstone erupts!</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
          {[
            { p: "P1", code: "HAM", team: "Mercedes", color: "#27F4D2" },
            { p: "P2", code: "VER", team: "Red Bull", color: "#3671C6" },
            { p: "P3", code: "NOR", team: "McLaren", color: "#FF8000" },
          ].map((row) => (
            <div key={row.code} className="flex items-center gap-2 px-4 py-3.5">
              <span className="text-[10px] tabular-nums text-white/35">{row.p}</span>
              <span
                className="h-4 w-[3px] rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-white">
                  {row.code}
                </p>
                <p className="truncate text-[9px] text-white/35">{row.team}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -left-5 top-24 hidden animate-float rounded-xl border border-white/10 bg-[#111]/90 px-3.5 py-2.5 shadow-card backdrop-blur md:block">
        <p className="text-[9px] uppercase tracking-[0.2em] text-pit-muted">
          Ambient mode
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-white/80">
          No video. No noise.
        </p>
      </div>
    </div>
  );
}
