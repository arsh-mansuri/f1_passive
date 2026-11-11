import type { RawRace } from "../lib/types";
import { buildRace } from "./lib/build";
import {
  listRawFiles,
  readJson,
  writeManifest,
  writeRace,
} from "./lib/io";

function main(): void {
  const files = listRawFiles();

  if (files.length === 0) {
    console.log(
      "No raw JSON found. Drop FastF1/OpenF1 exports into /raw/{season}/{round}.json first.",
    );
    return;
  }

  const built: string[] = [];

  for (const file of files) {
    const raw = readJson<RawRace>(file);

    if (!raw.season || !raw.round) {
      console.warn(`Skipping ${file}: missing season/round.`);
      continue;
    }

    try {
      const race = buildRace(raw);
      const output = writeRace(race);
      built.push(`${race.season}/${race.round} → ${output}`);
      console.log(
        `Built ${race.season} ${race.country} GP — ${race.frames.length} frames, ${race.events.length} events.`,
      );
    } catch (error) {
      console.error(
        `Failed to build ${file}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const manifest = writeManifest();
  console.log(
    `\nBuilt ${built.length} race(s). Manifest now lists ${manifest.races.length}.`,
  );
  console.log("Run `npm run gen:commentary` to bake AI commentary into events.");
}

main();
