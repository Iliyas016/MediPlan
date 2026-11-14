import type { Plan } from "../domain/plan";
import type { CareItem, Household, Person } from "../domain/profile";
import { answered } from "../domain/profile";
import type { PriceTable } from "../domain/reference-prices";
import { recommend } from "./index";

/** Assumption paths, as listed by listAssumptions, whose answer could flip the pick. */
export type DecisivePaths = Set<string>;

function pickId(household: Household, plans: Plan[], prices: PriceTable): string | null {
  try {
    return recommend(household, plans, prices).best.arrangement.id;
  } catch {
    return null;
  }
}

function withPerson(household: Household, person: Person): Household {
  return { ...household, people: household.people.map((p) => (p.id === person.id ? person : p)) };
}

/**
 * What an unanswered care question could hide at the top end: three times the
 * assumed care plus an ongoing condition, a monthly specialist visit and a
 * monthly brand-name prescription.
 */
const HEAVY_EXTRA: CareItem[] = [
  { service: "specialist", timesPerYear: 12, recurring: true, label: "Monthly specialist (heavy case)" },
  { service: "preferredBrandDrug", timesPerYear: 12, recurring: true, label: "Monthly brand drug (heavy case)" },
];

/**
 * Re-runs the recommendation with each assumed answer pushed to its extremes:
 * a person's care at none and at a heavy case, and savings at zero and
 * unlimited. An assumption is decisive when either extreme picks a different
 * arrangement, which is exactly when asking the family is worth it.
 */
export function findDecisiveAssumptions(household: Household, plans: Plan[], prices: PriceTable): DecisivePaths {
  const decisive: DecisivePaths = new Set();
  const base = pickId(household, plans, prices);
  if (base === null) return decisive;

  for (const person of household.people) {
    if (person.care.status === "answered") continue;
    const none = withPerson(household, { ...person, care: answered([]) });
    const heavy = withPerson(household, {
      ...person,
      care: answered([
        ...person.care.value.map((item) => ({ ...item, timesPerYear: item.timesPerYear * 3 })),
        ...HEAVY_EXTRA,
      ]),
    });
    if (pickId(none, plans, prices) !== base || pickId(heavy, plans, prices) !== base) {
      decisive.add(`${person.label}.care`);
    }
  }

  if (household.emergencySavings.status !== "answered") {
    const broke = { ...household, emergencySavings: answered(0) };
    const rich = { ...household, emergencySavings: answered(Number.MAX_SAFE_INTEGER) };
    if (pickId(broke, plans, prices) !== base || pickId(rich, plans, prices) !== base) {
      decisive.add("emergencySavings");
    }
  }

  return decisive;
}
