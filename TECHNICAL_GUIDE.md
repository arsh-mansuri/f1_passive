# PitWall Technical Guide

This document explains how PitWall works from first principles: what the data means, how the archive is produced, how playback is rendered, how authentication works, and where every important algorithm lives.

If you only have ten minutes, read sections 1, 2, 5, 7, and 9. If you are modifying the data pipeline, read section 7 and section 8 closely. If you are modifying the player, read sections 9, 10, and 11.

---

## 1. Mental model

PitWall is a **build-time data pipeline plus a static, client-side race player**.

There is no race server, no streaming API, and no database of race data. A Node script pulls timing data once, converts it into compact JSON files, and commits those files to `public/data`. The Next.js app serves that JSON as static assets. The browser downloads one race file, validates it, and animates it entirely on the client.

The most important ideas to internalize:

1. **Race time is a float number of seconds since lights out.** `t = 0` is the start. `t = race.duration` is the final frame. Every frame, event, lap start, and dot position is a function of `t`.
2. **A frame is a snapshot of the running order, not a physical location.** A frame is `{ t, positions }`, where `positions[code]` is the race position (`1` = leader). The renderer turns position plus lap progress into a point on the circuit.
3. **Frames are sparse.** In real races they exist at timestamp groups where OpenF1 reported position changes. In simulated races they exist once per second. The player does not assume a fixed frame interval.
4. **Events are derived from position changes.** An overtake is inferred when adjacent drivers in the order swap between two frames. It is not read from an "overtakes" table.
5. **Commentary is baked at build time.** The browser never calls an AI service. It only reads the `commentary` string already stored in each event.
6. **Circuit geometry is shared and normalized.** Every track is 520 points in a `0..1` coordinate space, rendered into a `1000 x 1000` SVG viewBox with 40 units of padding.
7. **Visual smoothness is separated from data resolution.** The canvas runs at animation-frame speed and interpolates each dot's rank, while the React UI updates only about every 160 ms.

### Build time vs runtime

| Concern | Build time | Runtime |
| --- | --- | --- |
| OpenF1 timing | Yes | Never |
| Jolpica classification | Yes | Never |
| Circuit downloads | Yes | Never |
| Pollinations commentary | Yes | Never |
| Race JSON | Written to `public/data` | Fetched from `/data/...` |
| Supabase auth | No | Yes |
| Race animation | No | Yes, in the browser |

---

## 2. System architecture

```text
OpenF1 API ───────────────┐
                          │
Jolpica API ──────────────┤
                          ▼
                  scripts/fetch-openf1.ts
                          │
                          │  sessions, drivers, position,
                          │  laps, pit, race_control
                          ▼
               RawRace (in memory, lib/types.ts)
                          │
                          ▼
              scripts/lib/build.ts (buildRace)
                          │
                          │  commentary + event merge
                          ▼
              public/data/{season}/{round}.json
                          │
                          ▼
              scripts/lib/io.ts (writeManifest)
                          │
                          ▼
              public/data/manifest.json
                          │
                          ▼
                    Next.js static serving
                          │
                          ▼
        app/race/[season]/[round]/page.tsx (server)
                          │
                          ▼
        components/race/RaceLoader.tsx (client fetch + validate)
                          │
                          ▼
        components/race/RaceTheatre.tsx (playback state)
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
      RaceCanvas.tsx             SidePanel.tsx
      imperative dot render      standings + feed
```

Separate build-time inputs:

```text
bacinger/f1-circuits ──► scripts/fetch-circuits.ts ──► scripts/data/circuits.json
                                                            │
                                                            ▼
                                              scripts/lib/tracks.ts
                                                            │
                                                            ▼
                                                trackPoints in each race
```

Commentary pass:

```text
existing race JSON ──► scripts/gen-commentary.ts ──► Pollinations (optional)
                              │
                              ▼
                     rewrites event.commentary
```

Auth path:

```text
Browser ──► Supabase Auth ──► cookies ──► middleware.ts ──► protected route
                                             │
                                             ▼
                                  lib/supabase/middleware.ts
```

---

## 3. Repository map

```text
app/
  layout.tsx                       Root layout, metadata, fonts
  page.tsx                         Public marketing home
  globals.css                      Tailwind layers, CSS variables, utilities
  not-found.tsx                    404 page
  dashboard/page.tsx               Protected race picker
  race/[season]/[round]/page.tsx   Protected race player route
  login/page.tsx                   Login screen
  signup/page.tsx                  Signup screen
  auth/callback/route.ts           Supabase OAuth code exchange

components/
  brand/Logo.tsx
  marketing/MiniTrack.tsx          Small SVG track previews
  marketing/RacePreviewCard.tsx    Home page hero card
  dashboard/DashboardClient.tsx    Season/race browser
  auth/AuthLayout.tsx
  auth/AuthForm.tsx                Email/password + Google
  race/RaceLoader.tsx              Fetch + validate race JSON
  race/RaceTheatre.tsx             Playback coordinator
  race/RaceCanvas.tsx              SVG track + driver dots
  race/SidePanel.tsx               Standings + radio feed
  race/RaceControls.tsx            Bottom control bar
  race/LapJump.tsx                 Editable lap counter
  race/LightsOut.tsx               Intro sequence
  race/FinishOverlay.tsx           Podium + replay actions
  race/AmbientCounter.tsx          Minimal ambient HUD
  ui/icons.tsx                     Inline SVG icons

lib/
  types.ts                         Shared TypeScript data model
  race.ts                          Timing lookup and formatting helpers
  track.ts                         Coordinate and path math
  catalog.ts                       Manifest import and selectors
  commentary.ts                    Template commentary fallback
  teams.ts                         Team color map
  auth.ts                          Session, redirect, demo user
  supabase/config.ts               Env detection and demo mode
  supabase/server.ts               Server Supabase client
  supabase/client.ts               Browser Supabase singleton
  supabase/middleware.ts           Cookie/session refresh

scripts/
  fetch-openf1.ts                  Real OpenF1 ingest + Jolpica override
  fetch-circuits.ts                Pinned circuit Geometry downloader
  make-samples.ts                  Deterministic simulation generator
  build-data.ts                    Raw JSON -> final JSON
  gen-commentary.ts                Optional Pollinations baker
  lib/calendar.ts                  Calendar and circuit keys
  lib/rosters.ts                   Simulated rosters and pace
  lib/simulate.ts                  Deterministic race simulation
  lib/tracks.ts                    Circuit metadata lookup
  lib/build.ts                     Race finalization + event detection
  lib/io.ts                        File and manifest IO
  lib/random.ts                    Mulberry32 PRNG
  data/circuits.json               Vendored normalized geometry
  data/LICENSE-f1-circuits.md      Upstream MIT license

public/data/
  manifest.json                    68-race catalog
  {season}/{round}.json            Baked race files

raw/
  {season}/{round}.json            Optional hand-authored RawRace input
```

---

## 4. Stack and configuration

### Runtime and dependencies

| Dependency | Version | Role |
| --- | --- | --- |
| `next` | `14.2.35` | App Router, server components, static serving |
| `react`, `react-dom` | `18.3.1` | UI runtime |
| `typescript` | `^5.7.2` | Strict type checking |
| `tailwindcss` | `^3.4.17` | Styling |
| `framer-motion` | `11.18.2` | Panel, feed, overlay transitions |
| `@supabase/ssr` | `0.12.7` | Cookie-based auth in middleware/server |
| `@supabase/supabase-js` | `2.119.0` | Auth client |
| `@fontsource-variable/inter` | `5.3.0` | Self-hosted body font |
| `@fontsource/archivo-black` | `5.3.0` | Self-hosted display font |
| `tsx` | `4.23.15` | Runs TypeScript scripts directly |

There is no custom `next.config.js`. Next uses defaults. There is one route handler (`app/auth/callback/route.ts`); everything else is a page or a client component.

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "scripts"]
}
```

Important consequences:

- `@/foo` resolves to the project root, so `@/lib/race` and `@/public/data/manifest.json` both work.
- `npm run typecheck` checks the app and `lib`, but **not** `scripts`, because scripts are excluded. Scripts are transpiled by `tsx` without full type checking. If you change script types, run a separate check or temporarily include `scripts` in a dedicated tsconfig.
- JSON imports are allowed, which is how `lib/catalog.ts` statically imports the manifest.

### `package.json` scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `next lint` | ESLint |
| `typecheck` | `tsc --noEmit` | App/lib type check |
| `fetch:circuits` | `tsx scripts/fetch-circuits.ts` | Refresh circuit geometry |
| `fetch:openf1` | `tsx scripts/fetch-openf1.ts` | Rebuild races from real timing |
| `make:races` | `tsx scripts/make-samples.ts` | Simulated archive |
| `make:samples` | `tsx scripts/make-samples.ts` | Alias of `make:races` |
| `build:data` | `tsx scripts/build-data.ts` | Build final JSON from `raw/` |
| `gen:commentary` | `tsx scripts/gen-commentary.ts` | Bake AI commentary |
| `ingest` | `build:data && gen:commentary` | Hand-authored raw import flow |

`npm run ingest` does **not** call OpenF1. It only builds `raw/` files and then bakes commentary. To pull fresh timing data, run `npm run fetch:openf1`.

### Tailwind theme

`tailwind.config.ts` defines the PitWall design tokens:

- `pit.black` `#0A0A0A`
- `pit.surface` `#141414`
- `pit.raised` `#1B1B1B`
- `pit.line` `#262626`
- `pit.text` `#F5F5F5`
- `pit.muted` `#8A8A8A`
- `pit.dim` `#5C5C5C`
- `pit.red` `#E10600`
- `pit.red-dark` `#B00500`

Fonts:

- `font-sans`: Inter Variable
- `font-display`: Archivo Black

Custom shadows: `shadow-red-glow`, `shadow-red-glow-sm`, `shadow-card`.

Custom animations: `track-dash`, `track-drift`, `soft-pulse`, `blink-slow`, `float`, plus `scan-line` keyframes.

### Global CSS

`app/globals.css` sets:

- dark color scheme and CSS variables
- default border color `rgba(255,255,255,0.08)`
- focus outline using PitWall red
- `.font-display`, `.eyebrow`, `.glass`, `.hairline`
- `.grid-lines` with a radial mask
- `.noise` overlay
- `.scrollbar-thin` and `.scrollbar-none`
- `.track-line-animated` / `.track-line-animated-slow` path drawing
- reduced-motion overrides

### Fonts

`app/layout.tsx` imports the Fontsource CSS directly:

```ts
import "@fontsource-variable/inter";
import "@fontsource/archivo-black/latin.css";
```

No external font requests are made at runtime.

---

## 5. Data model

All shared types live in `lib/types.ts`.

### Core types

```ts
export type TrackPoint = {
  x: number;
  y: number;
};

export type Driver = {
  code: string;
  name: string;
  team: string;
  color: string;
};

export type Frame = {
  t: number;
  positions: Record<string, number>;
};

export type RaceEventType =
  | "start"
  | "overtake"
  | "lead_change"
  | "pit"
  | "finish";

export type RaceEvent = {
  t: number;
  type: RaceEventType;
  lap: number;
  attacker?: string;
  defender?: string;
  driver?: string;
  commentary: string;
  commentarySource?: "ai" | "template";
};

export type Race = {
  season: number;
  round: number;
  eventName: string;
  country: string;
  circuit: string;
  location: string;
  laps: number;
  duration: number;
  lapStarts?: number[];
  trackPoints: TrackPoint[];
  drivers: Driver[];
  frames: Frame[];
  events: RaceEvent[];
};
```

### Raw input types

```ts
export type RawPitStop = {
  t: number;
  driver: string;
  duration?: number;
};

export type RawRace = {
  season: number;
  round: number;
  eventName?: string;
  country: string;
  circuit: string;
  location?: string;
  laps: number;
  duration: number;
  lapStarts?: number[];
  trackPoints: TrackPoint[];
  drivers: Driver[];
  frames: Frame[];
  pitStops: RawPitStop[];
  events?: RaceEvent[];
  detectEvents?: boolean;
};
```

### Catalog and UI types

```ts
export type RaceMeta = {
  season: number;
  round: number;
  eventName: string;
  country: string;
  circuit: string;
  location: string;
  laps: number;
  duration: number;
  drivers: number;
  trackPreview: TrackPoint[];
};

export type RaceManifest = {
  generatedAt: string;
  races: RaceMeta[];
};

export type PlaybackSpeed = 1 | 2 | 4;

export type RaceFeedItem = {
  id: string;
  event: RaceEvent;
};

export type SessionUser = {
  id: string;
  email: string;
  demo?: boolean;
};
```

### Meaning of every field

| Field | Meaning |
| --- | --- |
| `season` | Four-digit season year |
| `round` | Calendar round number |
| `eventName` | Display race name, e.g. `British Grand Prix` |
| `country` | Country label used in metadata |
| `circuit` | Circuit display name, e.g. `Silverstone Circuit` |
| `location` | Town/region label |
| `laps` | Total race laps; also the required length of `lapStarts` |
| `duration` | Race time in seconds of the final frame |
| `lapStarts` | Race time at which each lap begins; index `i` = lap `i + 1` |
| `trackPoints` | 520 normalized `x/y` points in `0..1` |
| `drivers` | 20 or 22 driver records with team color |
| `frames` | Sparse running-order snapshots sorted by `t` |
| `events` | Derived/baked moments sorted by `t` then type priority |
| `positions` | Driver code to numeric race position |
| `t` | Seconds since lights out |
| `lap` | Lap number at the event time |
| `attacker` | Driver making the pass or winning |
| `defender` | Driver being passed |
| `driver` | Driver involved in a non-pass event, such as a pit stop |
| `commentary` | Pre-baked one-line feed text |
| `commentarySource` | `ai` after Pollinations succeeds, otherwise `template` |

### Race JSON example

```json
{
  "season": 2024,
  "round": 12,
  "eventName": "British Grand Prix",
  "country": "Great Britain",
  "circuit": "Silverstone Circuit",
  "location": "Silverstone",
  "laps": 52,
  "duration": 4742.123,
  "lapStarts": [0, 91.2, 182.7, 274.5],
  "trackPoints": [{ "x": 0.51, "y": 0.22 }, { "x": 0.53, "y": 0.2 }],
  "drivers": [
    {
      "code": "HAM",
      "name": "Lewis Hamilton",
      "team": "Mercedes",
      "color": "#27F4D2"
    }
  ],
  "frames": [
    { "t": 0, "positions": { "HAM": 1, "VER": 2 } },
    { "t": 83.4, "positions": { "HAM": 1, "VER": 2 } }
  ],
  "events": [
    {
      "t": 0,
      "type": "start",
      "lap": 1,
      "commentary": "LIGHTS OUT AND AWAY WE GO!"
    },
    {
      "t": 83.4,
      "type": "overtake",
      "lap": 1,
      "attacker": "VER",
      "defender": "HAM",
      "commentary": "VERSTAPPEN DIVES DOWN THE INSIDE!"
    }
  ]
}
```

The real file contains all laps and points; this is truncated for readability.

### Invariants

The app and scripts expect the following to be true:

- `frames` is sorted ascending by `t`.
- The first frame is at `t = 0` or earlier data has been collapsed into a `t = 0` frame.
- The last frame is at `t = duration`.
- `positions` values are unique per frame in normal data.
- `lapStarts`, when present, has exactly `laps` entries and is strictly increasing.
- `lapStarts[0]` is `0` for ingested races.
- `events` times lie in `[0, duration]`.
- `events` are sorted by `t`, then by event priority: start, lead change, overtake, pit, finish.
- `trackPoints` uses normalized coordinates, not SVG coordinates.
- `duration` is seconds, not milliseconds.

`RaceLoader` enforces a subset of these at runtime. It rejects missing fields, too few frames, too few track points, and a malformed `lapStarts` array.

---

## 6. The archive and calendar

### Coverage

The committed archive contains **68 races**:

| Season | Rounds | Notes |
| --- | --- | --- |
| 2024 | 24 | Full season |
| 2025 | 24 | Full season |
| 2026 | 20 | Through São Paulo |

The 2026 selection replaces several traditional venues:

- Barcelona-Catalunya appears as round 7.
- Madrid appears as round 14.
- Sepang appears as round 16, named `Bahrain Grand Prix in Malaysia`.
- The 2026 grid is 22 cars across 11 teams, including Audi, Cadillac, and Racing Bulls.

OpenF1 may have later 2026 rounds, but they are not in this app's calendar. The archive is intentionally a 20-round selection.

### Calendar

`scripts/lib/calendar.ts` is the source of truth for which races the pipeline knows about.

```ts
export type CalendarEvent = {
  season: number;
  round: number;
  eventName: string;
  country: string;
  circuitKey: string;
  laps: number;
  lapTime: number;
};
```

`CALENDAR` concatenates `CALENDAR_2024`, `CALENDAR_2025`, and `CALENDAR_2026`.

`circuitKey` is a stable slug such as `silverstone`, `marina-bay`, or `madrid`. It is used for three things:

1. Circuit metadata and geometry lookup in `scripts/data/circuits.json`.
2. OpenF1 session matching through `CIRCUIT_ALIASES`.
3. Simulation track points.

`laps` and `lapTime` are **only used by the simulator**. Real ingest derives lap count from the OpenF1 lap data and does not trust the calendar lap count. The calendar's `laps` is still useful as documentation and for simulated race duration.

### Rosters (simulation only)

`scripts/lib/rosters.ts` describes who drives for whom in each season, plus:

- `skill`: small pace offset per driver
- `TEAM_PACE`: per-season baseline pace per team
- roster changes by round
- grid ordering by a seeded qualifying score
- one-stop or two-stop strategy
- pit lap windows

The real ingest path does not use rosters. Drivers, teams, and colors come from OpenF1's `drivers` endpoint. Rosters exist only for the deterministic simulation fallback.

### 2024 and 2025 roster changes

The simulator models:

- 2024: Colapinto replaces Sargeant from round 16; Lawson replaces Ricciardo from round 19.
- 2025: Tsunoda and Lawson swap teams from round 3; Colapinto replaces Doohan from round 7.

Again, these are simulation details. Real race files use the actual OpenF1 driver list for that session.

---

## 7. The real-data ingest pipeline

This is the most important part of the project. The entry point is `scripts/fetch-openf1.ts`.

### 7.1 Command-line interface

```bash
npm run fetch:openf1
npm run fetch:openf1 -- --season=2025
npm run fetch:openf1 -- --season=2024 --round=12
npm run fetch:openf1 -- --season=2024 --round=12 --no-cache
```

Parsing rules:

- `--season=2024` works.
- `--season 2024` also works.
- `--round` requires `--season`.
- `--no-cache` forces fresh network requests.
- If no arguments are given, every event in `CALENDAR` is processed.
- A season filter selects every calendar event in that year.
- A season plus round selects exactly one race.

The script processes events sequentially. It writes each race as it succeeds, accumulates failures, writes the manifest at the end, and exits with code 1 if any races failed.

### 7.2 OpenF1 base URL and endpoints

Base URL:

```text
https://api.openf1.org/v1
```

Endpoints used:

| Resource | Query | Purpose |
| --- | --- | --- |
| `sessions` | `year`, `session_name=Race` | Map calendar events to OpenF1 sessions |
| `drivers` | `session_key` | Driver codes, names, teams, colors |
| `position` | `session_key` | Timestamped position changes |
| `laps` | `session_key` | Lap starts, lap durations, lap count |
| `pit` | `session_key` | Pit stop timestamps and durations |
| `race_control` | `session_key` | Race start and chequered flag fallbacks |

The session lookup is done once per season, not once per race.

### 7.3 Session matching

`findSession` matches a calendar event to an OpenF1 session by circuit short name.

Each calendar `circuitKey` maps to one or more OpenF1 names:

```ts
const CIRCUIT_ALIASES = {
  bahrain: ["Sakhir"],
  jeddah: ["Jeddah"],
  "albert-park": ["Melbourne"],
  suzuka: ["Suzuka"],
  shanghai: ["Shanghai"],
  miami: ["Miami"],
  imola: ["Imola"],
  monaco: ["Monte Carlo"],
  montreal: ["Montreal"],
  barcelona: ["Catalunya"],
  spielberg: ["Spielberg"],
  silverstone: ["Silverstone"],
  hungaroring: ["Hungaroring"],
  spa: ["Spa-Francorchamps"],
  zandvoort: ["Zandvoort"],
  monza: ["Monza"],
  madrid: ["Madring"],
  baku: ["Baku"],
  sepang: ["Kuala Lumpur"],
  "marina-bay": ["Marina Bay", "Singapore"],
  austin: ["Austin"],
  "mexico-city": ["Mexico City"],
  interlagos: ["Interlagos"],
  "las-vegas": ["Las Vegas"],
  lusail: ["Lusail"],
  "yas-marina": ["Yas Marina Circuit", "Yas Marina"]
};
```

Matching is case-insensitive. If exactly one session matches, it is used. If multiple sessions match, the script throws an ambiguity error listing the circuit and location. If none match, it throws a missing-session error.

Sessions without a `session_key` or `date_start` are filtered out before matching.

### 7.4 Caching and rate limiting

The importer is deliberately polite to OpenF1.

Constants:

```ts
const CACHE_DIR = path.join(os.tmpdir(), "pitwall-openf1-cache");
const MIN_REQUEST_INTERVAL_MS = 1200;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
```

Behavior:

- Every request URL is hashed with SHA-1. The cache filename is `<sha1>.json`.
- Cached responses are reused for seven days.
- `--no-cache` ignores existing cached files but still writes fresh responses to the cache.
- Requests are spaced at least 1.2 seconds apart globally, across all resources.
- A `429` or `5xx` response is retried up to six attempts.
- If `Retry-After` is present, it is interpreted as seconds.
- Otherwise the delay is exponential: 2.5s, 5s, 10s, 20s, 40s, 80s.
- Non-retryable HTTP errors fail immediately.
- Network exceptions are not retried by `requestJson`; they propagate and fail that race.

The cache is especially useful when iterating on event detection or commentary, because repeated runs do not re-download timing data.

### 7.5 Driver normalization

`normalizeDrivers` converts OpenF1 driver rows into `Driver` records.

Rules:

- The first row for a driver number wins; later duplicates are ignored.
- Name precedence: `first_name + last_name`, then `full_name`, then `Driver <number>`.
- Code precedence: `name_acronym` uppercased, then the first three letters of the last name, then the driver number as a string.
- Team falls back to `Unknown team`.
- Color comes from `team_colour`, prefixed with `#` if missing.
- Missing color falls back to `#888888`.

The function also returns `codeByNumber`, a map used everywhere else to translate OpenF1 driver numbers into display codes.

### 7.6 Race start time

`findRaceStart` uses the earliest lap-1 `date_start`.

Fallback order:

1. Earliest lap-1 `date_start`.
2. First race-control message matching `/RACE START|SESSION STARTED/i`.
3. Session `date_start` plus 180 seconds.

The start time becomes the zero point for every frame and event.

### 7.7 Lap count and median lap

Lap count is:

```ts
const lapsCount = Math.max(...lapRows.map((lap) => lap.lap_number));
```

It must be finite and greater than zero. The calendar lap count is not used.

`medianLapTime` filters plausible durations (`> 20` and `< 600` seconds), sorts them, and returns the middle value. If there are none, it returns 90 seconds. This value is only used to fill missing lap-start gaps and to extrapolate.

### 7.8 Race duration

`findRaceDuration` attempts to measure the race from lights out to the completion of the final lap.

Priority:

1. For every lap row whose `lap_number === lapsCount`, compute `date_start + lap_duration`. Take the earliest such finish. Duration is `(finish - startMs) / 1000`.
2. Otherwise, use the first race-control message matching `/CHEQUERED FLAG/i`.
3. Otherwise, use session `date_end`.

Duration is rounded to milliseconds and must be finite and at least 60 seconds.

### 7.9 Lap starts

`buildLapStarts` produces an array with exactly `lapsCount` entries. Entry `i` is the race time when lap `i + 1` begins.

Algorithm:

1. Create an array of `null` values of length `lapsCount`.
2. For each lap row with a valid `date_start`, compute `t = (date_start - startMs) / 1000`.
3. Ignore times outside `[0, duration]`.
4. For each lap index, keep the earliest valid time.
5. Force lap 1 to `0`.
6. For each missing value:
   - If there is a known previous and next value, interpolate linearly by lap index.
   - If only a previous value exists, add `medianLap` per missing lap.
   - If only a next value exists, subtract `medianLap` per missing lap, with a floor of 0.5.
   - If neither exists, use `medianLap * index`.
7. Enforce strict monotonicity: each start must exceed the previous start by at least `max(0.05, medianLap * 0.01)`.
8. If the last start is later than `duration - 0.25`, scale the whole array down so it fits.
9. Round every value to three decimals.

This array powers the lap counter, lap progress, lap jumps, and event lap numbers.

### 7.10 Position frames

`buildFrames` is the core conversion from timestamped position rows to sparse frames.

Steps:

1. Sort position rows by date.
2. Seed state from all rows at or before `startMs`.
3. If no row exists before the start, seed state from all rows sharing the earliest timestamp.
4. Emit a `t = 0` frame if state is non-empty.
5. Walk forward in timestamp groups.
6. Compute `t = (groupTime - startMs) / 1000`.
7. Stop if `t > duration + 1`.
8. Apply every row in the group to the state.
9. Skip groups with `t < 0`.
10. Clamp frame time to `duration` and round to milliseconds.
11. If the rounded time is not greater than the previous frame time, overwrite the previous frame's positions instead of creating a duplicate timestamp.
12. If there are no frames at all, create one at `t = 0`.
13. If the last frame is before `duration`, append a final frame at `duration`.

This produces event-driven frames whose times are irregular. The player handles that naturally because it always searches for the latest frame at or before the current playback time.

#### Non-starters

A driver is considered a starter if any lap row satisfies either:

- `lap_number > 1`, or
- `lap_duration !== null`.

A driver with only a lap-1 row whose duration is null is treated as a non-starter. After frames are built, every frame is re-ranked so that:

1. Active drivers are sorted by their existing position.
2. They are assigned ranks `1..N`.
3. Non-starters are sorted alphabetically by code and appended at the back.

This prevents a non-starter from appearing mid-field or winning.

### 7.11 Retirements

`findRetirements` finds each driver's last recorded lap.

For each driver:

- If the last lap is the final race lap, they are considered a finisher and skipped.
- Otherwise, compute the retirement time:
  - Base is the last lap's start time relative to race start.
  - If the last lap has `lap_duration === null`, the retirement time is the start of that incomplete lap.
  - If the lap has a duration, the retirement time is the end of that lap.
- If no lap start exists, the fallback is the last frame timestamp where the driver appears.
- Clamp to at least zero.

Retirement times are used only to suppress false overtake events near a retirement.

### 7.12 Pit windows

`buildPitWindows` converts pit rows into per-driver time windows:

```ts
{ start: t - 2, end: t + duration + 6 }
```

where `duration = lane_duration ?? pit_duration ?? 25`.

These windows are used to suppress position-change events caused by pit stops. They are not displayed as events themselves. Pit feed events come from `buildPitEvents`.

### 7.13 Overtake and lead-change detection

`buildPositionEvents` compares consecutive frames.

For each frame after the first:

1. Build the current order from `positions`.
2. For every adjacent pair `(attacker, defender)` in the current order:
   - Both drivers must exist in the previous frame.
   - The attacker must have been behind the defender in the previous frame
     (`previous.positions[attacker] > previous.positions[defender]`).
3. Suppress the pass if either driver is at or past `retirementTime - 2`.
4. Suppress the pass if either driver is inside a pit window at the current time.
5. Suppress the pass if the pair reverses again within five seconds (`reversedSoon`).
6. Suppress the pass if the same `attacker|defender` pair already produced a pass less than eight seconds ago.
7. Record the event:
   - `type = "lead_change"` if the attacker is rank 0.
   - Otherwise `type = "overtake"`.
   - `lap` is computed by binary-searching `lapStarts`.

This is why the importer tolerates OpenF1's transient position noise: it requires an actual adjacent-order swap, it ignores pit cycles, and it rejects quick reversals and duplicate passes.

### 7.14 Pit events

`buildPitEvents` sorts pit rows by date and emits one feed event per stop.

Rules:

- The driver must have a known code.
- `t` must be greater than 0 and at most `duration`.
- Two stops for the same driver within 30 seconds are collapsed into one.
- Event type is `pit`, with `driver` set to the code and lap from `lapStarts`.

### 7.15 Official classification from Jolpica

OpenF1 positions can differ from the official final classification because of penalties, disqualifications, and classification rules. The importer cross-checks the final order against Jolpica:

```text
https://api.jolpi.ca/ergast/f1/{season}/{round}/results.json?limit=100
```

`fetchOfficialOrder`:

- Parses `MRData.RaceTable.Races[0].Results`.
- Drops entries without `Driver.code`.
- Sorts by numeric `position`.
- Returns the array of codes.
- Returns `null` on any error or empty result.

`applyOfficialOrder` rewrites **only the final frame**:

1. Start from the drivers known to OpenF1.
2. Walk the official order.
3. Skip codes not known to OpenF1.
4. Assign `1..N` to known codes in official order.
5. Append any remaining OpenF1 drivers in their existing driver order.

This design is intentional. Applying the official order to every frame would create fake passes and fake lead changes. Applying it only at the finish means:

- A post-race disqualification is reflected in the final standings and finish overlay.
- The race animation does not invent passes that never happened.
- The winner event uses the corrected final leader.

Example: 2024 Belgian Grand Prix. Russell crossed the line first but was disqualified. The final frame shows Hamilton as P1 and Russell last, while the historical frames still show the on-track order.

### 7.16 Race assembly

After all inputs are ready:

1. Build driver data.
2. Compute start, duration, lap count, and lap starts.
3. Build frames, including non-starter correction.
4. Fetch the official order.
5. Compute retirements and pit windows.
6. Build position events and pit events.
7. Apply the official order to the final frame.
8. Determine the winner and final order from the corrected final frame.
9. Build the event list:
   - start event at `t = 0`, lap 1
   - position events
   - pit events
   - finish event at `t = duration`, lap = final lap, attacker = winner
10. Build `RawRace` with `detectEvents: false` so `buildRace` does not re-derive events.
11. Call `buildRace` to add template commentary, filter, sort, and dedupe.
12. Write the race file.

The script logs a compact summary: laps, minutes, driver count, event count, winner name, and classified count.

### 7.17 `buildRace` finalization

`scripts/lib/build.ts` is shared by every input path.

Validation:

- Frames must exist.
- Track points must exist.
- Drivers must exist.

Event flow:

```ts
const detected = raw.detectEvents === false ? [] : detectEvents(raw);
const events = [...detected, ...(raw.events ?? [])]
  .map((event) => withCommentary(event, raw))
  .filter((event) => event.t >= 0 && event.t <= raw.duration)
  .sort((a, b) => a.t - b.t || EVENT_PRIORITY[a.type] - EVENT_PRIORITY[b.type]);
```

`EVENT_PRIORITY`:

```ts
{ start: 0, lead_change: 1, overtake: 2, pit: 3, finish: 4 }
```

`withCommentary`:

- Uses existing non-empty commentary if present.
- Otherwise generates template commentary.
- Sets `commentarySource` to `template` if no source exists.

Deduplication key:

```text
t:type:attacker:defender:driver
```

Events with identical keys are removed. Frames are sorted by `t` before being returned.

`detectEvents` is the generic detector used by raw imports and the simulator. It differs slightly from the ingest detector:

| Property | Ingest detector | Generic detector |
| --- | --- | --- |
| Reversal horizon | 5 seconds | 2.5 seconds |
| Pair dedupe | 8 seconds | 5 seconds |
| Pit window | `t - 2` to `t + duration + 6` | `t - 1` to `t + duration + 2` |
| Default pit duration | 25 | 22 |
| Lap lookup | `lapStarts` binary search | Proportional to duration |
| Finish time | `duration` | `lastFrame.t - 1` |
| Official override | Yes | No |

### 7.18 Output and manifest

`scripts/lib/io.ts`:

- `DATA_DIR = public/data`
- `RAW_DIR = raw`
- `raceFileName` is `public/data/{season}/{round}.json`
- `writeRace` writes compact JSON
- `writeManifest` scans every JSON under `public/data`, ignores `manifest.json`, reads each race, and builds metadata

Manifest metadata includes:

- season, round, names, circuit, location
- lap count and duration
- driver count
- `trackPreview`: 72 evenly sampled points

Races are sorted by season descending, then round ascending. `generatedAt` is an ISO timestamp and is used by `RaceLoader` as a cache-busting version.

### 7.19 Failure behavior

- A failure for one race does not stop the others.
- Failures are collected and printed at the end.
- The manifest is still written.
- The process exits with code 1 if any race failed.
- Per-race failures include missing sessions, ambiguity, empty drivers/laps/positions, invalid lap count, and invalid duration.

---

## 8. Circuit geometry

### 8.1 Source

Circuit outlines come from the MIT-licensed [`bacinger/f1-circuits`](https://github.com/bacinger/f1-circuits) repository, pinned at commit:

```text
8094e957b8d6aa8b9f4510c93968556cccd30e02
```

`scripts/fetch-circuits.ts` downloads one GeoJSON file per circuit and writes normalized data to `scripts/data/circuits.json`. It also downloads the upstream license to `scripts/data/LICENSE-f1-circuits.md`.

### 8.2 Circuit mapping

The script maps stable keys to upstream ids:

```ts
{ key: "bahrain", id: "bh-2002" }
{ key: "silverstone", id: "gb-1948" }
{ key: "marina-bay", id: "sg-2008" }
...
```

There are 26 circuits. Some metadata is overridden after download:

| Key | Override |
| --- | --- |
| `albert-park` | name `Albert Park Grand Prix Circuit` |
| `montreal` | name `Circuit Gilles Villeneuve` |
| `spa` | location `Spa-Francorchamps` |
| `lusail` | name `Lusail International Circuit` |
| `interlagos` | location `São Paulo` |

### 8.3 Normalization pipeline

For each GeoJSON file:

1. Choose the first `LineString` feature with more than two coordinates.
2. Project longitude/latitude to approximate meters:
   - `x = lon * 111320 * cos(meanLat)`
   - `y = lat * 110540`
3. Close the ring if the first and last points are more than one meter apart; if they are already within one meter, drop the duplicate last point.
4. Resample to exactly 520 points at equal arc length.
5. Fit into a square:
   - Compute the bounding box.
   - Use a uniform scale so the larger dimension occupies 90% of the box.
   - Center the shape at `(0.5, 0.5)`.
   - Flip the Y axis so the circuit is not upside down.
   - Round to five decimal places.
6. Store metadata: source id, name, location, length, and points.

The output file shape:

```json
{
  "source": {
    "name": "bacinger/f1-circuits",
    "url": "https://github.com/bacinger/f1-circuits",
    "commit": "8094e957b8d6aa8b9f4510c93968556cccd30e02",
    "license": "MIT",
    "fetchedAt": "..."
  },
  "circuits": {
    "silverstone": {
      "sourceId": "gb-1948",
      "name": "Silverstone Circuit",
      "location": "Silverstone",
      "length": 5891,
      "points": [[0.51, 0.22], [0.52, 0.21]]
    }
  }
}
```

### 8.4 Runtime geometry helpers

`scripts/lib/tracks.ts` reads the JSON and exposes:

- `getCircuitInfo(key)`: metadata without points
- `buildCircuitPoints(key)`: `TrackPoint[]`

Both throw a helpful error if the key is missing, telling you to run `npm run fetch:circuits`.

`lib/track.ts` handles rendering math:

- `TRACK_VIEWBOX = 1000`
- `TRACK_PADDING = 40`
- `orientTrack`: reverses points if the shoelace signed area is negative
- `toViewBox`: maps `0..1` to `padding .. size - padding`
- `buildPathD`: builds a closed SVG path (`M ... L ... Z`)
- `buildTrackGeometry`: cumulative distance normalized to `0..1`
- `pointAtFraction`: interpolates a point at a fraction of total track length, wrapping around
- `buildHeroPath`: orients, then builds a path

The normalized coordinate space means every circuit uses the same renderer and the same viewBox.

### 8.5 Start line and sectors

`RaceCanvas` derives visual landmarks from geometry:

- Start point: fraction `0`.
- Forward point: fraction `0.006`.
- Track normal: perpendicular to the direction from start to forward.
- Start line: two points at `start ± normal * 0.03`, converted to the viewBox.
- Sector markers: fractions `1/3` and `2/3`.

These are visual only. The underlying geometry does not include separate timing-line data.

---

## 9. Playback runtime

### 9.1 Route and data loading

`app/race/[season]/[round]/page.tsx`:

1. Parses season and round as numbers.
2. Requires integers.
3. Looks up the race in the static manifest.
4. Calls `requireUser`.
5. Renders `RaceLoader` with `src="/data/{season}/{round}.json"` and `version={raceManifest.generatedAt}`.

`RaceLoader`:

- Fetches `${src}?v=${encodeURIComponent(version)}` with `cache: "no-cache"`.
- Validates the parsed JSON with `isRace`.
- Shows a loading screen while fetching.
- Shows an error card with retry and "back to paddock" on failure.
- Renders `RaceTheatre` when valid.

The version query means a newly generated archive is not masked by a stale browser cache.

### 9.2 Runtime validation

`isRace` requires:

- All scalar metadata fields.
- `trackPoints.length > 2`.
- `drivers.length > 0`.
- `frames.length > 1`.
- `events` is an array.
- `lapStarts` is either absent or exactly `laps` long, all finite numbers, strictly increasing.

This is deliberately shallow. It protects the player from obviously broken files without duplicating the entire ingest validation logic.

### 9.3 `RaceTheatre` state

```ts
introDone   // has the lights-out intro finished?
playing     // is the rAF loop running?
speed       // 1, 2, or 4
ambient     // hide most UI
panelOpen   // timing panel visibility
uiT         // sampled race time for React UI
feed        // visible radio items
finished    // has playback reached race.duration?
```

Refs:

```ts
tRef        // authoritative playback time
cursorRef   // next event index to consume
uiStampRef  // last UI update timestamp
canvasRef   // imperative RaceCanvas handle
```

The separation matters:

- `tRef` changes every animation frame.
- `uiT` changes only about every 160 ms.
- The canvas updates every animation frame.
- React does not re-render the whole tree 60 times per second.

### 9.4 The animation loop

The loop runs only when `introDone && playing && !finished`.

```ts
const delta = Math.min(0.25, (timestamp - last) / 1000);
const next = Math.min(race.duration, tRef.current + delta * speed);
tRef.current = next;
canvasRef.current?.render(next);

if (timestamp - uiStampRef.current > 160) {
  uiStampRef.current = timestamp;
  setUiT(next);
  flushFeed(next);
}
```

Details:

- The `0.25` clamp prevents a large jump after a tab is backgrounded.
- Speed multiplies race time, not frame count.
- `setUiT` drives lap counter, clock, standings, and progress bar.
- `flushFeed` consumes all events whose `t <= next`.
- Reaching `duration` triggers a final UI update, flushes all remaining events, stops playback, and shows the finish overlay.

### 9.5 Radio feed

`cursorRef` tracks the next event to consume. `flushFeed(upTo)`:

- Collects events while `t <= upTo`, or all remaining events if forced.
- Assigns stable IDs from event index and time.
- Reverses the new batch.
- Prepends it to the existing feed.
- Keeps at most 40 items.

So the feed is newest-first.

When jumping to a lap, the feed is rebuilt from the last 40 events before the target, also newest-first.

### 9.6 Restart, replay intro, and lap jump

- **Restart**: resets time, cursor, feed, finished; keeps `introDone = true`; starts playing.
- **Replay intro**: resets time, cursor, feed, finished; sets `introDone = false`; stops playing; remounts the lights-out overlay.
- **Jump to lap**:
  - Clamps to `1..race.laps`.
  - Uses `lapStartAt` to find the target time.
  - Advances the event cursor to all events at or before the target.
  - Rebuilds the feed from the previous 40 events.
  - Resets the canvas.
  - If the race was finished, resumes playback.
  - If the race was merely paused, stays paused at the new lap.

### 9.7 Keyboard shortcuts

The keydown handler ignores events from `INPUT`, `TEXTAREA`, `SELECT`, `BUTTON`, `A`, and contenteditable elements.

| Key | Action |
| --- | --- |
| Space | Pause/resume after intro, unless finished |
| R | Restart after intro |
| A | Toggle ambient mode |
| Escape | Leave ambient mode |
| 1 | Speed 1x |
| 2 | Speed 2x |
| 4 | Speed 4x |

### 9.8 Lights-out intro

`LightsOut` is a full-screen overlay.

Timing:

- Light `n` turns on at `600 + n * 1000` ms for `n = 1..5`.
- Lights extinguish and the title appears at `6200` ms.
- The overlay calls `onComplete` at `9600` ms, after a 380 ms fade.
- "Skip intro" calls the same completion path immediately.

A `doneRef` guard prevents double completion. The latest `onComplete` is stored in a ref so the timer uses the current callback.

### 9.9 Finish overlay

At `t = duration`, `FinishOverlay` shows:

- Podium from `standingsAt(race, race.duration).slice(0, 3)`.
- Winner code, name, and team.
- Replay button: restart without the intro.
- Lights out button: replay the intro.
- Link back to the dashboard.

The podium uses the corrected final frame, so official classifications are reflected.

### 9.10 Ambient mode

Ambient mode hides:

- header
- control bar
- timing panel
- progress bar
- finish overlay

It leaves the track, dots, and `AmbientCounter`, which shows lap, total laps, race clock, and a chequered flag label when finished. Exit via the button or `A`/`Escape`.

### 9.11 Responsive behavior

On mount, if the viewport is `<= 1023px`, the timing panel starts closed. On large screens the panel is a flex sidebar. On small screens it is a fixed right-side slide-over with a backdrop button. Note that the `lg` breakpoint is 1024px, so the mount check matches the CSS behavior.

---

## 10. Canvas rendering

`RaceCanvas` is the visual heart of the player.

### 10.1 Track layers

The SVG has a fixed `0 0 1000 1000` viewBox and uses `preserveAspectRatio="xMidYMid meet"`.

Layers, back to front:

1. Radial background gradient.
2. Faint grid pattern.
3. Red halo circle.
4. Wide blurred shadow path (`strokeWidth 34`, black, blurred).
5. Outer track path (`#1a1a1a`, width 22).
6. Inner track path (`#2c2c2c`, width 13).
7. Center dashed line (`#484848`, width 1, dash `2 16`).
8. Start line (white plus dark dashed overlay).
9. Sector markers at 1/3 and 2/3.
10. Driver groups.

The multiple path strokes create a track surface without needing filled polygons.

### 10.2 Driver groups

Each driver has an SVG `<g>` containing:

- A colored glow circle.
- A colored core circle with dark stroke.
- A white outline circle.
- A hidden code label that appears on hover.

The group is moved imperatively:

```ts
group.setAttribute("transform", `translate(${x} ${y})`);
group.style.opacity = String(opacity);
```

React only re-renders when hover state changes.

### 10.3 Rank interpolation

Dots are positioned by **race position plus lap progress**, not by physical distance.

For each driver, every frame:

```ts
const target = positions[code] ?? race.drivers.length;
```

If the driver already has a rendered state:

- If the rank jump is more than 2.5 places, snap immediately.
- Otherwise ease toward the target.

The easing factor is frame-rate independent:

```ts
const elapsed = previousT === null ? 0 : Math.max(0, Math.min(0.5, t - previousT));
const alpha = previousT === null ? 1 : 1 - Math.exp(-11 * elapsed);
displayed = state.rank + delta * alpha;
```

Then the fraction along the track is:

```ts
const fraction = lapProgress - (displayed - 1) * POSITION_SPACING;
```

with `POSITION_SPACING = 0.0072`.

This means:

- The leader is exactly at the lap-progress point.
- Each following car is offset slightly behind.
- The field is visually compressed.
- Cars swap places by easing forward or backward along the track.

The compression is intentional. Real gaps would put cars far apart, and the field would be unreadable on a small track.

### 10.4 Wrapping and fade

The fraction can be negative or greater than one. `pointAtFraction` wraps it modulo one, so the dot stays on the closed circuit.

After `t > 2`, opacity fades near the start/finish wrap point:

```ts
const fade = 0.008;
if (wrapped < fade) opacity = 0.1 + (wrapped / fade) * 0.9;
else if (wrapped > 1 - fade) opacity = 0.1 + ((1 - wrapped) / fade) * 0.9;
```

This avoids a hard visual pop when a dot crosses from the end of the path back to the start.

### 10.5 Why the data and visuals differ

The frame data only contains positions. It does not contain per-car distance, gaps, tyre state, or speed. The renderer therefore treats "position" as the primary truth and "lap progress" as the shared track position. The result is a stylized timing tower, not a physics simulation.

This is also why `SidePanel` gaps are stylized as `+0.68s` per position rather than real race gaps.

---

## 11. Timing math reference

`lib/race.ts` contains the lookup helpers used across the app.

### `frameIndexAt(frames, t)`

Binary search for the last frame whose `t <= target`. Returns `0` for an empty array.

### `positionsAt(frames, t)`

Returns `frames[frameIndexAt(frames, t)].positions` or `{}`.

### `standingsAt(race, t)`

Sorts drivers by their position at time `t`. Missing positions sort to the end.

### `lapAt(race, t)`

If `lapStarts` is valid:

- Clamp `t` to `[0, duration]`.
- Binary search for the last lap start at or before `t`.
- Return `index + 1`, clamped to `[1, laps]`.

Otherwise fall back to proportional estimation:

```ts
floor((t / duration) * laps) + 1
```

### `lapProgressAt(race, t)`

Returns a continuous lap number.

With `lapStarts`:

- Find the current lap index.
- Start is `lapStarts[index]`.
- End is the next lap start, or `duration` for the final lap.
- Fraction is `(t - start) / (end - start)`, clamped to `[0, 1]`.
- Return `index + fraction`.

Without `lapStarts`, return `(t / duration) * laps`.

This is the value that places the leader on the track.

### `lapStartAt(race, lap)`

Returns `lapStarts[lap - 1]`, or a proportional fallback.

### `raceClock(t)`

Formats seconds as `m:ss`, or `h:mm:ss` for races over an hour.

### `eventHeadline(event)`

Maps event types to feed headlines:

- `lead_change` -> `LEAD CHANGE`
- `pit` -> `PIT WINDOW`
- `start` -> `LIGHTS OUT`
- `finish` -> `CHEQUERED FLAG`
- default -> `OVERTAKE`

### `lastName(name)`

Returns the last whitespace-separated token.

### `formatTrackPreview(points, count = 48)`

Evenly samples points for compact previews. The manifest uses 72 points.

### `clamp(value, min, max)`

Standard clamping.

---

## 12. Commentary

### 12.1 Template fallback

`lib/commentary.ts` generates deterministic commentary for every event.

It builds a seed from:

```ts
event.t * 11 +
(attacker?.charCodeAt(0) ?? 0) * 7 +
(defender?.charCodeAt(1) ?? 0) * 13 +
(driver?.charCodeAt(2) ?? 0) * 17
```

It selects one of several lines per event type. This guarantees that every race has a complete feed even if no AI service is available.

Names are converted to uppercase last names. Missing drivers become `THE FIELD`.

### 12.2 AI baking

`scripts/gen-commentary.ts` optionally replaces template lines with AI lines.

Command-line options:

```bash
npm run gen:commentary
npm run gen:commentary -- 2024/12
npm run gen:commentary -- 2024/12 --limit=20
npm run gen:commentary -- --force
npm run gen:commentary -- --dry-run
```

Behavior:

- Scans every race JSON in `public/data`.
- Skips events whose `commentarySource` is already `ai`, unless `--force`.
- Builds a one-sentence prompt in a high-energy F1 TV style.
- Calls `https://text.pollinations.ai/<encoded prompt>`.
- Uses a 25-second timeout.
- Retries twice, with 1.2s and 2.4s delays.
- Rejects empty text, payment/rate-limit text, and AI refusal openings.
- Strips code fences and surrounding quotes.
- Collapses whitespace.
- Truncates long lines to roughly 220 characters with an ellipsis.
- Writes `commentary` and sets `commentarySource = "ai"`.
- Writes the race file compactly.
- Regenerates the manifest if anything changed.

If Pollinations is unavailable, the script leaves the existing template commentary untouched and exits cleanly. The app never calls Pollinations.

### 12.3 Prompt shape

Examples:

- Start: "the start of the {eventName} at {circuit}, lap 1"
- Finish: "{winner} wins the {eventName} at {circuit}"
- Lead change: "{attacker} overtakes {defender} for the LEAD at {circuit} on lap {lap}"
- Pit: "{driver} makes a pit stop at {circuit} on lap {lap}"
- Overtake: "{attacker} overtakes {defender} at {circuit} on lap {lap}"

The prompt asks for one sentence, at most 20 words, with all-caps emphasis allowed and no quotes.

---

## 13. Authentication and routing

### 13.1 Configuration

`lib/supabase/config.ts`:

```ts
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20
);
export const isDemoMode = process.env.PITWALL_DEMO === "1";
```

Demo mode is a local escape hatch. It is never meant for production.

### 13.2 Demo mode

When `PITWALL_DEMO=1`:

- `getSessionUser` returns a synthetic user.
- Middleware skips Supabase session refresh.
- `/login` and `/signup` redirect to `/dashboard`.
- Protected routes render normally.
- The dashboard shows a preview-mode banner.
- Sign out returns to the public home page.

### 13.3 Server session helper

`lib/auth.ts`:

```ts
export const getSessionUser = cache(async () => { ... });
```

The React `cache` wrapper deduplicates the session lookup within a single render pass. Behavior:

- Demo mode: return the demo user.
- Supabase not configured: return `null`.
- Supabase configured: call `supabase.auth.getUser()`.
- On success: return `{ id, email, demo: false }`.
- On error or no user: return `null`.

`requireUser(nextPath)` redirects to `/login?next=...` when there is no user.

`safeNextPath(value)` only accepts internal paths:

- Must start with `/`.
- Must not start with `//`.
- Otherwise fall back to `/dashboard`.

This prevents open redirects.

### 13.4 Server and browser clients

`lib/supabase/server.ts` creates a cookie-based server client. It returns `null` when Supabase is not configured. Cookie writes are wrapped in a try/catch because server components cannot always set cookies; middleware refreshes the session instead.

`lib/supabase/client.ts` creates a singleton browser client. It throws a helpful error if Supabase is not configured.

### 13.5 Middleware

`middleware.ts`:

- Protected prefixes: `/dashboard`, `/race`.
- Auth routes: `/login`, `/signup`.

Demo mode:

- Auth routes redirect to `/dashboard`.
- Everything else passes through.

Normal mode:

1. Refresh the Supabase session with `updateSession`.
2. If a protected route has no user, redirect to `/login?next=<path>`.
3. If an auth route has a user, redirect to `/dashboard`.
4. Otherwise continue with the refreshed response.

`updateSession`:

- Creates a response with `NextResponse.next({ request })`.
- Returns immediately if Supabase is not configured.
- Creates a server client that reads request cookies.
- On cookie updates, writes them to both the request and the response.
- Calls `supabase.auth.getUser()`.
- Catches errors and returns `user: null`.

Matcher:

```text
/((?!_next/static|_next/image|favicon.ico|icon.svg|data/|.*\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)
```

Consequences:

- `_next/static`, images, and fonts do not go through middleware.
- `data/` is excluded, so **race JSON is publicly fetchable** even though the `/race` page is protected.
- This is acceptable because race data is not private, but it is an important architectural detail.

### 13.6 Login and signup pages

Both pages:

- Call `getSessionUser`.
- Redirect to `/dashboard` if already signed in.
- Sanitize `next`.
- Pass `isSupabaseConfigured` and any error to `AuthForm`.

`AuthForm`:

- Client component.
- Requires configured Supabase.
- Email validation and a six-character minimum password.
- Signup:
  - `signUp` with `emailRedirectTo` pointing to `/auth/callback?next=...`.
  - If a session is returned immediately, route to `next`.
  - Otherwise show a "check your inbox" message.
- Login:
  - `signInWithPassword`.
  - On success, route to `next` and refresh.
- Google:
  - `signInWithOAuth({ provider: "google" })`.
  - Redirect to `/auth/callback?next=...`.
  - `prompt: "select_account"`.

### 13.7 OAuth callback

`app/auth/callback/route.ts`:

1. Reads `code`, `next`, and `error`.
2. If `error`, redirect to `/login?error=...`.
3. If Supabase is not configured, redirect with `supabase_not_configured`.
4. If `code` exists, exchange it for a session.
5. On success, redirect to the safe `next` path.
6. On failure, redirect to `/login?error=auth_callback_failed`.

### 13.8 Dashboard sign-out

`DashboardClient`:

- Demo user: route to `/`.
- Real user: call `supabase.auth.signOut()`, then route to `/` and refresh.
- Errors during sign-out are swallowed because the redirect still leaves the protected page.

### 13.9 Security model

- Supabase stores identities only; there are no app tables.
- Middleware and page-level `requireUser` both enforce access.
- `next` is sanitized to an internal path.
- Race JSON is static and public; auth protects the UI, not the data.
- The anon key is a public browser key and is expected to be exposed.
- Never enable demo mode in production.

---

## 14. Pages and components

### 14.1 `app/layout.tsx`

- Loads Inter and Archivo Black.
- Sets global metadata and Open Graph metadata.
- Sets theme color `#0A0A0A` and dark color scheme.
- Wraps children in the base background/text classes.

### 14.2 `app/page.tsx` (marketing home)

Server component. It:

- Reads the session to choose `enterHref` (`/dashboard` or `/login`).
- Selects the featured race: 2024 round 12, falling back to the first manifest race.
- Builds a hero track path from the featured race preview.
- Renders sections: hero, how it works, features, call to action, footer.
- Renders the 68-race count from `raceCatalog.length`.

The hero track uses the same `buildPathD` as the player, so marketing and runtime share geometry math.

Note: the footer text still says "Simulated race data", which is stale after the real-data migration. The app itself uses real data.

### 14.3 `app/dashboard/page.tsx`

Server component. It:

- Forces dynamic rendering.
- Calls `requireUser("/dashboard")`.
- Passes the full `raceCatalog` and user to `DashboardClient`.

### 14.4 `DashboardClient`

Client component with:

- Season selector: 2024, 2025, 2026.
- Grand Prix selector: races for the season, sorted by round.
- `Load race` button.
- Selected replay card with a mini track and stats.
- Archive grid of every race.
- "Add a race" instructions.
- Sign out.

Selection behavior:

- Initial season is the first season in `[2024, 2025, 2026]` that has races.
- Initial round is the first round of that season.
- Changing season resets to that season's first round.
- Loading navigates directly to `/race/{season}/{round}`.

The card shows laps, car count, and runtime in minutes. Runtime is `Math.round(duration / 60)`.

### 14.5 `RaceTheatre`

Layout:

- Full viewport, dark background.
- Main area with canvas.
- Top overlay: logo, race metadata, lap jump, live/paused/flag indicator, clock.
- Bottom control bar.
- Bottom progress bar.
- Timing panel on the right.
- Lights-out overlay before the intro finishes.
- Finish overlay when finished.

Panel state:

- Large screens: flex sidebar.
- Small screens: fixed slide-over with a backdrop.
- Panel starts closed on screens `<= 1023px`.

### 14.6 `RaceControls`

Contains:

- Back to dashboard link.
- Play/pause button.
- Restart button.
- Lap input with `Go`.
- 1x/2x/4x speed buttons.
- Ambient toggle.
- Panel toggle.

The lap input stays in sync with the race lap unless it is focused. Submitting clamps to `1..laps`.

### 14.7 `LapJump`

Two variants:

- `compact`: top bar, small mono text.
- `display`: panel, large display font.

Clicking turns it into a form. Enter submits, Escape cancels, blur outside cancels. Input is clamped to `1..laps`.

### 14.8 `SidePanel`

Three sections:

1. Header: live indicator, race name, season/round, circuit/location, close button.
2. Lap and race time: `LapJump` display variant plus `raceClock`.
3. Standings: position, team color, code, last name, stylized gap. Leader shows `LEADER`; others show `+((position - 1) * 0.68).toFixed(1)s`.
4. Race radio: the event feed, newest first, with type badges and lap labels.

The standings use framer-motion `layout="position"` for smooth reordering. The feed uses enter/exit transitions.

The footer states that commentary is baked at build time.

### 14.9 `LightsOut`, `FinishOverlay`, `AmbientCounter`

Covered in sections 9.8 through 9.10.

### 14.10 Marketing components

`MiniTrack` renders a small SVG preview using the same path and geometry helpers. It can render optional dots at arbitrary fractions, a start line, and glow.

`RacePreviewCard` is a static marketing illustration: a featured track, fake dots, a fake lap count, a fake radio line, and a fake podium. It is not connected to live race data.

---

## 15. Scripts reference

### `npm run fetch:openf1`

Rebuilds race JSON from OpenF1 timing and Jolpica classification.

Arguments:

- `--season=YYYY`
- `--round=N` (requires season)
- `--no-cache`

Outputs:

- `public/data/{season}/{round}.json`
- `public/data/manifest.json`

### `npm run fetch:circuits`

Downloads the pinned upstream circuit GeoJSON files, normalizes them, and writes:

- `scripts/data/circuits.json`
- `scripts/data/LICENSE-f1-circuits.md`

Use only when adding or refreshing tracks.

### `npm run make:races` / `npm run make:samples`

Runs the deterministic simulator for every calendar event.

Important: it **deletes** `public/data/2024`, `public/data/2025`, and `public/data/2026` before writing simulated races. Do not run it after a real ingest unless you intend to replace the archive.

### `npm run build:data`

Reads every JSON file under `raw/`, validates season and round, calls `buildRace`, writes final race JSON, and rewrites the manifest.

It does not delete existing races. It can therefore mix raw imports with existing data.

### `npm run gen:commentary`

Optionally rewrites commentary using Pollinations. See section 12.

### `npm run ingest`

Runs `build:data` followed by `gen:commentary`.

This is the hand-authored/raw flow. It does not fetch OpenF1.

### `npm run dev`, `build`, `start`, `lint`, `typecheck`

Standard Next.js and TypeScript commands. Remember that `typecheck` excludes `scripts`.

---

## 16. Common workflows

### 16.1 Refresh the whole archive from OpenF1

```bash
npm run fetch:openf1
```

Expect roughly 400 sequential HTTP requests with a 1.2-second minimum interval, plus retries. Cached responses make reruns much faster.

The manifest is rewritten automatically.

### 16.2 Refresh one race

```bash
npm run fetch:openf1 -- --season=2024 --round=12
```

Useful when tuning event detection for a specific race.

### 16.3 Force fresh data

```bash
npm run fetch:openf1 -- --season=2024 --round=12 --no-cache
```

This ignores the seven-day cache. It does not change the request spacing.

### 16.4 Add a new race to an existing season

1. Add a `race(...)` entry to the appropriate calendar array in `scripts/lib/calendar.ts`.
2. Ensure the `circuitKey` exists in `scripts/data/circuits.json`.
3. Ensure `CIRCUIT_ALIASES` in `scripts/fetch-openf1.ts` maps the key to the OpenF1 circuit name.
4. Run `npm run fetch:openf1 -- --season=YYYY --round=N`.
5. Optionally run `npm run gen:commentary -- YYYY/N --limit=...`.

### 16.5 Add a new circuit

1. Add a `{ key, id }` entry to `CIRCUITS` in `scripts/fetch-circuits.ts`.
2. Add metadata overrides if the upstream name/location is wrong.
3. Run `npm run fetch:circuits`.
4. Reference the new key from the calendar.
5. Add an OpenF1 alias if the names differ.

### 16.6 Import a hand-authored race

1. Create `raw/{season}/{round}.json` using the `RawRace` shape.
2. Provide at least `season`, `round`, `country`, `circuit`, `laps`, `duration`, `trackPoints`, `drivers`, `frames`, and `pitStops`.
3. Optionally provide `eventName`, `location`, `lapStarts`, `events`, and `detectEvents`.
4. Run `npm run build:data`.
5. Optionally run `npm run gen:commentary`.

If `detectEvents` is omitted or true, the generic detector derives start, overtake, lead-change, pit, and finish events from frames and pit stops. If it is false, only the provided `events` are used.

### 16.7 Replace commentary for one race

```bash
npm run gen:commentary -- 2024/12 --force --limit=50
```

### 16.8 Preview prompts without calling the API

```bash
npm run gen:commentary -- 2024/12 --dry-run --limit=5
```

### 16.9 Deploy

1. Push the repository.
2. Import into Vercel (or another host).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the production URL and `/auth/callback` to Supabase redirect URLs.
5. Build with `npm run build`.
6. Do not set `PITWALL_DEMO`.

The archive is currently about 6 MB of compact static JSON: roughly 90 KB per race on average, with the largest files around 170 KB. The README's older "72 MB" estimate no longer matches the committed files, so check actual totals if a host has strict static-file limits.

### 16.10 Add a season

1. Add `CALENDAR_YYYY` to `scripts/lib/calendar.ts` and include it in `CALENDAR`.
2. Add the season to `SEASONS` in `lib/catalog.ts`.
3. Add the season option to `SEASON_OPTIONS` in `components/dashboard/DashboardClient.tsx`.
4. Add simulator rosters if you want `make:samples` to support it.
5. Run `npm run fetch:openf1 -- --season=YYYY`.
6. Rebuild and test.

The manifest itself is generated, so no manual catalog edit is needed.

---

## 17. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Cannot find module './vendor-chunks/@swc.js'` | Stale `.next` dev artifact | Delete `.next`, then rebuild or restart dev |
| `No circuit geometry for "..."` | Missing key in `circuits.json` | Add the circuit and run `npm run fetch:circuits` |
| `No OpenF1 session for ...` | Calendar key/alias mismatch | Update `CIRCUIT_ALIASES` or the calendar |
| `Ambiguous OpenF1 session for ...` | Multiple sessions share the short name | Inspect session locations and refine matching |
| Repeated `rate limited` messages | OpenF1 throttling | Let retries run; reuse the cache; avoid `--no-cache` |
| `Invalid race duration` | Bad or incomplete lap data | Inspect the session's laps and race control rows |
| `Could not determine a winner` | Empty/invalid position data | Inspect position rows and driver codes |
| Race page says "Could not load this race" | Missing or malformed JSON | Check the browser network tab and `isRace` validation |
| Race page 404 | Round not in manifest | Run the ingest or check `manifest.json` |
| Standings panel is empty | Race file has no drivers or positions | Re-run ingest |
| Commentary is all templates | Pollinations unavailable or not run | Run `gen:commentary`; check for 402/rate limits |
| `Supabase not configured` | Missing env vars | Add `.env.local` values or use demo mode |
| OAuth returns `auth_callback_failed` | Redirect URL or code exchange problem | Check Supabase redirect URLs and callback route |
| Signed in but redirected to login | Cookie/session not refreshed | Check middleware and Supabase project settings |
| `npm run typecheck` misses script errors | `scripts` is excluded | Use a dedicated tsconfig or temporarily include it |
| Jolpica comparison reports a mismatch | Missing official driver code | Known false positive when Jolpica leaves a code blank |
| Dots look bunched together | Intentional visual compression | Expected design, not a bug |

---

## 18. Limitations and accuracy notes

- **Positions, not telemetry.** Race files contain running order and lap starts, not gaps, speeds, tyre compounds, fuel, DRS, or telemetry.
- **Stylized gaps.** The timing panel shows `+0.68s` per position. This is not real timing.
- **Derived events.** Overtakes are inferred from position changes. The filters remove most pit-cycle and noise artifacts, but they cannot be perfect.
- **Official classification at the finish only.** Post-race penalties affect the final frame and podium but not the historical animation.
- **Transient OpenF1 swaps.** The importer suppresses quick reversals and duplicate pairs, but some noise may remain.
- **Start/finish orientation.** Circuit shapes are real normalized outlines, but start/finish orientation follows the upstream geometry rather than a separately surveyed timing line.
- **Commentary quality.** Pollinations is free and intermittent. Template commentary is the guaranteed fallback.
- **No runtime third-party calls.** OpenF1, Jolpica, Pollinations, and the circuit source are build-time only.
- **Static race data is public.** Middleware excludes `data/`, so JSON can be fetched directly even without signing in.
- **2026 is a 20-round selection.** Later 2026 rounds may exist upstream but are not part of this archive.
- **Documentation drift.** The home footer says "Simulated race data" even though the archive is real. The layout metadata mentions "AI commentary" even though templates are possible. The README's "72 MB" archive estimate is stale; the committed JSON measures about 6 MB.
- **No error boundary.** There is a 404 page and a loader error state, but no global `app/error.tsx`.
- **Simulation is destructive.** `make:races` removes generated season directories.
- **Scripts are not typechecked by default.** `tsx` runs them, but `npm run typecheck` excludes them.

---

## 19. Glossary

| Term | Meaning |
| --- | --- |
| **Baked** | Computed at build time and stored in JSON |
| **Frame** | A snapshot of race positions at a race time |
| **Race time (`t`)** | Seconds since lights out |
| **Lap start** | Race time when a lap begins |
| **Lap progress** | Continuous lap number used to place the leader |
| **Position** | Official running order, `1` = leader |
| **Rank** | The numeric position used for rendering |
| **Fraction** | Position along the closed track, `0..1` |
| **Manifest** | Catalog of all races and preview metadata |
| **RawRace** | Intermediate input shape before finalization |
| **Official order** | Final classification from Jolpica |
| **Pit window** | Time range around a pit stop where passes are ignored |
| **Non-starter** | Driver with no completed lap |
| **Demo mode** | Local auth bypass via `PITWALL_DEMO=1` |
| **ViewBox** | Shared `1000 x 1000` SVG coordinate system |
| **Normalized point** | Track coordinate in `0..1` before viewBox mapping |

---

## 20. File-by-file index

| File | What to know |
| --- | --- |
| `package.json` | Versions and all commands |
| `tsconfig.json` | Strict app/lib config; scripts excluded |
| `tailwind.config.ts` | PitWall colors, fonts, shadows, animations |
| `app/globals.css` | Global styles and utility classes |
| `app/layout.tsx` | Fonts, metadata, base body |
| `app/page.tsx` | Marketing home; featured race; shared track math |
| `app/dashboard/page.tsx` | Auth gate for the race picker |
| `app/race/[season]/[round]/page.tsx` | Manifest lookup, auth gate, loader |
| `app/login/page.tsx` / `app/signup/page.tsx` | Auth screens |
| `app/auth/callback/route.ts` | OAuth code exchange |
| `app/not-found.tsx` | 404 |
| `middleware.ts` | Protected/auth routes, demo bypass, matcher |
| `lib/types.ts` | Canonical data model |
| `lib/race.ts` | Frame, lap, clock, standings helpers |
| `lib/track.ts` | Path and geometry math |
| `lib/catalog.ts` | Manifest import and race selectors |
| `lib/commentary.ts` | Template commentary |
| `lib/teams.ts` | Team colors |
| `lib/auth.ts` | Session, redirect, demo user |
| `lib/supabase/config.ts` | Env detection and demo flag |
| `lib/supabase/server.ts` | Server client |
| `lib/supabase/client.ts` | Browser singleton |
| `lib/supabase/middleware.ts` | Session refresh |
| `components/race/RaceLoader.tsx` | Fetch and validate |
| `components/race/RaceTheatre.tsx` | Playback state machine |
| `components/race/RaceCanvas.tsx` | Track and dot rendering |
| `components/race/SidePanel.tsx` | Standings and feed |
| `components/race/RaceControls.tsx` | Control bar |
| `components/race/LapJump.tsx` | Editable lap counter |
| `components/race/LightsOut.tsx` | Intro |
| `components/race/FinishOverlay.tsx` | Podium and replay |
| `components/race/AmbientCounter.tsx` | Ambient HUD |
| `components/dashboard/DashboardClient.tsx` | Race picker |
| `components/auth/AuthForm.tsx` | Email/password and Google |
| `components/marketing/MiniTrack.tsx` | Preview track |
| `components/marketing/RacePreviewCard.tsx` | Marketing hero card |
| `scripts/fetch-openf1.ts` | Real ingest, event filters, official order |
| `scripts/fetch-circuits.ts` | Pinned geometry downloader/normalizer |
| `scripts/make-samples.ts` | Destructive simulated archive |
| `scripts/build-data.ts` | Raw import builder |
| `scripts/gen-commentary.ts` | Pollinations baker |
| `scripts/lib/calendar.ts` | Calendar and circuit keys |
| `scripts/lib/rosters.ts` | Simulation rosters and pace |
| `scripts/lib/simulate.ts` | Deterministic simulation |
| `scripts/lib/build.ts` | Race finalization and generic event detection |
| `scripts/lib/io.ts` | File and manifest IO |
| `scripts/lib/tracks.ts` | Circuit lookup for scripts |
| `scripts/lib/random.ts` | Mulberry32 |
| `scripts/data/circuits.json` | Vendored normalized geometry |
| `public/data/manifest.json` | 68-race catalog |
| `public/data/{season}/{round}.json` | Baked race files |
| `raw/` | Optional hand-authored inputs |

---

## 21. Suggested reading order for a new contributor

1. `lib/types.ts` - learn the data shape.
2. `scripts/lib/build.ts` - understand finalization.
3. `scripts/fetch-openf1.ts` - understand where real data comes from.
4. `lib/race.ts` - understand time and lap lookups.
5. `lib/track.ts` - understand geometry.
6. `components/race/RaceTheatre.tsx` - understand playback.
7. `components/race/RaceCanvas.tsx` - understand rendering.
8. `components/race/SidePanel.tsx` - understand the UI feed.
9. `middleware.ts` and `lib/auth.ts` - understand access control.
10. `app/dashboard/page.tsx` and `DashboardClient.tsx` - understand navigation.

That path moves from data to motion to access, which mirrors the actual architecture.
