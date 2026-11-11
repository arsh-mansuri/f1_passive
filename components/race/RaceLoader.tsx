"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RaceTheatre } from "./RaceTheatre";
import { RestartIcon } from "@/components/ui/icons";
import { ScrollDrift } from "@/components/ui/ScrollDrift";
import type { Race } from "@/lib/types";

type RaceLoaderProps = {
  src: string;
  version: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; race: Race }
  | { status: "error"; message: string };

function isRace(value: unknown): value is Race {
  if (!value || typeof value !== "object") return false;
  const race = value as Partial<Race>;
  const lapStartsValid =
    race.lapStarts === undefined ||
    (Array.isArray(race.lapStarts) &&
      race.lapStarts.length === race.laps &&
      race.lapStarts.every(
        (start, index) =>
          typeof start === "number" &&
          Number.isFinite(start) &&
          (index === 0 || start > race.lapStarts![index - 1]),
      ));

  return (
    typeof race.season === "number" &&
    typeof race.round === "number" &&
    typeof race.eventName === "string" &&
    typeof race.country === "string" &&
    typeof race.circuit === "string" &&
    typeof race.location === "string" &&
    typeof race.laps === "number" &&
    typeof race.duration === "number" &&
    Array.isArray(race.trackPoints) &&
    race.trackPoints.length > 2 &&
    Array.isArray(race.drivers) &&
    race.drivers.length > 0 &&
    Array.isArray(race.frames) &&
    race.frames.length > 1 &&
    Array.isArray(race.events) &&
    lapStartsValid
  );
}

export function RaceLoader({ src, version }: RaceLoaderProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setState({ status: "loading" });

    const url = `${src}?v=${encodeURIComponent(version)}`;

    fetch(url, { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load race data (${response.status}).`);
        }
        return response.json() as Promise<unknown>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!isRace(data)) {
          throw new Error("Race data is missing or malformed.");
        }
        setState({ status: "ready", race: data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load this race.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [src, version, attempt]);

  if (state.status === "ready") {
    return (
      <ScrollDrift>
        <RaceTheatre race={state.race} />
      </ScrollDrift>
    );
  }

  if (state.status === "error") {
    return (
      <ScrollDrift>
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#070707] px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pit-red">
            Timing feed lost
          </p>
          <h1 className="mt-3 text-xl font-semibold text-white">
            We couldn&apos;t load this race.
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/40">
            {state.message}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-pit-red px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#ff1a12]"
            >
              <RestartIcon className="h-3.5 w-3.5" />
              Try again
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 px-4 py-3 text-[11px] font-medium text-white/55 transition-colors hover:border-white/25 hover:text-white"
            >
              Back to the paddock
            </Link>
          </div>
        </div>
        </main>
      </ScrollDrift>
    );
  }

  return (
    <ScrollDrift>
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#070707] px-6">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 rounded-full border border-white/[0.08]" />
        <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-pit-red [animation-duration:1.1s]" />
        <span className="h-2 w-2 rounded-full bg-pit-red shadow-red-glow-sm" />
      </div>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
        Loading timing data
      </p>
      <p className="mt-2 font-mono text-[10px] text-white/15">
        Establishing telemetry link
      </p>
      </main>
    </ScrollDrift>
  );
}
