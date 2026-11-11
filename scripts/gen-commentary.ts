import path from "node:path";
import type { Driver, Race, RaceEvent } from "../lib/types";
import {
  listDataFiles,
  readJson,
  writeJson,
  writeManifest,
} from "./lib/io";

const POLLINATIONS_BASE = "https://text.pollinations.ai/";
const RETRIES = 2;
const TIMEOUT_MS = 25_000;
const DELAY_MS = 1_200;

type Cli = {
  only?: { season: number; round: number };
  force: boolean;
  limit: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Cli {
  const cli: Cli = { force: false, limit: Infinity, dryRun: false };

  for (const arg of argv) {
    if (arg === "--force") cli.force = true;
    else if (arg === "--dry-run") cli.dryRun = true;
    else if (arg.startsWith("--limit=")) {
      cli.limit = Number(arg.split("=")[1]) || Infinity;
    } else if (/^\d{4}\/\d+$/.test(arg)) {
      const [season, round] = arg.split("/").map(Number);
      cli.only = { season, round };
    }
  }

  return cli;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function driverName(code: string | undefined, drivers: Driver[]): string {
  if (!code) return "the leader";
  const driver = drivers.find((item) => item.code === code);
  return driver ? lastName(driver.name) : code;
}

function buildPrompt(event: RaceEvent, race: Race): string {
  const attacker = driverName(event.attacker, race.drivers);
  const defender = driverName(event.defender, race.drivers);
  const pitting = driverName(event.driver, race.drivers);
  const intro =
    "Write ONE sentence of high-energy F1 TV commentary, max 20 words, all caps emphasis allowed, no quotes.";

  switch (event.type) {
    case "start":
      return `${intro} Moment: the start of the ${race.eventName} at ${race.circuit}, lap 1. Style: Crofty.`;
    case "finish":
      return `${intro} Moment: ${attacker} wins the ${race.eventName} at ${race.circuit}. Style: Crofty.`;
    case "lead_change":
      return `${intro} Moment: ${attacker} overtakes ${defender} for the LEAD at ${race.circuit} on lap ${event.lap}. Style: Crofty.`;
    case "pit":
      return `${intro} Moment: ${pitting} makes a pit stop at ${race.circuit} on lap ${event.lap}. Style: Crofty.`;
    default:
      return `${intro} Moment: ${attacker} overtakes ${defender} at ${race.circuit} on lap ${event.lap}. Style: Crofty.`;
  }
}

function cleanResponse(raw: string): string | null {
  let text = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  if (/payment required|rate limit|too many requests/i.test(text)) return null;
  if (/^(as an ai|i'm sorry|i cannot|i can't)/i.test(text)) return null;

  if (text.length > 220) {
    text = `${text.slice(0, 217).trimEnd()}…`;
  }

  return text;
}

async function callPollinations(prompt: string): Promise<string | null> {
  const url = `${POLLINATIONS_BASE}${encodeURIComponent(prompt)}`;

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: "text/plain" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const cleaned = cleanResponse(await response.text());
      if (cleaned) return cleaned;
      throw new Error("empty response");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      if (attempt === RETRIES) {
        console.warn(`    pollinations failed: ${detail}`);
      } else {
        await sleep(DELAY_MS * (attempt + 1));
      }
    }
  }

  return null;
}

function shouldProcess(event: RaceEvent, force: boolean): boolean {
  if (force) return true;
  return event.commentarySource !== "ai";
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const files = listDataFiles();
  let processed = 0;
  let generated = 0;
  let failed = 0;
  let changedAny = false;

  for (const file of files) {
    const race = readJson<Race>(file);
    if (cli.only) {
      if (
        race.season !== cli.only.season ||
        race.round !== cli.only.round
      ) {
        continue;
      }
    }

    let changed = false;
    console.log(
      `\n${race.season} ${race.country} GP — ${path.basename(file)}`,
    );

    for (const event of race.events) {
      if (processed >= cli.limit) break;
      if (!shouldProcess(event, cli.force)) continue;

      processed += 1;
      const prompt = buildPrompt(event, race);

      if (cli.dryRun) {
        console.log(`  [dry-run] ${event.type} @${event.t}: ${prompt}`);
        continue;
      }

      const commentary = await callPollinations(prompt);
      if (commentary) {
        event.commentary = commentary;
        event.commentarySource = "ai";
        generated += 1;
        changed = true;
        console.log(`  ✓ ${event.type} @${event.t}s: ${commentary}`);
      } else {
        failed += 1;
      }

      await sleep(DELAY_MS);
    }

    if (changed && !cli.dryRun) {
      writeJson(file, race);
      changedAny = true;
    }

    if (processed >= cli.limit) break;
  }

  if (changedAny) {
    writeManifest();
  }

  console.log(
    `\nDone. processed=${processed} generated=${generated} failed=${failed}${cli.dryRun ? " (dry run)" : ""}`,
  );

  if (failed > 0 && generated === 0) {
    console.log(
      "Pollinations returned no usable text. Existing baked commentary was left untouched.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
