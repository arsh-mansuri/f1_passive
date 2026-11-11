import fs from "node:fs";
import path from "node:path";
import { RACE_CONFIGS } from "./lib/rosters";
import { simulateRace } from "./lib/simulate";
import { buildRace } from "./lib/build";
import { DATA_DIR, ensureDir, writeManifest, writeRace } from "./lib/io";

const SEASONS = [2024, 2025, 2026];

function main(): void {
  ensureDir(DATA_DIR);

  for (const season of SEASONS) {
    fs.rmSync(path.join(DATA_DIR, String(season)), {
      recursive: true,
      force: true,
    });
  }

  for (const config of RACE_CONFIGS) {
    process.stdout.write(
      `${config.season} R${String(config.round).padStart(2, "0")} ${config.eventName}... `,
    );

    const raw = simulateRace(config);
    const race = buildRace(raw);
    writeRace(race);

    const winner = race.frames[race.frames.length - 1].positions;
    const champion = race.drivers.find(
      (driver) => winner[driver.code] === 1,
    );

    console.log(
      `${race.laps} laps, winner ${champion?.code ?? "?"}, ${Math.round(race.duration / 60)} min.`,
    );
  }

  const manifest = writeManifest();
  console.log(
    `\nManifest written with ${manifest.races.length} races across ${SEASONS.join(", ")}.`,
  );
}

main();
