import type { CoverageTier, Plan } from "../domain/plan";
import type { Household } from "../domain/profile";

export interface ArrangementPart {
  plan: Plan;
  tier: CoverageTier;
  coveredIds: string[];
}

/** One way to cover the whole family: one plan for everyone, or one per adult. */
export interface Arrangement {
  id: string;
  label: string;
  parts: ArrangementPart[];
  /** true when the family relies on a single employer for everyone's coverage. */
  singleEmployer: boolean;
}

function tierFor(withSpouse: boolean, withChildren: boolean): CoverageTier {
  if (withSpouse && withChildren) return "family";
  if (withSpouse) return "employee_spouse";
  if (withChildren) return "employee_children";
  return "employee";
}

/**
 * Every valid way to cover the household with the uploaded plans.
 *
 * One employer:  each plan, everyone on it.
 * Two employers: everyone on one of A's plans, everyone on one of B's plans,
 *                or each adult on their own employer's plan with the children
 *                on either side.
 */
export function enumerateArrangements(household: Household, plans: Plan[]): Arrangement[] {
  const adultA = household.people.find((p) => p.role === "adultA");
  if (!adultA) throw new Error("Household needs an adultA.");
  const adultB = household.people.find((p) => p.role === "adultB");
  const childIds = household.people.filter((p) => p.role === "child").map((p) => p.id);
  const hasChildren = childIds.length > 0;

  const plansA = plans.filter((p) => p.employer === "A");
  const plansB = plans.filter((p) => p.employer === "B");
  const out: Arrangement[] = [];

  for (const plan of plansA) {
    out.push({
      id: `all:${plan.id}`,
      label: `Everyone on ${plan.name}`,
      singleEmployer: true,
      parts: [
        {
          plan,
          tier: tierFor(Boolean(adultB), hasChildren),
          coveredIds: [adultA.id, ...(adultB ? [adultB.id] : []), ...childIds],
        },
      ],
    });
  }

  if (!adultB) return out;

  for (const plan of plansB) {
    out.push({
      id: `all:${plan.id}`,
      label: `Everyone on ${plan.name}`,
      singleEmployer: true,
      parts: [
        {
          plan,
          tier: tierFor(true, hasChildren),
          coveredIds: [adultB.id, adultA.id, ...childIds],
        },
      ],
    });
  }

  for (const planA of plansA) {
    for (const planB of plansB) {
      const kidsSides: ("A" | "B" | null)[] = hasChildren ? ["A", "B"] : [null];
      for (const kidsOn of kidsSides) {
        const suffix =
          kidsOn === null ? "" : `, children with ${kidsOn === "A" ? adultA.label : adultB.label}`;
        out.push({
          id: `split:${planA.id}+${planB.id}:${kidsOn ?? "none"}`,
          label: `${adultA.label} on ${planA.name}, ${adultB.label} on ${planB.name}${suffix}`,
          singleEmployer: false,
          parts: [
            {
              plan: planA,
              tier: tierFor(false, kidsOn === "A"),
              coveredIds: [adultA.id, ...(kidsOn === "A" ? childIds : [])],
            },
            {
              plan: planB,
              tier: tierFor(false, kidsOn === "B"),
              coveredIds: [adultB.id, ...(kidsOn === "B" ? childIds : [])],
            },
          ],
        });
      }
    }
  }

  return out;
}
