import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  Driver,
  Frame,
  Race,
  RaceEvent,
  RawPitStop,
  RawRace,
} from "../lib/types";
import { buildRace } from "./lib/build";
import { CALENDAR, type CalendarEvent } from "./lib/calendar";
import { writeManifest, writeRace } from "./lib/io";
import { buildCircuitPoints, getCircuitInfo } from "./lib/tracks";

type SessionRow = {
  session_key: number;
  meeting_key: number;
  location: string;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  date_end: string;
};

type DriverRow = {
  driver_number: number;
  name_acronym: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  team_name?: string;
  team_colour?: string;
};

type PositionRow = {
  date: string;
  driver_number: number;
  position: number;
};

type LapRow = {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
  lap_duration: number | null;
};

type PitRow = {
  date: string;
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
  lane_duration?: number | null;
};

type RaceControlRow = {
  date: string;
  lap_number: number | null;
  category: string | null;
  message: string;
  driver_number: number | null;
};

type JolpicaResults = {
  MRData?: {
    RaceTable?: {
      Races?: Array<{
        Results?: Array<{
          position: string;
          Driver?: { code?: string };
        }>;
      }>;
    };
  };
};

type PitWindow = {
  start: number;
  end: number;
};

const API = "https://api.openf1.org/v1";
const CACHE_DIR = path.join(os.tmpdir(), "pitwall-openf1-cache");
const MIN_REQUEST_INTERVAL_MS = 1200;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const CIRCUIT_ALIASES: Record<string, string[]> = {
  bahrain: ["Sakhir"],
  jeddah: ["Jeddah"],
  "albert-park": ["Melbourne"],
  suzuka: ["Suzuka"],
  shanghai: ["Shanghai"],
  miami: ["Miami"],
  imola: ["Imola"],
  monaco: ["Monte Carlo"],
  montreal: ["Montreal"],
  barcelona: ["Catalunya"],
  spielberg: ["Spielberg"],
  silverstone: ["Silverstone"],
  hungaroring: ["Hungaroring"],
  spa: ["Spa-Francorchamps"],
  zandvoort: ["Zandvoort"],
  monza: ["Monza"],
  madrid: ["Madring"],
  baku: ["Baku"],
  sepang: ["Kuala Lumpur"],
  "marina-bay": ["Marina Bay", "Singapore"],
  austin: ["Austin"],
  "mexico-city": ["Mexico City"],
  interlagos: ["Interlagos"],
  "las-vegas": ["Las Vegas"],
  lusail: ["Lusail"],
  "yas-marina": ["Yas Marina Circuit", "Yas Marina"],
};

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cachePath(url: string): string {
  const hash = crypto.createHash("sha1").update(url).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

function parseDate(value: string | null | undefined, label = "date"): number {
  if (!value) throw new Error(`Missing ${label}`);
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`Invalid ${label}: ${value}`);
  return time;
}

function optionalDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function roundTime(value: number): number {
  return Math.round(value * 1000) / 1000;
}

async function requestJson<T>(url: string): Promise<T> {
  let attempt = 0;

  while (attempt < 6) {
    const wait = Math.max(
      0,
      MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt),
    );
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PitWall/1.0 (OpenF1 race archive)",
      },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 2500 * 2 ** attempt;
      process.stdout.write(
        `rate limited (${response.status}); retrying in ${Math.round(delay / 1000)}s... `,
      );
      await sleep(delay);
      attempt += 1;
      continue;
    }

    throw new Error(`OpenF1 request failed (${response.status}): ${url}`);
  }

  throw new Error(`OpenF1 request kept failing: ${url}`);
}

async function getJson<T>(url: string, noCache: boolean): Promise<T> {
  const file = cachePath(url);

  if (!noCache && fs.existsSync(file)) {
    const age = Date.now() - fs.statSync(file).mtimeMs;
    if (age < CACHE_TTL_MS) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as T;
    }
  }

  const data = await requestJson<T>(url);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data), "utf8");
  return data;
}

function endpoint(resource: string, params: Record<string, string | number>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value));
  }
  return `${API}/${resource}?${query.toString()}`;
}

async function fetchSessions(year: number, noCache: boolean): Promise<SessionRow[]> {
  const url = endpoint("sessions", {
    year,
    session_name: "Race",
  });
  const sessions = await getJson<SessionRow[]>(url, noCache);
  return sessions.filter((session) => session.session_key && session.date_start);
}

function findSession(event: CalendarEvent, sessions: SessionRow[]): SessionRow {
  const aliases = (CIRCUIT_ALIASES[event.circuitKey] ?? [event.circuitKey]).map(
    (alias) => alias.toLowerCase(),
  );
  const matches = sessions.filter((session) =>
    aliases.includes(session.circuit_short_name.toLowerCase()),
  );

  if (matches.length === 1) return matches[0];

  if (matches.length > 1) {
    const locations = matches
      .map((match) => `${match.circuit_short_name} (${match.location})`)
      .join(", ");
    throw new Error(
      `Ambiguous OpenF1 session for ${event.season} ${event.eventName}: ${locations}`,
    );
  }

  throw new Error(
    `No OpenF1 session for ${event.season} ${event.eventName} (${event.circuitKey})`,
  );
}

function normalizeDrivers(rows: DriverRow[]): {
  drivers: Driver[];
  codeByNumber: Map<number, string>;
} {
  const seen = new Set<number>();
  const drivers: Driver[] = [];
  const codeByNumber = new Map<number, string>();

  for (const row of rows) {
    if (seen.has(row.driver_number)) continue;
    seen.add(row.driver_number);

    const name =
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
      row.full_name?.trim() ||
      `Driver ${row.driver_number}`;
    const code =
      row.name_acronym?.trim().toUpperCase() ||
      (row.last_name?.slice(0, 3).toUpperCase() ?? String(row.driver_number));
    const colour = row.team_colour?.trim();

    drivers.push({
      code,
      name,
      team: row.team_name?.trim() || "Unknown team",
      color: colour
        ? colour.startsWith("#")
          ? colour
          : `#${colour}`
        : "#888888",
    });
    codeByNumber.set(row.driver_number, code);
  }

  return { drivers, codeByNumber };
}

function findRaceStart(
  laps: LapRow[],
  raceControl: RaceControlRow[],
  session: SessionRow,
): number {
  const lapOneStarts = laps
    .filter((lap) => lap.lap_number === 1)
    .map((lap) => optionalDate(lap.date_start))
    .filter((time): time is number => time !== null);

  if (lapOneStarts.length > 0) return Math.min(...lapOneStarts);

  const startMessage = raceControl.find((row) =>
    /RACE START|SESSION STARTED/i.test(row.message),
  );
  if (startMessage) return parseDate(startMessage.date);

  return parseDate(session.date_start) + 180_000;
}

function medianLapTime(laps: LapRow[]): number {
  const durations = laps
    .map((lap) => lap.lap_duration)
    .filter(
      (duration): duration is number =>
        typeof duration === "number" && duration > 20 && duration < 600,
    )
    .sort((a, b) => a - b);

  if (durations.length === 0) return 90;
  return durations[Math.floor(durations.length / 2)];
}

function findRaceDuration(
  laps: LapRow[],
  lapsCount: number,
  startMs: number,
  raceControl: RaceControlRow[],
  session: SessionRow,
): number {
  const finishes = laps
    .filter((lap) => lap.lap_number === lapsCount)
    .map((lap) => {
      const lapStart = optionalDate(lap.date_start);
      if (lapStart === null || lap.lap_duration === null) return null;
      return lapStart + lap.lap_duration * 1000;
    })
    .filter((time): time is number => time !== null);

  if (finishes.length > 0) {
    return roundTime((Math.min(...finishes) - startMs) / 1000);
  }

  const flag = raceControl.find((row) =>
    /CHEQUERED FLAG/i.test(row.message),
  );
  if (flag) return roundTime((parseDate(flag.date) - startMs) / 1000);

  return roundTime((parseDate(session.date_end) - startMs) / 1000);
}

function buildLapStarts(
  laps: LapRow[],
  lapsCount: number,
  startMs: number,
  duration: number,
  medianLap: number,
): number[] {
  const values: Array<number | null> = Array.from(
    { length: lapsCount },
    () => null,
  );

  for (const lap of laps) {
    if (lap.lap_number < 1 || lap.lap_number > lapsCount) continue;
    const lapStart = optionalDate(lap.date_start);
    if (lapStart === null) continue;
    const time = (lapStart - startMs) / 1000;
    if (time < 0 || time > duration) continue;
    const index = lap.lap_number - 1;
    const current = values[index];
    values[index] = current === null ? time : Math.min(current, time);
  }

  values[0] = 0;

  for (let index = 1; index < values.length; index += 1) {
    if (values[index] !== null) continue;

    let previousIndex = index - 1;
    while (previousIndex >= 0 && values[previousIndex] === null) {
      previousIndex -= 1;
    }

    let nextIndex = index + 1;
    while (nextIndex < values.length && values[nextIndex] === null) {
      nextIndex += 1;
    }

    const previous = previousIndex >= 0 ? values[previousIndex] : null;
    const next = nextIndex < values.length ? values[nextIndex] : null;

    if (previous !== null && next !== null) {
      const span = nextIndex - previousIndex;
      values[index] =
        previous + ((next - previous) * (index - previousIndex)) / span;
    } else if (previous !== null) {
      values[index] = previous + medianLap * (index - previousIndex);
    } else if (next !== null) {
      values[index] = Math.max(
        0.5,
        next - medianLap * (nextIndex - index),
      );
    } else {
      values[index] = medianLap * index;
    }
  }

  const starts = values as number[];
  for (let index = 1; index < starts.length; index += 1) {
    if (starts[index] <= starts[index - 1]) {
      starts[index] = starts[index - 1] + Math.max(0.05, medianLap * 0.01);
    }
  }

  const lastLimit = Math.max(0.25, duration - 0.25);
  if (starts[starts.length - 1] > lastLimit) {
    const scale = lastLimit / starts[starts.length - 1];
    for (let index = 0; index < starts.length; index += 1) {
      starts[index] = starts[index] * scale;
    }
  }

  return starts.map(roundTime);
}

function buildFrames(
  positions: PositionRow[],
  codeByNumber: Map<number, string>,
  startMs: number,
  duration: number,
  nonStarters: Set<string>,
): Frame[] {
  const sorted = [...positions].sort(
    (a, b) => parseDate(a.date) - parseDate(b.date),
  );
  const state: Record<string, number> = {};
  let cursor = 0;

  while (cursor < sorted.length && parseDate(sorted[cursor].date) <= startMs) {
    const row = sorted[cursor];
    const code = codeByNumber.get(row.driver_number);
    if (code) state[code] = row.position;
    cursor += 1;
  }

  if (Object.keys(state).length === 0 && cursor < sorted.length) {
    const firstDate = parseDate(sorted[cursor].date);
    while (
      cursor < sorted.length &&
      parseDate(sorted[cursor].date) === firstDate
    ) {
      const row = sorted[cursor];
      const code = codeByNumber.get(row.driver_number);
      if (code) state[code] = row.position;
      cursor += 1;
    }
  }

  const frames: Frame[] = [];
  let lastT = 0;

  if (Object.keys(state).length > 0) {
    frames.push({ t: 0, positions: { ...state } });
  }

  while (cursor < sorted.length) {
    const groupTime = parseDate(sorted[cursor].date);
    const t = (groupTime - startMs) / 1000;

    if (t > duration + 1) break;

    while (
      cursor < sorted.length &&
      parseDate(sorted[cursor].date) === groupTime
    ) {
      const row = sorted[cursor];
      const code = codeByNumber.get(row.driver_number);
      if (code) state[code] = row.position;
      cursor += 1;
    }

    if (t < 0) continue;

    const frameTime = roundTime(Math.min(duration, t));
    if (frameTime <= lastT) {
      const lastFrame = frames[frames.length - 1];
      if (lastFrame) lastFrame.positions = { ...state };
      else frames.push({ t: 0, positions: { ...state } });
    } else {
      frames.push({ t: frameTime, positions: { ...state } });
      lastT = frameTime;
    }
  }

  if (frames.length === 0) {
    frames.push({ t: 0, positions: { ...state } });
    lastT = 0;
  }

  if (lastT < duration) {
    frames.push({ t: duration, positions: { ...state } });
  }

  if (nonStarters.size > 0) {
    const codes = [...nonStarters].sort();
    for (const frame of frames) {
      const active = Object.entries(frame.positions)
        .filter(([code]) => !nonStarters.has(code))
        .sort((a, b) => a[1] - b[1]);
      let rank = 0;
      for (const [code] of active) {
        rank += 1;
        frame.positions[code] = rank;
      }
      for (const code of codes) {
        rank += 1;
        frame.positions[code] = rank;
      }
    }
  }

  return frames;
}

function findRetirements(
  laps: LapRow[],
  lapsCount: number,
  startMs: number,
  codeByNumber: Map<number, string>,
  lastPositionByCode: Map<string, number>,
): Map<string, number> {
  const lastLapByDriver = new Map<number, LapRow>();

  for (const lap of laps) {
    const current = lastLapByDriver.get(lap.driver_number);
    if (!current || lap.lap_number > current.lap_number) {
      lastLapByDriver.set(lap.driver_number, lap);
    }
  }

  const retirements = new Map<string, number>();

  for (const [driverNumber, lap] of lastLapByDriver) {
    if (lap.lap_number >= lapsCount) continue;
    const code = codeByNumber.get(driverNumber);
    if (!code) continue;

    const lapStart = optionalDate(lap.date_start);
    const fallback = lastPositionByCode.get(code) ?? 0;
    const base = lapStart !== null ? (lapStart - startMs) / 1000 : fallback;
    const time =
      lap.lap_duration === null ? base : base + lap.lap_duration;
    retirements.set(code, Math.max(0, time));
  }

  return retirements;
}

function buildPitWindows(
  pitRows: PitRow[],
  startMs: number,
  codeByNumber: Map<number, string>,
): Map<string, PitWindow[]> {
  const windows = new Map<string, PitWindow[]>();

  for (const row of pitRows) {
    const code = codeByNumber.get(row.driver_number);
    if (!code) continue;
    const t = (parseDate(row.date) - startMs) / 1000;
    const duration = row.lane_duration ?? row.pit_duration ?? 25;
    const window = { start: t - 2, end: t + duration + 6 };
    const list = windows.get(code) ?? [];
    list.push(window);
    windows.set(code, list);
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

function orderCodes(
  positions: Record<string, number>,
  drivers: Driver[],
): string[] {
  return drivers
    .map((driver) => driver.code)
    .filter((code) => positions[code] !== undefined)
    .sort((a, b) => positions[a] - positions[b]);
}

function reversedSoon(
  frames: Frame[],
  frameIndex: number,
  attacker: string,
  defender: string,
): boolean {
  const horizon = frames[frameIndex].t + 5;
  for (
    let index = frameIndex + 1;
    index < frames.length && frames[index].t <= horizon;
    index += 1
  ) {
    const positions = frames[index].positions;
    if (
      positions[attacker] !== undefined &&
      positions[defender] !== undefined &&
      positions[attacker] > positions[defender]
    ) {
      return true;
    }
  }
  return false;
}

function lapAtTime(
  t: number,
  lapStarts: number[],
  lapsCount: number,
): number {
  if (lapStarts.length === 0) return 1;
  let lo = 0;
  let hi = lapStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lapStarts[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return Math.max(1, Math.min(lapsCount, lo + 1));
}

function buildPositionEvents(
  frames: Frame[],
  drivers: Driver[],
  pitRows: PitRow[],
  startMs: number,
  codeByNumber: Map<number, string>,
  retirements: Map<string, number>,
  lapStarts: number[],
  lapsCount: number,
): RaceEvent[] {
  const events: RaceEvent[] = [];
  const pitWindows = buildPitWindows(pitRows, startMs, codeByNumber);
  const lastPass = new Map<string, number>();

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1];
    const current = frames[index];
    if (current.t <= 0) continue;

    const order = orderCodes(current.positions, drivers);

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

      const retiredAttacker = retirements.get(attacker);
      const retiredDefender = retirements.get(defender);
      if (
        (retiredAttacker !== undefined && current.t >= retiredAttacker - 2) ||
        (retiredDefender !== undefined && current.t >= retiredDefender - 2)
      ) {
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
      if (previousPass !== undefined && current.t - previousPass < 8) {
        continue;
      }
      lastPass.set(key, current.t);

      events.push({
        t: roundTime(current.t),
        type: rank === 0 ? "lead_change" : "overtake",
        attacker,
        defender,
        lap: lapAtTime(current.t, lapStarts, lapsCount),
        commentary: "",
      });
    }
  }

  return events;
}

function buildPitEvents(
  pitRows: PitRow[],
  startMs: number,
  duration: number,
  codeByNumber: Map<number, string>,
  lapStarts: number[],
  lapsCount: number,
): RaceEvent[] {
  const events: RaceEvent[] = [];
  const lastStopByDriver = new Map<string, number>();
  const sorted = [...pitRows].sort(
    (a, b) => parseDate(a.date) - parseDate(b.date),
  );

  for (const row of sorted) {
    const code = codeByNumber.get(row.driver_number);
    if (!code) continue;
    const t = (parseDate(row.date) - startMs) / 1000;
    if (t <= 0 || t > duration) continue;

    const previous = lastStopByDriver.get(code);
    if (previous !== undefined && t - previous < 30) continue;
    lastStopByDriver.set(code, t);

    events.push({
      t: roundTime(t),
      type: "pit",
      lap: lapAtTime(t, lapStarts, lapsCount),
      driver: code,
      commentary: "",
    });
  }

  return events;
}

async function fetchOfficialOrder(
  event: CalendarEvent,
  noCache: boolean,
): Promise<string[] | null> {
  const url = `https://api.jolpi.ca/ergast/f1/${event.season}/${event.round}/results.json?limit=100`;

  try {
    const data = await getJson<JolpicaResults>(url, noCache);
    const results = data.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
    if (results.length === 0) return null;

    return [...results]
      .filter((result) => result.Driver?.code)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((result) => result.Driver!.code!);
  } catch {
    return null;
  }
}

function applyOfficialOrder(
  frame: Frame,
  officialOrder: string[],
  drivers: Driver[],
): void {
  const known = new Set(drivers.map((driver) => driver.code));
  const positions: Record<string, number> = {};
  let rank = 0;

  for (const code of officialOrder) {
    if (!known.has(code)) continue;
    known.delete(code);
    rank += 1;
    positions[code] = rank;
  }

  for (const driver of drivers) {
    if (!known.has(driver.code)) continue;
    rank += 1;
    positions[driver.code] = rank;
  }

  frame.positions = positions;
}

async function buildOpenF1Race(
  event: CalendarEvent,
  session: SessionRow,
  noCache: boolean,
): Promise<Race> {
  const driverRows = await getJson<DriverRow[]>(
    endpoint("drivers", { session_key: session.session_key }),
    noCache,
  );
  const positionRows = await getJson<PositionRow[]>(
    endpoint("position", { session_key: session.session_key }),
    noCache,
  );
  const lapRows = await getJson<LapRow[]>(
    endpoint("laps", { session_key: session.session_key }),
    noCache,
  );
  const pitRows = await getJson<PitRow[]>(
    endpoint("pit", { session_key: session.session_key }),
    noCache,
  );
  const raceControlRows = await getJson<RaceControlRow[]>(
    endpoint("race_control", { session_key: session.session_key }),
    noCache,
  );

  if (driverRows.length === 0) throw new Error("OpenF1 returned no drivers");
  if (lapRows.length === 0) throw new Error("OpenF1 returned no laps");
  if (positionRows.length === 0) throw new Error("OpenF1 returned no positions");

  const { drivers, codeByNumber } = normalizeDrivers(driverRows);
  const startedNumbers = new Set(
    lapRows
      .filter(
        (lap) => lap.lap_number > 1 || lap.lap_duration !== null,
      )
      .map((lap) => lap.driver_number),
  );
  const nonStarters = new Set(
    [...codeByNumber.entries()]
      .filter(([driverNumber]) => !startedNumbers.has(driverNumber))
      .map(([, code]) => code),
  );
  const startMs = findRaceStart(lapRows, raceControlRows, session);
  const lapsCount = Math.max(...lapRows.map((lap) => lap.lap_number));

  if (!Number.isFinite(lapsCount) || lapsCount <= 0) {
    throw new Error("OpenF1 returned an invalid lap count");
  }

  const medianLap = medianLapTime(lapRows);
  const duration = findRaceDuration(
    lapRows,
    lapsCount,
    startMs,
    raceControlRows,
    session,
  );

  if (!Number.isFinite(duration) || duration < 60) {
    throw new Error(`Invalid race duration: ${duration}`);
  }

  const lapStarts = buildLapStarts(
    lapRows,
    lapsCount,
    startMs,
    duration,
    medianLap,
  );
  const frames = buildFrames(
    positionRows,
    codeByNumber,
    startMs,
    duration,
    nonStarters,
  );
  const officialOrder = await fetchOfficialOrder(event, noCache);
  const lastFrame = frames[frames.length - 1];
  const lastPositionByCode = new Map<string, number>();

  for (const frame of frames) {
    for (const code of Object.keys(frame.positions)) {
      lastPositionByCode.set(code, frame.t);
    }
  }

  const retirements = findRetirements(
    lapRows,
    lapsCount,
    startMs,
    codeByNumber,
    lastPositionByCode,
  );
  const positionEvents = buildPositionEvents(
    frames,
    drivers,
    pitRows,
    startMs,
    codeByNumber,
    retirements,
    lapStarts,
    lapsCount,
  );
  const pitEvents = buildPitEvents(
    pitRows,
    startMs,
    duration,
    codeByNumber,
    lapStarts,
    lapsCount,
  );

  if (officialOrder) {
    applyOfficialOrder(lastFrame, officialOrder, drivers);
  }

  const winner = orderCodes(lastFrame.positions, drivers)[0];
  const finalOrder = orderCodes(lastFrame.positions, drivers);

  if (!winner) throw new Error("Could not determine a winner");

  const events: RaceEvent[] = [
    {
      t: 0,
      type: "start",
      lap: 1,
      commentary: "",
    },
    ...positionEvents,
    ...pitEvents,
    {
      t: duration,
      type: "finish",
      attacker: winner,
      lap: lapsCount,
      commentary: "",
    },
  ];

  const info = getCircuitInfo(event.circuitKey);
  const raw: RawRace = {
    season: event.season,
    round: event.round,
    eventName: event.eventName,
    country: event.country,
    circuit: info.name,
    location: info.location,
    laps: lapsCount,
    duration,
    lapStarts,
    trackPoints: buildCircuitPoints(event.circuitKey),
    drivers,
    frames,
    pitStops: [] as RawPitStop[],
    events,
    detectEvents: false,
  };

  const race = buildRace(raw);
  const winnerName =
    race.drivers.find((driver) => driver.code === winner)?.name ?? winner;

  console.log(
    `${race.laps} laps, ${Math.round(race.duration / 60)} min, ${race.drivers.length} drivers, ${race.events.length} events, winner ${winnerName} (${finalOrder.length} classified)`,
  );

  return race;
}

function readArg(name: string): string | undefined {
  const inline = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}

async function main(): Promise<void> {
  const seasonArg = readArg("season");
  const roundArg = readArg("round");
  const noCache = process.argv.includes("--no-cache");
  const season = seasonArg ? Number(seasonArg) : null;
  const round = roundArg ? Number(roundArg) : null;

  if (seasonArg && !Number.isInteger(season)) {
    throw new Error(`Invalid --season: ${seasonArg}`);
  }
  if (roundArg && !Number.isInteger(round)) {
    throw new Error(`Invalid --round: ${roundArg}`);
  }
  if (round !== null && season === null) {
    throw new Error("--round requires --season");
  }

  const events = CALENDAR.filter(
    (event) =>
      (season === null || event.season === season) &&
      (round === null || event.round === round),
  );

  if (events.length === 0) {
    throw new Error("No calendar events matched the requested season/round");
  }

  const seasons = [...new Set(events.map((event) => event.season))];
  const sessionsBySeason = new Map<number, SessionRow[]>();

  for (const year of seasons) {
    process.stdout.write(`Fetching ${year} race sessions... `);
    const sessions = await fetchSessions(year, noCache);
    sessionsBySeason.set(year, sessions);
    console.log(`${sessions.length} sessions`);
  }

  const failures: string[] = [];

  for (const event of events) {
    const sessions = sessionsBySeason.get(event.season) ?? [];
    process.stdout.write(
      `${event.season} R${String(event.round).padStart(2, "0")} ${event.eventName}... `,
    );

    try {
      const session = findSession(event, sessions);
      const race = await buildOpenF1Race(event, session, noCache);
      const file = writeRace(race);
      console.log(`saved ${path.relative(process.cwd(), file)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${event.season} R${event.round}: ${message}`);
      console.log(`FAILED: ${message}`);
    }
  }

  const manifest = writeManifest();
  console.log(`\nManifest written with ${manifest.races.length} races.`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} race(s) failed:`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
