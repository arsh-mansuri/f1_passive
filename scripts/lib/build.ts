import type {
  Driver,
  Frame,
  Race,
  RaceEvent,
  RawPitStop,
  RawRace,
} from "../../lib/types";
import { templateCommentary } from "../../lib/commentary";

type PitWindow = { start: number; end: number };

const EVENT_PRIORITY: Record<RaceEvent["type"], number> = {
  start: 0,
  lead_change: 1,
  overtake: 2,
  pit: 3,
  finish: 4,
};

function byRank(
  positions: Record<string, number>,
  drivers: Driver[],
): string[] {
  return drivers
    .map((driver) => driver.code)
    .filter((code) => positions[code] !== undefined)
    .sort((a, b) => positions[a] - positions[b]);
}

function buildPitWindows(pitStops: RawPitStop[]): Map<string, PitWindow[]> {
  const windows = new Map<string, PitWindow[]>();
  for (const stop of pitStops) {
    const window = {
      start: stop.t - 1,
      end: stop.t + (stop.duration ?? 22) + 2,
    };
    const list = windows.get(stop.driver) ?? [];
    list.push(window);
    windows.set(stop.driver, list);
  }
  return windows;
}

function inPitWindow(
  windows: Map<string, PitWindow[]>,
  code: string,
  t: number,
): boolean {
  const list = windows.get(code);
  if (!list) return false;
  return list.some((window) => t >= window.start && t <= window.end);
}

function reversedSoon(
  frames: Frame[],
  frameIndex: number,
  attacker: string,
  defender: string,
): boolean {
  const horizon = frames[frameIndex].t + 2.5;
  for (
    let index = frameIndex + 1;
    index < frames.length && frames[index].t <= horizon;
    index += 1
  ) {
    if (
      frames[index].positions[attacker] >
      frames[index].positions[defender]
    ) {
      return true;
    }
  }
  return false;
}

function lapFor(t: number, duration: number, laps: number): number {
  return Math.max(
    1,
    Math.min(laps, Math.floor((t / Math.max(1, duration)) * laps) + 1),
  );
}

function detectEvents(raw: RawRace): RaceEvent[] {
  const frames = [...raw.frames].sort((a, b) => a.t - b.t);
  if (frames.length < 2) return [];

  const pitWindows = buildPitWindows(raw.pitStops);
  const events: RaceEvent[] = [];
  const lastPass = new Map<string, number>();

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1];
    const current = frames[index];
    const order = byRank(current.positions, raw.drivers);

    for (let rank = 0; rank < order.length - 1; rank += 1) {
      const attacker = order[rank];
      const defender = order[rank + 1];

      if (
        previous.positions[attacker] === undefined ||
        previous.positions[defender] === undefined
      ) {
        continue;
      }

      if (previous.positions[attacker] <= previous.positions[defender]) {
        continue;
      }

      if (
        inPitWindow(pitWindows, attacker, current.t) ||
        inPitWindow(pitWindows, defender, current.t)
      ) {
        continue;
      }

      if (reversedSoon(frames, index, attacker, defender)) {
        continue;
      }

      const key = `${attacker}|${defender}`;
      const previousPass = lastPass.get(key);
      if (previousPass !== undefined && current.t - previousPass < 5) {
        continue;
      }
      lastPass.set(key, current.t);

      events.push({
        t: current.t,
        type: rank === 0 ? "lead_change" : "overtake",
        attacker,
        defender,
        lap: lapFor(current.t, raw.duration, raw.laps),
        commentary: "",
      });
    }
  }

  const pitEvents: RaceEvent[] = raw.pitStops.map((stop) => ({
    t: stop.t,
    type: "pit",
    driver: stop.driver,
    lap: lapFor(stop.t, raw.duration, raw.laps),
    commentary: "",
  }));

  const lastFrame = frames[frames.length - 1];
  const winner = byRank(lastFrame.positions, raw.drivers)[0];
  const finishTime = Math.max(0, lastFrame.t - 1);

  return [
    {
      t: 0,
      type: "start",
      lap: 1,
      commentary: "",
    },
    ...events,
    ...pitEvents,
    {
      t: finishTime,
      type: "finish",
      attacker: winner,
      lap: raw.laps,
      commentary: "",
    },
  ];
}

function withCommentary(event: RaceEvent, raw: RawRace): RaceEvent {
  const existing = event.commentary?.trim();
  const commentary =
    existing && existing.length > 0
      ? existing
      : templateCommentary(event, {
          eventName: raw.eventName?.trim() || `${raw.country} Grand Prix`,
          circuit: raw.circuit,
          country: raw.country,
          drivers: raw.drivers,
        });

  return {
    ...event,
    commentary,
    commentarySource: event.commentarySource ?? "template",
  };
}

export function buildRace(raw: RawRace): Race {
  if (!raw.frames?.length) {
    throw new Error(`Race ${raw.season}/${raw.round} has no frames`);
  }
  if (!raw.trackPoints?.length) {
    throw new Error(`Race ${raw.season}/${raw.round} has no trackPoints`);
  }
  if (!raw.drivers?.length) {
    throw new Error(`Race ${raw.season}/${raw.round} has no drivers`);
  }

  const detected = raw.detectEvents === false ? [] : detectEvents(raw);
  const events = [...detected, ...(raw.events ?? [])]
    .map((event) => withCommentary(event, raw))
    .filter((event) => event.t >= 0 && event.t <= raw.duration)
    .sort(
      (a, b) =>
        a.t - b.t ||
        EVENT_PRIORITY[a.type] - EVENT_PRIORITY[b.type],
    );

  const seen = new Set<string>();
  const deduped = events.filter((event) => {
    const key = [
      event.t,
      event.type,
      event.attacker ?? "",
      event.defender ?? "",
      event.driver ?? "",
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    season: raw.season,
    round: raw.round,
    eventName: raw.eventName?.trim() || `${raw.country} Grand Prix`,
    country: raw.country,
    circuit: raw.circuit,
    location: raw.location?.trim() || raw.circuit,
    laps: raw.laps,
    duration: raw.duration,
    lapStarts: raw.lapStarts,
    trackPoints: raw.trackPoints,
    drivers: raw.drivers,
    frames: [...raw.frames].sort((a, b) => a.t - b.t),
    events: deduped,
  };
}
