import manifestJson from "@/public/data/manifest.json";
import type { RaceManifest, RaceMeta } from "./types";

export const raceManifest = manifestJson as RaceManifest;
export const raceCatalog: RaceMeta[] = raceManifest.races;

export const SEASONS = [2024, 2025, 2026] as const;

export function racesForSeason(season: number): RaceMeta[] {
  return raceCatalog
    .filter((race) => race.season === season)
    .sort((a, b) => a.round - b.round);
}

export function findRaceMeta(
  season: number,
  round: number,
): RaceMeta | undefined {
  return raceCatalog.find(
    (race) => race.season === season && race.round === round,
  );
}

export function featuredRace(): RaceMeta {
  return (
    raceCatalog.find((race) => race.season === 2024 && race.round === 12) ??
    raceCatalog[0]
  );
}

export function countryLabel(country: string): string {
  return country === "Great Britain" ? "British" : country;
}
