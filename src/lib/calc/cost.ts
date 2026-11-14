import type { CoverageTier, Plan, ServiceKey } from "../domain/plan";

/** One billable thing that happens to one person during the plan year. */
export interface CareEvent {
  personId: string;
  service: ServiceKey;
  /** In-network allowed amount for this event. */
  allowed: number;
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

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Cost of one plan for one year, given who is on it and what care they use.
 * Returns null when the plan does not offer the requested tier.
 */
export function computePlanYear(input: PlanYearInput): PlanYearResult | null {
  const { plan, tier, coveredIds, events, spouseHasOwnCoverage } = input;
  const perPaycheck = plan.pricing.premiumPerPaycheck[tier];
  if (perPaycheck === null || perPaycheck === undefined) return null;

  const isFamily = tier !== "employee";
  const covered = new Set(coveredIds);

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

  for (const event of events) {
    if (!covered.has(event.personId)) continue;
    const share = plan.services[event.service];
    const allowed = event.allowed;

    if (share.kind === "not_covered") {
      notCovered += allowed;
      continue;
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
  }

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
  const oopCeiling = isFamily ? plan.oopMax.family : plan.oopMax.individual;

  return {
    premiums: round2(premiums),
    surcharge: round2(surcharge),
    outOfPocket: round2(familyOopPaid),
    notCovered: round2(notCovered),
    employerHsa: round2(employerHsa),
    total: round2(premiums + surcharge + familyOopPaid + notCovered - employerHsa),
    worstCase: round2(premiums + surcharge + oopCeiling - employerHsa),
  };
}
