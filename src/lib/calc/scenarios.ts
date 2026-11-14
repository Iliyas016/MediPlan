import type { ServiceKey } from "../domain/plan";
import type { Household } from "../domain/profile";
import type { PriceTable } from "../domain/reference-prices";
import type { CareEvent } from "./cost";

/**
 * good:     preventive care plus what happens every year (chronic meds etc.)
 * expected: everything the family told us to expect
 * bad:      expected plus one emergency (force majeure) hitting one person
 */
export type ScenarioKey = "good" | "expected" | "bad";

/**
 * The emergency we stress-test with: ambulance, ER, a hospital admission,
 * follow-up imaging and specialist visits. Nobody plans for it, which is the
 * reason insurance exists, so every recommendation is checked against it.
 */
export const EMERGENCY: { service: ServiceKey; times: number }[] = [
  { service: "ambulance", times: 1 },
  { service: "emergencyRoom", times: 1 },
  { service: "hospitalStay", times: 1 },
  { service: "imaging", times: 1 },
  { service: "specialist", times: 2 },
];

function repeat(personId: string, service: ServiceKey, times: number, prices: PriceTable): CareEvent[] {
  const count = Math.max(0, Math.round(times));
  return Array.from({ length: count }, () => ({
    personId,
    service,
    allowed: prices[service].allowed,
  }));
}

/** Planned care for the whole household under the good or expected scenario. */
export function plannedEvents(
  household: Household,
  scenario: "good" | "expected",
  prices: PriceTable,
): CareEvent[] {
  const events: CareEvent[] = [];
  for (const person of household.people) {
    events.push(...repeat(person.id, "preventive", 1, prices));
    for (const item of person.care.value) {
      if (scenario === "good" && !item.recurring) continue;
      events.push(...repeat(person.id, item.service, item.timesPerYear, prices));
    }
  }
  return events;
}

/** The emergency for one person. It comes first: it can happen in January. */
export function emergencyEvents(personId: string, prices: PriceTable): CareEvent[] {
  return EMERGENCY.flatMap((e) => repeat(personId, e.service, e.times, prices));
}
