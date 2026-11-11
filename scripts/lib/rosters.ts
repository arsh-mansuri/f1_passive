import type { Driver } from "../../lib/types";
import { TEAM_COLORS } from "../../lib/teams";
import { CALENDAR, type CalendarEvent } from "./calendar";
import { mulberry32 } from "./random";
import { getCircuitInfo } from "./tracks";

export type SeededDriver = Driver & {
  grid: number;
  pace: number;
  pitLaps: number[];
};

export type RaceConfig = CalendarEvent & {
  circuit: string;
  location: string;
  seed: number;
  drivers: SeededDriver[];
};

type SeasonDriver = {
  code: string;
  name: string;
  team: string;
  skill: number;
};

type RosterChange = {
  fromRound: number;
  remove?: string;
  add?: SeasonDriver;
  moves?: { code: string; team: string }[];
};

function driver(
  code: string,
  name: string,
  team: string,
  skill: number,
): SeasonDriver {
  return { code, name, team, skill };
}

const ROSTER_2024: SeasonDriver[] = [
  driver("VER", "Max Verstappen", "Red Bull", 0.0013),
  driver("PER", "Sergio Perez", "Red Bull", 0.0002),
  driver("NOR", "Lando Norris", "McLaren", 0.001),
  driver("PIA", "Oscar Piastri", "McLaren", 0.0008),
  driver("LEC", "Charles Leclerc", "Ferrari", 0.0008),
  driver("SAI", "Carlos Sainz", "Ferrari", 0.0005),
  driver("HAM", "Lewis Hamilton", "Mercedes", 0.0005),
  driver("RUS", "George Russell", "Mercedes", 0.0006),
  driver("ALO", "Fernando Alonso", "Aston Martin", 0.0004),
  driver("STR", "Lance Stroll", "Aston Martin", 0.0001),
  driver("GAS", "Pierre Gasly", "Alpine", 0.0003),
  driver("OCO", "Esteban Ocon", "Alpine", 0.0002),
  driver("ALB", "Alexander Albon", "Williams", 0.0003),
  driver("SAR", "Logan Sargeant", "Williams", 0),
  driver("TSU", "Yuki Tsunoda", "RB", 0.0002),
  driver("RIC", "Daniel Ricciardo", "RB", 0.0002),
  driver("HUL", "Nico Hulkenberg", "Haas", 0.0002),
  driver("MAG", "Kevin Magnussen", "Haas", 0.0001),
  driver("BOT", "Valtteri Bottas", "Sauber", 0.0001),
  driver("ZHO", "Guanyu Zhou", "Sauber", 0),
];

const CHANGES_2024: RosterChange[] = [
  {
    fromRound: 16,
    remove: "SAR",
    add: driver("COL", "Franco Colapinto", "Williams", 0.0001),
  },
  {
    fromRound: 19,
    remove: "RIC",
    add: driver("LAW", "Liam Lawson", "RB", 0.0001),
  },
];

const ROSTER_2025: SeasonDriver[] = [
  driver("NOR", "Lando Norris", "McLaren", 0.001),
  driver("PIA", "Oscar Piastri", "McLaren", 0.0009),
  driver("LEC", "Charles Leclerc", "Ferrari", 0.0008),
  driver("HAM", "Lewis Hamilton", "Ferrari", 0.0006),
  driver("VER", "Max Verstappen", "Red Bull", 0.0013),
  driver("LAW", "Liam Lawson", "Red Bull", 0.0001),
  driver("RUS", "George Russell", "Mercedes", 0.0007),
  driver("ANT", "Kimi Antonelli", "Mercedes", 0.0004),
  driver("ALO", "Fernando Alonso", "Aston Martin", 0.0004),
  driver("STR", "Lance Stroll", "Aston Martin", 0.0001),
  driver("GAS", "Pierre Gasly", "Alpine", 0.0003),
  driver("DOO", "Jack Doohan", "Alpine", 0),
  driver("ALB", "Alexander Albon", "Williams", 0.0003),
  driver("SAI", "Carlos Sainz", "Williams", 0.0004),
  driver("TSU", "Yuki Tsunoda", "RB", 0.0002),
  driver("HAD", "Isack Hadjar", "RB", 0.0003),
  driver("OCO", "Esteban Ocon", "Haas", 0.0002),
  driver("BEA", "Oliver Bearman", "Haas", 0.0002),
  driver("HUL", "Nico Hulkenberg", "Sauber", 0.0002),
  driver("BOR", "Gabriel Bortoleto", "Sauber", 0.0001),
];

const CHANGES_2025: RosterChange[] = [
  {
    fromRound: 3,
    moves: [
      { code: "TSU", team: "Red Bull" },
      { code: "LAW", team: "RB" },
    ],
  },
  {
    fromRound: 7,
    remove: "DOO",
    add: driver("COL", "Franco Colapinto", "Alpine", 0.0001),
  },
];

const ROSTER_2026: SeasonDriver[] = [
  driver("NOR", "Lando Norris", "McLaren", 0.0011),
  driver("PIA", "Oscar Piastri", "McLaren", 0.0009),
  driver("RUS", "George Russell", "Mercedes", 0.0008),
  driver("ANT", "Kimi Antonelli", "Mercedes", 0.0006),
  driver("VER", "Max Verstappen", "Red Bull", 0.0013),
  driver("HAD", "Isack Hadjar", "Red Bull", 0.0004),
  driver("LEC", "Charles Leclerc", "Ferrari", 0.0008),
  driver("HAM", "Lewis Hamilton", "Ferrari", 0.0005),
  driver("ALB", "Alexander Albon", "Williams", 0.0004),
  driver("SAI", "Carlos Sainz", "Williams", 0.0004),
  driver("LAW", "Liam Lawson", "Racing Bulls", 0.0002),
  driver("LIN", "Arvid Lindblad", "Racing Bulls", 0.0003),
  driver("ALO", "Fernando Alonso", "Aston Martin", 0.0003),
  driver("STR", "Lance Stroll", "Aston Martin", 0.0001),
  driver("OCO", "Esteban Ocon", "Haas", 0.0002),
  driver("BEA", "Oliver Bearman", "Haas", 0.0002),
  driver("HUL", "Nico Hulkenberg", "Audi", 0.0002),
  driver("BOR", "Gabriel Bortoleto", "Audi", 0.0001),
  driver("GAS", "Pierre Gasly", "Alpine", 0.0003),
  driver("COL", "Franco Colapinto", "Alpine", 0.0001),
  driver("PER", "Sergio Perez", "Cadillac", 0.0002),
  driver("BOT", "Valtteri Bottas", "Cadillac", 0.0001),
];

const ROSTERS: Record<number, SeasonDriver[]> = {
  2024: ROSTER_2024,
  2025: ROSTER_2025,
  2026: ROSTER_2026,
};

const CHANGES: Record<number, RosterChange[]> = {
  2024: CHANGES_2024,
  2025: CHANGES_2025,
  2026: [],
};

const TEAM_PACE: Record<number, Record<string, number>> = {
  2024: {
    "Red Bull": 1.0014,
    McLaren: 1.0017,
    Ferrari: 1.0009,
    Mercedes: 1.0002,
    "Aston Martin": 0.9988,
    RB: 0.9989,
    Williams: 0.9984,
    Haas: 0.9981,
    Alpine: 0.9979,
    Sauber: 0.9969,
  },
  2025: {
    McLaren: 1.0022,
    Ferrari: 1.0008,
    Mercedes: 1.001,
    "Red Bull": 1.0009,
    Williams: 0.9994,
    "Aston Martin": 0.999,
    RB: 0.9989,
    Haas: 0.9986,
    Sauber: 0.9982,
    Alpine: 0.9976,
  },
  2026: {
    McLaren: 1.0019,
    Mercedes: 1.0018,
    "Red Bull": 1.0015,
    Ferrari: 1.0012,
    Williams: 0.9996,
    "Aston Martin": 0.9992,
    "Racing Bulls": 0.999,
    Haas: 0.9988,
    Audi: 0.9985,
    Alpine: 0.9982,
    Cadillac: 0.9978,
  },
};

function rosterAt(season: number, round: number): SeasonDriver[] {
  let roster = (ROSTERS[season] ?? []).map((entry) => ({ ...entry }));

  for (const change of CHANGES[season] ?? []) {
    if (round < change.fromRound) continue;

    if (change.remove) {
      roster = roster.filter((entry) => entry.code !== change.remove);
    }

    if (change.add) {
      roster.push({ ...change.add });
    }

    for (const move of change.moves ?? []) {
      const entry = roster.find((item) => item.code === move.code);
      if (entry) entry.team = move.team;
    }
  }

  return roster;
}

function pitLapsFor(laps: number, rng: () => number): number[] {
  if (rng() < 0.25) {
    const first = Math.max(4, Math.floor(laps * (0.26 + rng() * 0.12)));
    const second = Math.min(
      laps - 3,
      Math.max(first + 8, Math.floor(laps * (0.58 + rng() * 0.12))),
    );
    return [first, second];
  }

  return [Math.min(laps - 3, Math.max(4, Math.floor(laps * (0.38 + rng() * 0.16))))];
}

function buildRaceConfig(event: CalendarEvent): RaceConfig {
  const rng = mulberry32(event.season * 1000 + event.round);
  const circuit = getCircuitInfo(event.circuitKey);
  const paceByTeam = TEAM_PACE[event.season] ?? {};
  const roster = rosterAt(event.season, event.round);

  const rated = roster.map((entry) => {
    const teamPace = paceByTeam[entry.team] ?? 0.998;
    const form = (rng() - 0.5) * 0.0006;
    return {
      ...entry,
      basePace: teamPace + entry.skill + form,
      qualifying: teamPace + entry.skill + (rng() - 0.5) * 0.0016,
    };
  });

  rated.sort((a, b) => b.qualifying - a.qualifying || a.code.localeCompare(b.code));

  return {
    ...event,
    circuit: circuit.name,
    location: circuit.location,
    seed: event.season * 1000 + event.round,
    drivers: rated.map((entry, index) => ({
      code: entry.code,
      name: entry.name,
      team: entry.team,
      color: TEAM_COLORS[entry.team],
      grid: index + 1,
      pace: entry.basePace + (rng() - 0.5) * 0.0008,
      pitLaps: pitLapsFor(event.laps, rng),
    })),
  };
}

export const RACE_CONFIGS: RaceConfig[] = CALENDAR.map(buildRaceConfig);
