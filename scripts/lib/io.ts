import fs from "node:fs";
import path from "node:path";
import type { Race, RaceManifest, RaceMeta } from "../../lib/types";
import { formatTrackPreview } from "../../lib/race";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "public", "data");
export const RAW_DIR = path.join(ROOT, "raw");

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, value: unknown, pretty = false): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(
    file,
    pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value),
    "utf8",
  );
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true })
    .map((entry) => String(entry))
    .filter((entry) => entry.toLowerCase().endsWith(".json"))
    .filter((entry) => path.basename(entry) !== "manifest.json")
    .map((entry) => path.join(dir, entry));
}

export function listRawFiles(): string[] {
  return listJsonFiles(RAW_DIR);
}

export function listDataFiles(): string[] {
  return listJsonFiles(DATA_DIR);
}

export function raceFileName(race: Pick<Race, "season" | "round">): string {
  return path.join(DATA_DIR, String(race.season), `${race.round}.json`);
}

export function writeRace(race: Race): string {
  const file = raceFileName(race);
  writeJson(file, race);
  return file;
}

export function writeManifest(): RaceManifest {
  const races: RaceMeta[] = listDataFiles()
    .map((file) => readJson<Race>(file))
    .filter((race) => race && race.season && race.round)
    .map((race) => ({
      season: race.season,
      round: race.round,
      eventName: race.eventName,
      country: race.country,
      circuit: race.circuit,
      location: race.location,
      laps: race.laps,
      duration: race.duration,
      drivers: race.drivers.length,
      trackPreview: formatTrackPreview(race.trackPoints, 72),
    }))
    .sort((a, b) => b.season - a.season || a.round - b.round);

  const manifest: RaceManifest = {
    generatedAt: new Date().toISOString(),
    races,
  };

  writeJson(path.join(DATA_DIR, "manifest.json"), manifest, true);
  return manifest;
}
