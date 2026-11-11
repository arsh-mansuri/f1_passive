import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RaceLoader } from "@/components/race/RaceLoader";
import { requireUser } from "@/lib/auth";
import { findRaceMeta, raceManifest } from "@/lib/catalog";

type RacePageProps = {
  params: {
    season: string;
    round: string;
  };
};

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: RacePageProps): Metadata {
  const season = Number(params.season);
  const round = Number(params.round);
  const race = findRaceMeta(season, round);

  if (!race) {
    return { title: "Race not found" };
  }

  return {
    title: `${race.eventName} ${race.season}`,
    description: `Replay the ${race.season} ${race.eventName} at ${race.circuit} as a live timing-tower visualization. ${race.laps} laps of ambient race data.`,
  };
}

export default async function RacePage({ params }: RacePageProps) {
  const season = Number(params.season);
  const round = Number(params.round);

  if (!Number.isInteger(season) || !Number.isInteger(round)) {
    notFound();
  }

  const race = findRaceMeta(season, round);
  if (!race) notFound();

  await requireUser(`/race/${season}/${round}`);

  return (
    <RaceLoader
      src={`/data/${season}/${round}.json`}
      version={raceManifest.generatedAt}
    />
  );
}
