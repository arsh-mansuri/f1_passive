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
