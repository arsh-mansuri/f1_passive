import type { Driver, RaceEvent } from "./types";
import { lastName } from "./race";

type CommentaryContext = {
  eventName: string;
  circuit: string;
  country: string;
  drivers: Driver[];
};

function pick<T>(items: T[], seed: number): T {
  const index = Math.abs(Math.floor(seed)) % items.length;
  return items[index];
}

function hashSeed(event: RaceEvent): number {
  return (
    event.t * 11 +
    (event.attacker?.charCodeAt(0) ?? 0) * 7 +
    (event.defender?.charCodeAt(1) ?? 0) * 13 +
    (event.driver?.charCodeAt(2) ?? 0) * 17
  );
}

function nameOf(code: string | undefined, drivers: Driver[]): string {
  if (!code) return "THE FIELD";
  const driver = drivers.find((item) => item.code === code);
  return driver ? lastName(driver.name).toUpperCase() : code.toUpperCase();
}

/**
 * Baked fallback commentary. The build-time Pollinations script overwrites
 * these with AI lines where possible; if the free API is unavailable the app
 * still ships with a full, punchy commentary feed.
 */
export function templateCommentary(
  event: RaceEvent,
  context: CommentaryContext,
): string {
  const attacker = nameOf(event.attacker, context.drivers);
  const defender = nameOf(event.defender, context.drivers);
  const circuit = context.circuit;
  const seed = hashSeed(event);

  switch (event.type) {
    case "start":
      return pick(
        [
          `LIGHTS OUT AND AWAY WE GO! The ${context.eventName} is UNDERWAY!`,
          `WE ARE RACING AT ${circuit.toUpperCase()}! Lights out, and the field erupts!`,
          `GO GO GO! ${circuit.toUpperCase()} comes alive — the ${context.eventName} is on!`,
        ],
        seed,
      );

    case "finish":
      return pick(
        [
          `${attacker} TAKES THE WIN AT ${circuit.toUpperCase()}! What a drive!`,
          `CHEQUERED FLAG! ${attacker} is victorious at ${circuit.toUpperCase()}!`,
          `${attacker} WINS IT! The ${context.eventName} belongs to ${attacker}!`,
        ],
        seed,
      );

    case "lead_change":
      return pick(
        [
          `LEAD CHANGE! ${attacker} takes control from ${defender} at ${circuit.toUpperCase()}!`,
          `${attacker} HITS THE FRONT! ${defender} has no answer — the crowd is up!`,
          `NEW LEADER! ${attacker} sweeps past ${defender}! This race just turned!`,
          `THE LEAD IS GONE! ${attacker} steals it from ${defender}!`,
        ],
        seed,
      );

    case "pit":
      return pick(
        [
          `PIT STOP FOR ${nameOf(event.driver, context.drivers)} — the crew goes to work!`,
          `${nameOf(event.driver, context.drivers)} BOXES! Fresh tyres, and now the charge begins!`,
          `${nameOf(event.driver, context.drivers)} INTO THE PITS! This could change everything!`,
          `PIT WINDOW! ${nameOf(event.driver, context.drivers)} rolls the dice at ${circuit.toUpperCase()}!`,
        ],
        seed,
      );

    default:
      return pick(
        [
          `${attacker} AROUND THE OUTSIDE! ${defender} is powerless at ${circuit.toUpperCase()}!`,
          `${attacker} DIVES DOWN THE INSIDE! ${defender} loses out!`,
          `THAT'S A MOVE! ${attacker} sweeps past ${defender} and away!`,
          `${attacker} IS THROUGH! ${defender} can only watch!`,
          `SENSATIONAL FROM ${attacker}! ${defender} has no answer!`,
          `${attacker} STRIKES! Late on the brakes, and ${defender} is beaten!`,
        ],
        seed,
      );
  }
}
