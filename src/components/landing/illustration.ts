/*
 * The landing page's illustrative example, labelled as such on screen.
 * A family of four makes four doctor visits a year at $150 each; the slider
 * adds one hospital bill on top.
 *   Plan A: $250 a month, visits and hospital count toward a $6,000
 *           deductible, then the family pays 20%.
 *   Plan B: $510 a month, $30 copay per visit, hospital counts toward a
 *           $1,000 deductible, then the family pays 20%.
 */
export interface IllustrativePlan {
  name: string;
  detail: string;
  monthlyPremium: number;
  deductible: number;
  /** Fixed fee per doctor visit; null when visits count toward the deductible. */
  visitCopay: number | null;
}

export interface YearCost {
  premiums: number;
  care: number;
  total: number;
}

const VISITS = 4;
const VISIT_PRICE = 150;
const COINSURANCE = 0.2;

export const MAX_HOSPITAL_BILL = 30_000;
export const BAD_YEAR_BILL = 14_000;

export const ILLUSTRATIVE_PLANS: [IllustrativePlan, IllustrativePlan] = [
  { name: "Plan A", detail: "$250 a month, $6,000 deductible", monthlyPremium: 250, deductible: 6000, visitCopay: null },
  { name: "Plan B", detail: "$510 a month, $1,000 deductible", monthlyPremium: 510, deductible: 1000, visitCopay: 30 },
];

const afterDeductible = (charges: number, deductible: number) =>
  Math.min(charges, deductible) + COINSURANCE * Math.max(charges - deductible, 0);

export function yearCost(plan: IllustrativePlan, hospitalBill: number): YearCost {
  const premiums = plan.monthlyPremium * 12;
  const care =
    plan.visitCopay === null
      ? afterDeductible(VISITS * VISIT_PRICE + hospitalBill, plan.deductible)
      : VISITS * plan.visitCopay + afterDeductible(hospitalBill, plan.deductible);
  return { premiums, care, total: premiums + care };
}

/** Smallest hospital bill, to the nearest $100, at which Plan B stops costing more than Plan A. */
export function breakEvenBill([a, b]: [IllustrativePlan, IllustrativePlan]): number | null {
  for (let bill = 0; bill <= MAX_HOSPITAL_BILL; bill += 100) {
    if (yearCost(b, bill).total <= yearCost(a, bill).total) return bill;
  }
  return null;
}
