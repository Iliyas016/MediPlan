import type { Plan } from "../domain/plan";
import type { Household } from "../domain/profile";
import { listAssumptions } from "../domain/profile";
import type { PriceTable } from "../domain/reference-prices";
import { enumerateArrangements, type Arrangement } from "./combinations";
import { computePlanYear, type CareEvent } from "./cost";
import { emergencyEvents, plannedEvents, type ScenarioKey } from "./scenarios";

export interface ArrangementResult {
  arrangement: Arrangement;
  /** Net yearly cost of the whole family under each scenario. */
  costs: Record<ScenarioKey, number>;
  /** Premiums for the year: the part that is certain. */
  premiums: number;
  /** Ceiling for covered in-network care across all parts. */
  worstCase: number;
  /** Extra cash needed in a bad year compared with the expected one. */
  badYearShock: number;
  /** Who the worst emergency hits in the bad scenario. */
  badYearPersonId: string;
  /** false when the bad-year shock is larger than the family's savings. */
  shockAffordable: boolean;
  flags: string[];
}

export interface Recommendation {
  best: ArrangementResult;
  /** All valid arrangements, cheapest expected year first. */
  ranked: ArrangementResult[];
  /** Expected-year saving of `best` versus the most expensive valid arrangement. */
  savingsVsWorst: number;
  assumptions: { path: string; note: string }[];
}

interface ArrangementCost {
  total: number;
  premiums: number;
  worstCase: number;
}

/** Sum of all parts of an arrangement, or null if a part's tier is not offered. */
function costOf(
  arrangement: Arrangement,
  events: CareEvent[],
  bothEmployersOffered: boolean,
): ArrangementCost | null {
  let total = 0;
  let premiums = 0;
  let worstCase = 0;
  for (const part of arrangement.parts) {
    const year = computePlanYear({
      plan: part.plan,
      tier: part.tier,
      coveredIds: part.coveredIds,
      events,
      // A spouse joins the other spouse's plan although their own employer offers one.
      spouseHasOwnCoverage: arrangement.singleEmployer && bothEmployersOffered,
    });
    if (!year) return null;
    total += year.total;
    premiums += year.premiums + year.surcharge;
    worstCase += year.worstCase;
  }
  return { total, premiums, worstCase };
}

function exclusionFlags(arrangement: Arrangement, household: Household): string[] {
  const flags: string[] = [];
  for (const need of household.neededServices.value) {
    const needle = need.trim().toLowerCase();
    if (!needle) continue;
    for (const part of arrangement.parts) {
      if (part.plan.exclusions.some((x) => x.toLowerCase().includes(needle))) {
        flags.push(`${part.plan.name} excludes "${need}".`);
      }
    }
  }
  return flags;
}

/**
 * Rank every way to cover the household and pick one.
 *
 * Rule: cheapest expected year among arrangements whose bad-year shock the
 * family can absorb from savings. If none is affordable, the arrangement
 * with the cheapest bad year wins and carries a warning.
 */
export function recommend(household: Household, plans: Plan[], prices: PriceTable): Recommendation {
  const bothEmployersOffered =
    plans.some((p) => p.employer === "A") && plans.some((p) => p.employer === "B");

  const good = plannedEvents(household, "good", prices);
  const expected = plannedEvents(household, "expected", prices);
  const savings = household.emergencySavings;
  const results: ArrangementResult[] = [];

  for (const arrangement of enumerateArrangements(household, plans)) {
    const goodCost = costOf(arrangement, good, bothEmployersOffered);
    const expectedCost = costOf(arrangement, expected, bothEmployersOffered);
    if (!goodCost || !expectedCost) continue;

    // Bad year: the emergency lands on whoever makes it most expensive.
    let bad = -Infinity;
    let badPersonId = household.people[0].id;
    for (const person of household.people) {
      const cost = costOf(
        arrangement,
        [...emergencyEvents(person.id, prices), ...expected],
        bothEmployersOffered,
      );
      if (cost && cost.total > bad) {
        bad = cost.total;
        badPersonId = person.id;
      }
    }

    const shock = bad - expectedCost.total;
    const affordable = savings.status === "unknown" ? true : shock <= savings.value;
    const flags = exclusionFlags(arrangement, household);
    if (!affordable) {
      flags.push("A bad year would cost more than your emergency savings cover.");
    }
    if (arrangement.singleEmployer && bothEmployersOffered) {
      flags.push("Everyone depends on one job. If it ends, the whole family must switch plans.");
    }

    results.push({
      arrangement,
      costs: { good: goodCost.total, expected: expectedCost.total, bad },
      premiums: expectedCost.premiums,
      worstCase: expectedCost.worstCase,
      badYearShock: shock,
      badYearPersonId: badPersonId,
      shockAffordable: affordable,
      flags,
    });
  }

  if (results.length === 0) {
    throw new Error("No valid way to cover this household with the given plans.");
  }

  const ranked = [...results].sort((a, b) => a.costs.expected - b.costs.expected);
  const affordable = ranked.filter((r) => r.shockAffordable);
  const best =
    affordable[0] ?? [...ranked].sort((a, b) => a.costs.bad - b.costs.bad)[0];

  return {
    best,
    ranked,
    savingsVsWorst: ranked[ranked.length - 1].costs.expected - best.costs.expected,
    assumptions: listAssumptions(household),
  };
}

export { computePlanYear } from "./cost";
export { enumerateArrangements } from "./combinations";
export type { Arrangement } from "./combinations";
export type { ScenarioKey } from "./scenarios";
