import type { CoverageTier, Plan, ServiceKey } from "../domain/plan";

/** One billable thing that happens to one person during the plan year. */
export interface CareEvent {
  personId: string;
  service: ServiceKey;
  /** In-network allowed amount for this event. */
  allowed: number;
}

/** What the member owes for one event under the plan. */
export interface Charge {
  /** Member's share: deductible, copay or coinsurance, or the full price if excluded. */
  pay: number;
  /** Part of `pay` that counted toward the deductible. */
  towardDeductible: number;
  /** The plan does not cover this service: paid in full, outside every limit. */
  notCovered: boolean;
}

export interface Progress {
  paid: number;
  limit: number;
}

/**
 * Runs a plan's cost sharing event by event, in date order, and remembers how
 * much of each deductible and out-of-pocket limit has been used. The yearly
 * forecast and the bill tracker both go through this one implementation.
 */
export interface PlanYearTracker {
  charge(event: CareEvent): Charge;
  /** Family-level progress (or the person's own on single coverage). */
  deductible(): Progress;
  outOfPocket(): Progress;
  personDeductiblePaid(personId: string): number;
  personOutOfPocketPaid(personId: string): number;
  notCoveredTotal(): number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function createPlanYearTracker(plan: Plan, tier: CoverageTier): PlanYearTracker {
  const isFamily = tier !== "employee";
  const dedPaid = new Map<string, number>();
  const oopPaid = new Map<string, number>();
  let familyDedPaid = 0;
  let familyOopPaid = 0;
  let notCovered = 0;

  const deductibleLeft = (personId: string): number => {
    const own = plan.deductible.individual - (dedPaid.get(personId) ?? 0);
    if (!isFamily) return Math.max(0, own);
    const family = plan.deductible.family - familyDedPaid;
    return Math.max(0, plan.deductible.embedded ? Math.min(own, family) : family);
  };

  const oopLeft = (personId: string): number => {
    const own = plan.oopMax.individual - (oopPaid.get(personId) ?? 0);
    if (!isFamily) return Math.max(0, own);
    return Math.max(0, Math.min(own, plan.oopMax.family - familyOopPaid));
  };

  return {
    charge(event) {
      const share = plan.services[event.service];
      const allowed = event.allowed;

      if (share.kind === "not_covered") {
        notCovered += allowed;
        return { pay: round2(allowed), towardDeductible: 0, notCovered: true };
      }

      let towardDeductible = 0;
      let pay = 0;

      if (share.kind === "copay") {
        if (share.afterDeductible) {
          towardDeductible = Math.min(allowed, deductibleLeft(event.personId));
          const rest = allowed - towardDeductible;
          pay = towardDeductible + (rest > 0 ? Math.min(share.amount, rest) : 0);
        } else {
          pay = Math.min(share.amount, allowed);
        }
      } else if (share.kind === "coinsurance") {
        if (share.afterDeductible) {
          towardDeductible = Math.min(allowed, deductibleLeft(event.personId));
          pay = towardDeductible + share.rate * (allowed - towardDeductible);
        } else {
          pay = share.rate * allowed;
        }
      }

      pay = Math.min(pay, oopLeft(event.personId));
      towardDeductible = Math.min(towardDeductible, pay);

      dedPaid.set(event.personId, (dedPaid.get(event.personId) ?? 0) + towardDeductible);
      oopPaid.set(event.personId, (oopPaid.get(event.personId) ?? 0) + pay);
      familyDedPaid += towardDeductible;
      familyOopPaid += pay;

      return { pay: round2(pay), towardDeductible: round2(towardDeductible), notCovered: false };
    },
    deductible: () => ({
      paid: round2(familyDedPaid),
      limit: isFamily ? plan.deductible.family : plan.deductible.individual,
    }),
    outOfPocket: () => ({
      paid: round2(familyOopPaid),
      limit: isFamily ? plan.oopMax.family : plan.oopMax.individual,
    }),
    personDeductiblePaid: (id) => round2(dedPaid.get(id) ?? 0),
    personOutOfPocketPaid: (id) => round2(oopPaid.get(id) ?? 0),
    notCoveredTotal: () => round2(notCovered),
  };
}

export interface PlanYearInput {
  plan: Plan;
  tier: CoverageTier;
  /** People on this plan. Events for anyone else are ignored. */
  coveredIds: string[];
  events: CareEvent[];
  /** Adds the plan's spousal surcharge (spouse has their own employer coverage). */
  spouseHasOwnCoverage: boolean;
}

export interface PlanYearResult {
  premiums: number;
  surcharge: number;
  /** Deductible, copays and coinsurance, capped by the out-of-pocket maximum. */
  outOfPocket: number;
  /** Excluded services: paid in full, never capped. */
  notCovered: number;
  /** Employer money put into the HSA; reduces the net cost. */
  employerHsa: number;
  /** premiums + surcharge + outOfPocket + notCovered - employerHsa */
  total: number;
  /** Theoretical ceiling for covered in-network care: premiums + OOP max. */
  worstCase: number;
}

/**
 * Cost of one plan for one year, given who is on it and what care they use.
 * Returns null when the plan does not offer the requested tier.
 */
export function computePlanYear(input: PlanYearInput): PlanYearResult | null {
  const { plan, tier, coveredIds, events, spouseHasOwnCoverage } = input;
  const perPaycheck = plan.pricing.premiumPerPaycheck[tier];
  if (perPaycheck === null || perPaycheck === undefined) return null;

  const covered = new Set(coveredIds);
  const tracker = createPlanYearTracker(plan, tier);
  for (const event of events) {
    if (covered.has(event.personId)) tracker.charge(event);
  }

  const isFamily = tier !== "employee";
  const premiums = perPaycheck * plan.pricing.paychecksPerYear;
  const surcharge =
    spouseHasOwnCoverage && (tier === "employee_spouse" || tier === "family")
      ? plan.pricing.spousalSurchargePerYear
      : 0;
  const employerHsa = plan.hsaEligible
    ? isFamily
      ? plan.pricing.employerHsaPerYear.family
      : plan.pricing.employerHsaPerYear.individual
    : 0;
  const outOfPocket = tracker.outOfPocket();
  const notCovered = tracker.notCoveredTotal();

  return {
    premiums: round2(premiums),
    surcharge: round2(surcharge),
    outOfPocket: outOfPocket.paid,
    notCovered,
    employerHsa: round2(employerHsa),
    total: round2(premiums + surcharge + outOfPocket.paid + notCovered - employerHsa),
    worstCase: round2(premiums + surcharge + outOfPocket.limit - employerHsa),
  };
}
