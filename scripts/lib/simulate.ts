import type { Frame, RawPitStop, RawRace } from "../../lib/types";
import { mulberry32 } from "./random";
import type { RaceConfig, SeededDriver } from "./rosters";
import { buildCircuitPoints } from "./tracks";

type SimState = {
  driver: SeededDriver;
  phase: number;
  progress: number;
  pitRemaining: number;
  pitIndex: number;
  pitDurations: number[];
  stops: RawPitStop[];
};

function makeState(driver: SeededDriver, rng: () => number): SimState {
  return {
    driver,
    phase: rng() * Math.PI * 2,
    progress: -(driver.grid - 1) * 0.0016,
    pitRemaining: 0,
    pitIndex: 0,
    pitDurations: driver.pitLaps.map(() => 21 + Math.floor(rng() * 4)),
    stops: [],
  };
}

/**
 * A deterministic race simulation. Cars advance by distance, not by rank, so
 * overtakes happen because one car is genuinely quicker than another. Pit stops
 * remove time from the clock, which produces realistic order changes.
 */
export function simulateRace(config: RaceConfig): RawRace {
  const rng = mulberry32(config.seed);
  const maxStops = Math.max(...config.drivers.map((d) => d.pitLaps.length));
  const duration = Math.round(
    config.laps * config.lapTime + maxStops * 24 + 14,
  );
  const states = config.drivers.map((driver) => makeState(driver, rng));
  const frames: Frame[] = [];
  const pitStops: RawPitStop[] = [];

  const ordered = () =>
    [...states].sort(
      (a, b) =>
        b.progress - a.progress || a.driver.grid - b.driver.grid,
    );

  for (let t = 0; t <= duration; t += 1) {
    if (t > 0) {
      for (const state of states) {
        if (state.pitRemaining > 0) {
          state.pitRemaining -= 1;
          continue;
        }

        const currentLap = Math.floor(state.progress) + 1;
        const nextPitLap = state.driver.pitLaps[state.pitIndex];

        if (
          t > 50 &&
          nextPitLap !== undefined &&
          currentLap >= nextPitLap
        ) {
          const stopDuration =
            state.pitDurations[state.pitIndex] ?? 22;
          state.pitRemaining = stopDuration;
          state.pitIndex += 1;
          state.stops.push({
            t,
            driver: state.driver.code,
            duration: stopDuration,
          });
          continue;
        }

        const wobble =
          0.004 * Math.sin(t / 26 + state.phase) +
          0.0018 * Math.sin(t / 7.3 + state.phase * 1.7) +
          0.0008 * Math.sin(t / 2.9 + state.phase * 0.4);
        const speed =
          (state.driver.pace * (1 + wobble)) / config.lapTime;

        state.progress += speed;
      }
    }

    const positions: Record<string, number> = {};
    ordered().forEach((state, index) => {
      positions[state.driver.code] = index + 1;
    });

    frames.push({ t, positions });
  }

  for (const state of states) {
    pitStops.push(...state.stops);
  }

  pitStops.sort((a, b) => a.t - b.t);

  return {
    season: config.season,
    round: config.round,
    eventName: config.eventName,
    country: config.country,
    circuit: config.circuit,
    location: config.location,
    laps: config.laps,
    duration,
    trackPoints: buildCircuitPoints(config.circuitKey),
    drivers: config.drivers.map(({ grid, pace, pitLaps, ...driver }) => driver),
    frames,
    pitStops,
  };
}
