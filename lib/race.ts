import type { Driver, Frame, Race, RaceEvent, TrackPoint } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function frameIndexAt(frames: Frame[], t: number): number {
  if (frames.length === 0) return 0;
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (frames[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function positionsAt(frames: Frame[], t: number): Record<string, number> {
  if (frames.length === 0) return {};
  return frames[frameIndexAt(frames, t)].positions;
}

export function standingsAt(race: Race, t: number): Driver[] {
  const positions = positionsAt(race.frames, t);
  return [...race.drivers].sort(
    (a, b) =>
      (positions[a.code] ?? Number.MAX_SAFE_INTEGER) -
      (positions[b.code] ?? Number.MAX_SAFE_INTEGER),
  );
}

function validLapStarts(race: Race): number[] | null {
  const starts = race.lapStarts;
  if (!starts || starts.length !== race.laps || race.laps <= 0) return null;
  return starts;
}

export function lapAt(race: Race, t: number): number {
  const starts = validLapStarts(race);
  if (!starts) {
    const duration = race.duration || 1;
    return clamp(Math.floor((t / duration) * race.laps) + 1, 1, race.laps);
  }

  const time = clamp(t, 0, race.duration);
  let lo = 0;
  let hi = starts.length - 1;

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= time) lo = mid;
    else hi = mid - 1;
  }

  return clamp(lo + 1, 1, race.laps);
}

export function lapProgressAt(race: Race, t: number): number {
  const starts = validLapStarts(race);
  if (!starts) {
    const duration = race.duration || 1;
    return clamp((t / duration) * race.laps, 0, race.laps);
  }

  const time = clamp(t, 0, race.duration);
  const index = lapAt(race, time) - 1;
  const start = starts[index] ?? 0;
  const end =
    index + 1 < starts.length ? starts[index + 1] : race.duration;
  const fraction =
    end > start ? clamp((time - start) / (end - start), 0, 1) : 0;

  return clamp(index + fraction, 0, race.laps);
}

export function lapStartAt(race: Race, lap: number): number {
  const starts = validLapStarts(race);
  const target = clamp(lap, 1, race.laps);
  if (starts) return starts[target - 1] ?? 0;
  return ((target - 1) / race.laps) * race.duration;
}

export function raceClock(t: number): string {
  const total = Math.max(0, Math.floor(t));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function eventHeadline(event: RaceEvent): string {
  switch (event.type) {
    case "lead_change":
      return "LEAD CHANGE";
    case "pit":
      return "PIT WINDOW";
    case "start":
      return "LIGHTS OUT";
    case "finish":
      return "CHEQUERED FLAG";
    default:
      return "OVERTAKE";
  }
}

export function driverMap(drivers: Driver[]): Record<string, Driver> {
  return Object.fromEntries(drivers.map((driver) => [driver.code, driver]));
}

export function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

export function formatTrackPreview(points: TrackPoint[], count = 48): TrackPoint[] {
  if (points.length <= count) return points;
  const step = (points.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, index) =>
    points[Math.round(index * step)],
  );
}
