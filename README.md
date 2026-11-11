# PitWall

**The race, at a glance.** An ambient F1 race replayer: team-colored dots moving around real circuit geometry, a live order panel, and baked commentary with zero video. Built to sit on a second monitor while you work.

PitWall turns a race into a live timing-tower visualization: an accurate circuit outline, 20-22 team-colored dots, a live order panel, and a radio feed. Playback starts with a five-light sequence, supports 1x/2x/4x speed, and has an ambient mode that strips the UI back to just the track and a lap counter.

The repository ships with **68 races**: every round of 2024 and 2025, plus 2026 through the São Paulo Grand Prix. Race positions are built from real [OpenF1](https://openf1.org/) timing data, and final classifications are cross-checked against [Jolpica](https://github.com/jolpica/jolpica-f1). The data pipeline still accepts hand-authored raw exports through the same format.

> PitWall is not affiliated with Formula 1. Circuit geometry is derived from the MIT-licensed [`bacinger/f1-circuits`](https://github.com/bacinger/f1-circuits) dataset.

## Highlights

- Complete 2024/2025 archive plus the 2026 season through round 20
- Real circuit geometry for 26 tracks, normalized to a shared viewBox
- 20 drivers in 2024/2025 and 22 drivers across 11 teams in 2026
- Smooth rank interpolation and team-colored driver dots
- Live standings, lap counter, race clock, and commentary feed
- Lights-out intro, finish overlay, replay, speed controls, keyboard shortcuts
- Ambient mode for a clean always-on display
- Pre-baked commentary - no runtime AI calls
- Supabase email/password and Google auth
- Static race JSON served from `/public/data`; timing APIs are only called during the data build
- Responsive layout with a mobile slide-over timing panel

## Stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for transitions
- **Supabase Auth** for accounts
- **tsx** for the data pipeline
- Self-hosted fonts via Fontsource

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Preview without Supabase

If you do not want to set up Supabase yet, run the app in demo mode:

```powershell
$env:PITWALL_DEMO="1"; npm run dev
```

```bash
PITWALL_DEMO=1 npm run dev
```

Demo mode treats every visitor as `demo@pitwall.local`, bypasses the auth redirects, and renders the protected pages without a Supabase connection. **Never enable `PITWALL_DEMO` in production.**

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Email** and optionally **Google**.
3. In **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
   - Add your production URL and `/auth/callback` when you deploy.
4. Copy the project URL and anon key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

No database tables are required. PitWall only uses Supabase Auth.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (unless demo mode) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (unless demo mode) | Supabase anon/public key |
| `PITWALL_DEMO` | No | Set to `1` for local auth-free preview only |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint via Next.js |
| `npm run typecheck` | TypeScript with `--noEmit` |
| `npm run fetch:circuits` | Refresh circuit geometry from Bacinger into `scripts/data/circuits.json` |
| `npm run fetch:openf1` | Rebuild race files from OpenF1 timing and Jolpica classifications |
| `npm run make:races` | Regenerate all 68 simulated race files and the manifest |
| `npm run build:data` | Build final race JSON from `raw/**/*.json` |
| `npm run gen:commentary` | Bake Pollinations commentary into existing race JSON |
| `npm run ingest` | `build:data` followed by `gen:commentary` |

Rebuild one race while developing:

```bash
npm run fetch:openf1 -- --season=2024 --round=12
```

OpenF1 responses are cached in the OS temp directory for a week. Pass `--no-cache` to force a fresh fetch.

## How the data works

Race data is read at request time by the client from static files:

```text
public/data/2024/1.json
public/data/2024/12.json
public/data/2025/24.json
public/data/2026/16.json
public/data/2026/20.json
public/data/manifest.json
```

`manifest.json` powers the home page and dashboard catalog with 68 entries. The race page loads the selected file from `/data/{season}/{round}.json` and feeds it to `RaceTheatre`. No server route calls a timing provider, and no race data is generated at runtime.

Each race JSON contains:

```ts
type Race = {
  season: number;
  round: number;
  eventName: string;
  country: string;
  circuit: string;
  location: string;
  laps: number;
  duration: number;
  lapStarts?: number[];
  trackPoints: { x: number; y: number }[];
  drivers: { code: string; name: string; team: string; color: string }[];
  frames: { t: number; positions: Record<string, number> }[];
  events: {
    t: number;
    type: "start" | "overtake" | "lead_change" | "pit" | "finish";
    lap: number;
    attacker?: string;
    defender?: string;
    driver?: string;
    commentary: string;
    commentarySource?: "ai" | "template";
  }[];
};
```

- `t` is seconds from lights out.
- `duration` is the timestamp of the final frame.
- `lapStarts[i]` is the race time when lap `i + 1` begins; it powers the lap counter and lap-jump target.
- `positions` maps driver code to race position (`1` = leader).
- `trackPoints` contains 520 normalized points (`0..1`) rendered into a `1000x1000` viewBox.
- `eventName` is the official-style race name; `location` is the town or region.

## Race archive

| Season | Rounds | Notes |
| --- | --- | --- |
| 2024 | 24 | Colapinto replaces Sargeant from round 16; Lawson replaces Ricciardo from round 19 |
| 2025 | 24 | Tsunoda/Lawson swap teams from round 3; Colapinto replaces Doohan from round 7 |
| 2026 | 20 | Through São Paulo; Barcelona, Madrid, and Sepang replace Imola, Sakhir, and Jeddah |

The 2026 grid runs 22 cars across 11 teams, including Audi, Cadillac, and Racing Bulls. Round 16 is the **Bahrain Grand Prix in Malaysia** at Sepang International Circuit.

## Regenerating the archive

The committed `scripts/data/circuits.json` file is sufficient for normal generation. Rebuild all race data from the timing APIs:

```bash
npm run fetch:openf1
```

Or target one season or race:

```bash
npm run fetch:openf1 -- --season=2025
npm run fetch:openf1 -- --season=2024 --round=12
```

`fetch:openf1` maps each calendar round to its OpenF1 session, builds position frames from real timing, derives lap starts and pit windows, cross-checks the final order against Jolpica, then rebuilds `public/data/manifest.json`. OpenF1 responses are cached for a week in the OS temp directory.

To refresh circuit geometry from upstream:

```bash
npm run fetch:circuits
```

`fetch:circuits` downloads the pinned Bacinger source and writes:

```text
scripts/data/circuits.json
scripts/data/LICENSE-f1-circuits.md
```

`make:races` remains available as a deterministic simulation fallback. It clears the generated season directories, so do not run it after fetching real data unless you intend to replace the archive.

The pipeline is split across:

- `scripts/fetch-openf1.ts` - OpenF1 ingest, frame building, event filtering, official classification
- `scripts/lib/calendar.ts` - race calendar, names, lap counts, and circuit aliases
- `scripts/lib/rosters.ts` - optional simulated rosters and strategies
- `scripts/lib/tracks.ts` - circuit metadata and normalized track geometry
- `scripts/lib/simulate.ts` - deterministic simulation fallback
- `scripts/lib/build.ts` - race finalization and template commentary
- `scripts/lib/io.ts` - race and manifest writing

The full archive is about 72 MB of JSON, with individual race files around 1 MB.

## Importing a hand-authored race

The built-in `fetch:openf1` pipeline is the preferred path. For a custom or offline export, drop a raw file in `raw/{season}/{round}.json` using the `RawRace` shape. `eventName` and `location` are optional and fall back to `circuit`; `lapStarts` and `detectEvents` are optional too.

```json
{
  "season": 2024,
  "round": 12,
  "eventName": "British Grand Prix",
  "country": "Great Britain",
  "circuit": "Silverstone Circuit",
  "location": "Silverstone",
  "laps": 52,
  "duration": 4742,
  "trackPoints": [{ "x": 0.1, "y": 0.2 }],
  "drivers": [
    { "code": "HAM", "name": "Lewis Hamilton", "team": "Mercedes", "color": "#27F4D2" }
  ],
  "frames": [
    { "t": 0, "positions": { "HAM": 1 } }
  ],
  "pitStops": [
    { "t": 1380, "driver": "HAM", "duration": 2.4 }
  ]
}
```

2. Build the final JSON and refresh the catalog:

```bash
npm run build:data
```

3. Optionally bake AI commentary:

```bash
npm run gen:commentary -- 2024/12 --limit=20
```

Use `--force` to replace existing commentary, `--dry-run` to preview prompts, or `2024/12` to target one race.

> `npm run make:races` overwrites all generated season files. Use `build:data` for hand-authored raw imports.

### Commentary fallback

`scripts/gen-commentary.ts` calls Pollinations at **build time only**. The free endpoint is intermittently unavailable and often returns `HTTP 402 Payment Required`. When that happens, the script leaves the existing template commentary in place and exits cleanly. The app never calls Pollinations from the browser or a request handler.

## Playback and controls

- **Space** - pause/resume
- **R** - restart
- **A** - toggle ambient mode
- **Esc** - leave ambient mode
- **1 / 2 / 4** - playback speed

To jump through a race, click the lap counter in the top bar or timing panel (or use the lap field in the control bar), type the target lap, and press **Enter**. Press **Esc** before submitting to cancel.

Ambient mode hides the header, controls, and timing panel, leaving the track, dots, and a lap counter. Press `A` or use the exit button to return.

Race gaps in the timing panel are deliberately stylized (`+0.68s` per position) because frames contain positions rather than full timing loops. Replace `standingsAt`/panel gap logic if you add real gap data.

## Project structure

```text
app/
  page.tsx                    Marketing home
  dashboard/page.tsx          Protected race picker
  race/[season]/[round]/      Protected race player
  login/, signup/             Auth screens
  auth/callback/              Supabase OAuth callback
components/
  race/                       Track, theatre, panel, controls, overlays
  dashboard/                  Race picker
  auth/, marketing/, brand/, ui/
lib/
  types.ts                    Shared data types
  track.ts                    Track path helpers
  race.ts                     Frame lookup, standings, formatting
  catalog.ts                  Manifest import and selectors
  auth.ts                     Session + demo auth
scripts/
  fetch-circuits.ts           Bacinger geometry downloader/normalizer
  fetch-openf1.ts             OpenF1 timing + Jolpica classification importer
  make-samples.ts             Simulated 68-race archive generator
  build-data.ts               Raw -> final race JSON
  gen-commentary.ts           Build-time commentary baking
  lib/                        Calendar, rosters, tracks, simulation, IO
  data/                       Vendored circuit geometry + license
public/data/                  Baked race JSON + manifest
raw/                          Drop raw race exports here
```

## Circuit attribution

Circuit outlines are derived from [`bacinger/f1-circuits`](https://github.com/bacinger/f1-circuits), pinned at commit `8094e957b8d6aa8b9f4510c93968556cccd30e02` and licensed under MIT. The upstream license is included at `scripts/data/LICENSE-f1-circuits.md`.

## Deploying to Vercel

1. Push the repo and import it into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in project settings.
3. Add the deployment URL and `https://your-domain.com/auth/callback` to Supabase redirect URLs.
4. Build with `npm run build`.

Do not set `PITWALL_DEMO` on Vercel. The generated archive is roughly 72 MB, which is within Vercel's static-file limits but worth checking against any stricter host limits.

## Notes and limitations

- Race positions come from OpenF1 timing. Final classifications (including disqualifications and non-starters) come from Jolpica where available.
- OpenF1 occasionally reports transient position swaps; the importer filters pit windows, retirements, and quick reversals before emitting events.
- Pollinations commentary may be unavailable; bundled commentary uses templates.
- Driver spacing on track is visually compressed so the field stays readable.
- There are no database tables, no background jobs, and no runtime third-party API calls.
- Circuit shapes are real normalized outlines, but start/finish orientation follows the upstream source rather than a separately surveyed timing line.
- The 2026 archive is a 20-round selection through São Paulo; OpenF1 also has later rounds that are not part of this app's calendar.
