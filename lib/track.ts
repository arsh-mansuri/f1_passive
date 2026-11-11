import type { TrackPoint } from "./types";

export const TRACK_VIEWBOX = 1000;
export const TRACK_PADDING = 40;

function distance(a: TrackPoint, b: TrackPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function signedArea(points: TrackPoint[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/** Ensures the track points run in a consistent direction so the start line
 *  and dot interpolation are predictable. */
export function orientTrack(points: TrackPoint[]): TrackPoint[] {
  if (points.length < 3) return points;
  return signedArea(points) < 0 ? [...points].reverse() : points;
}

export function toViewBox(
  point: TrackPoint,
  size = TRACK_VIEWBOX,
  padding = TRACK_PADDING,
): TrackPoint {
  const inner = size - padding * 2;
  return {
    x: padding + point.x * inner,
    y: padding + point.y * inner,
  };
}

export function buildPathD(
  points: TrackPoint[],
  size = TRACK_VIEWBOX,
  padding = TRACK_PADDING,
): string {
  if (points.length === 0) return "";
  const inner = size - padding * 2;
  const mapped = points.map((p) => ({
    x: padding + p.x * inner,
    y: padding + p.y * inner,
  }));

  return (
    `M ${mapped[0].x.toFixed(2)} ${mapped[0].y.toFixed(2)} ` +
    mapped
      .slice(1)
      .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ") +
    " Z"
  );
}

export type TrackGeometry = {
  /** normalised (0..1) points, ordered */
  points: TrackPoint[];
  /** cumulative distance at each point, normalised to 0..1 */
  cumulative: number[];
};

export function buildTrackGeometry(points: TrackPoint[]): TrackGeometry {
  const cumulative: number[] = [0];
  let total = 0;

  for (let i = 1; i <= points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i % points.length];
    total += distance(a, b);
    if (i < points.length) cumulative.push(total);
  }

  if (total === 0) {
    return { points, cumulative: points.map(() => 0) };
  }

  return {
    points,
    cumulative: cumulative.map((value) => value / total),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Returns a point along the closed track at a fraction 0..1. */
export function pointAtFraction(
  geometry: TrackGeometry,
  fraction: number,
): TrackPoint {
  const points = geometry.points;
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const wrapped = ((fraction % 1) + 1) % 1;
  const cumulative = geometry.cumulative;

  let lo = 0;
  let hi = cumulative.length - 1;

  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] <= wrapped) lo = mid;
    else hi = mid;
  }

  const start = points[lo];
  const end = points[(lo + 1) % points.length];
  const span = geometry.cumulative[(lo + 1) % cumulative.length] - cumulative[lo];
  let local = span > 0 ? (wrapped - cumulative[lo]) / span : 0;

  if (lo + 1 >= cumulative.length) {
    // final segment wraps back to the first point
    const finalSpan = 1 - cumulative[lo] + cumulative[0];
    local = finalSpan > 0 ? (wrapped - cumulative[lo]) / finalSpan : 0;
    local = Math.max(0, Math.min(1, local));
    return { x: lerp(start.x, points[0].x, local), y: lerp(start.y, points[0].y, local) };
  }

  local = Math.max(0, Math.min(1, local));
  return { x: lerp(start.x, end.x, local), y: lerp(start.y, end.y, local) };
}

/** Builds a smooth-ish closed SVG path from dense track points. */
export function buildHeroPath(
  points: TrackPoint[],
  size = TRACK_VIEWBOX,
  padding = TRACK_PADDING,
): string {
  return buildPathD(points.length > 0 ? orientTrack(points) : points, size, padding);
}
