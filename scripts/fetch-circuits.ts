import fs from "node:fs";
import path from "node:path";

type CircuitSource = {
  key: string;
  id: string;
};

type GeoJsonFeature = {
  properties: {
    id: string;
    Location: string;
    Name: string;
    length: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
};

type GeoJson = {
  features: GeoJsonFeature[];
};

type CircuitRecord = {
  sourceId: string;
  name: string;
  location: string;
  length: number;
  points: [number, number][];
};

const COMMIT = "8094e957b8d6aa8b9f4510c93968556cccd30e02";
const REPO_URL = "https://github.com/bacinger/f1-circuits";
const RAW_BASE = `https://raw.githubusercontent.com/bacinger/f1-circuits/${COMMIT}/circuits`;
const OUT_DIR = path.join(process.cwd(), "scripts", "data");
const OUT_FILE = path.join(OUT_DIR, "circuits.json");
const LICENSE_FILE = path.join(OUT_DIR, "LICENSE-f1-circuits.md");
const POINT_COUNT = 520;
const MARGIN = 0.05;

const OVERRIDES: Record<
  string,
  Partial<Pick<CircuitRecord, "name" | "location">>
> = {
  "albert-park": { name: "Albert Park Grand Prix Circuit" },
  montreal: { name: "Circuit Gilles Villeneuve" },
  spa: { location: "Spa-Francorchamps" },
  lusail: { name: "Lusail International Circuit" },
  interlagos: { location: "São Paulo" },
};

const CIRCUITS: CircuitSource[] = [
  { key: "bahrain", id: "bh-2002" },
  { key: "jeddah", id: "sa-2021" },
  { key: "albert-park", id: "au-1953" },
  { key: "suzuka", id: "jp-1962" },
  { key: "shanghai", id: "cn-2004" },
  { key: "miami", id: "us-2022" },
  { key: "imola", id: "it-1953" },
  { key: "monaco", id: "mc-1929" },
  { key: "montreal", id: "ca-1978" },
  { key: "barcelona", id: "es-1991" },
  { key: "spielberg", id: "at-1969" },
  { key: "silverstone", id: "gb-1948" },
  { key: "hungaroring", id: "hu-1986" },
  { key: "spa", id: "be-1925" },
  { key: "zandvoort", id: "nl-1948" },
  { key: "monza", id: "it-1922" },
  { key: "madrid", id: "es-2026" },
  { key: "baku", id: "az-2016" },
  { key: "sepang", id: "my-1999" },
  { key: "marina-bay", id: "sg-2008" },
  { key: "austin", id: "us-2012" },
  { key: "mexico-city", id: "mx-1962" },
  { key: "interlagos", id: "br-1940" },
  { key: "las-vegas", id: "us-2023" },
  { key: "lusail", id: "qa-2004" },
  { key: "yas-marina", id: "ae-2009" },
];

function project(coordinates: [number, number][]) {
  const meanLat =
    coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
  const cosLat = Math.cos((meanLat * Math.PI) / 180);

  return coordinates.map(([lon, lat]) => ({
    x: lon * 111320 * cosLat,
    y: lat * 110540,
  }));
}

function closeRing(points: { x: number; y: number }[]) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const dx = first.x - last.x;
  const dy = first.y - last.y;
  if (Math.sqrt(dx * dx + dy * dy) < 1) {
    return points.slice(0, -1);
  }
  return points;
}

function resample(points: { x: number; y: number }[], count: number) {
  if (points.length < 2) return points;

  const ring = [...points, points[0]];
  const cumulative = [0];
  let total = 0;

  for (let index = 1; index < ring.length; index += 1) {
    const dx = ring[index].x - ring[index - 1].x;
    const dy = ring[index].y - ring[index - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
    cumulative.push(total);
  }

  const result: { x: number; y: number }[] = [];
  let segment = 0;

  for (let index = 0; index < count; index += 1) {
    const target = (index / count) * total;
    while (segment < cumulative.length - 2 && cumulative[segment + 1] < target) {
      segment += 1;
    }

    const start = ring[segment];
    const end = ring[segment + 1];
    const span = cumulative[segment + 1] - cumulative[segment];
    const local = span > 0 ? (target - cumulative[segment]) / span : 0;

    result.push({
      x: start.x + (end.x - start.x) * local,
      y: start.y + (end.y - start.y) * local,
    });
  }

  return result;
}

function fit(points: { x: number; y: number }[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const target = 1 - MARGIN * 2;
  const scale = Math.min(target / width, target / height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return points.map((point) => {
    const x = 0.5 + (point.x - centerX) * scale;
    const y = 0.5 - (point.y - centerY) * scale;
    return [
      Math.round(x * 100000) / 100000,
      Math.round(y * 100000) / 100000,
    ] as [number, number];
  });
}

async function fetchCircuit(source: CircuitSource): Promise<[string, CircuitRecord]> {
  const response = await fetch(`${RAW_BASE}/${source.id}.geojson`);
  if (!response.ok) {
    throw new Error(`${source.id}: HTTP ${response.status}`);
  }

  const geojson = (await response.json()) as GeoJson;
  const feature = geojson.features.find(
    (item) =>
      item.geometry.type === "LineString" && item.geometry.coordinates.length > 2,
  );

  if (!feature) {
    throw new Error(`${source.id}: no LineString found`);
  }

  const ring = closeRing(project(feature.geometry.coordinates));
  const points = fit(resample(ring, POINT_COUNT));

  return [
    source.key,
    {
      sourceId: source.id,
      name: feature.properties.Name,
      location: feature.properties.Location,
      length: feature.properties.length,
      ...OVERRIDES[source.key],
      points,
    },
  ];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = await Promise.all(CIRCUITS.map(fetchCircuit));
  const circuits = Object.fromEntries(entries);

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        source: {
          name: "bacinger/f1-circuits",
          url: REPO_URL,
          commit: COMMIT,
          license: "MIT",
          fetchedAt: new Date().toISOString(),
        },
        circuits,
      },
      null,
      0,
    ),
    "utf8",
  );

  const license = await fetch(
    `https://raw.githubusercontent.com/bacinger/f1-circuits/${COMMIT}/LICENSE.md`,
  );
  if (!license.ok) {
    throw new Error(`License download failed: HTTP ${license.status}`);
  }
  fs.writeFileSync(LICENSE_FILE, await license.text(), "utf8");

  console.log(`Wrote ${entries.length} circuits to ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
