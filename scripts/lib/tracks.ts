import fs from "node:fs";
import path from "node:path";
import type { TrackPoint } from "../../lib/types";

type CircuitRecord = {
  sourceId: string;
  name: string;
  location: string;
  length: number;
  points: [number, number][];
};

type CircuitData = {
  source: {
    name: string;
    url: string;
    commit: string;
    license: string;
    fetchedAt: string;
  };
  circuits: Record<string, CircuitRecord>;
};

const DATA_FILE = path.join(__dirname, "..", "data", "circuits.json");
const DATA = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as CircuitData;

export type CircuitInfo = Omit<CircuitRecord, "points">;

export function getCircuitInfo(circuitKey: string): CircuitInfo {
  const circuit = DATA.circuits[circuitKey];
  if (!circuit) {
    throw new Error(
      `No circuit geometry for "${circuitKey}". Run npm run fetch:circuits.`,
    );
  }

  return {
    sourceId: circuit.sourceId,
    name: circuit.name,
    location: circuit.location,
    length: circuit.length,
  };
}

export function buildCircuitPoints(circuitKey: string): TrackPoint[] {
  const circuit = DATA.circuits[circuitKey];
  if (!circuit) {
    throw new Error(
      `No circuit geometry for "${circuitKey}". Run npm run fetch:circuits.`,
    );
  }

  return circuit.points.map(([x, y]) => ({ x, y }));
}
