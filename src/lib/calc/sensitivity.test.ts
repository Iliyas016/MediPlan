import { describe, expect, it } from "vitest";
import { SERVICE_KEYS, type CostShare, type Plan, type ServiceKey } from "../domain/plan";
import { answered, assumed, type Household } from "../domain/profile";
import { REFERENCE_PRICES } from "../domain/reference-prices";
import { findDecisiveAssumptions } from "./sensitivity";

function plan(id: string, share: CostShare, yearlyPremium: number): Plan {
  return {
    id,
    employer: "A",
    name: id,
    planType: "PPO",
    hsaEligible: false,
    deductible: { individual: 0, family: 0, embedded: true },
    oopMax: { individual: 100000, family: 200000 },
    services: Object.fromEntries(SERVICE_KEYS.map((k) => [k, share])) as Record<ServiceKey, CostShare>,
    exclusions: [],
    pricing: {
      premiumPerPaycheck: { employee: yearlyPremium / 12, employee_spouse: null, employee_children: null, family: null },
      paychecksPerYear: 12,
      employerHsaPerYear: { individual: 0, family: 0 },
      spousalSurchargePerYear: 0,
    },
  };
}

// Pays nothing but costs nothing, versus pays everything for a premium.
const bare = plan("bare", { kind: "not_covered" }, 0);
const full = plan("full", { kind: "free" }, 3000);

const single = (care: Household["people"][number]["care"], savings = answered(1_000_000)): Household => ({
  people: [{ id: "alex", role: "adultA", label: "Alex", age: answered(30), care }],
  emergencySavings: savings,
  mustKeepProviders: answered([]),
  neededServices: answered([]),
});

describe("findDecisiveAssumptions", () => {
  it("flags assumed care whose real amount would change the pick", () => {
    // With the assumed surgery, "full" is cheaper; with no care at all, "bare" is.
    const household = single(
      assumed([{ service: "outpatientSurgery", timesPerYear: 1, recurring: false }], "Assumed one surgery."),
    );
    const decisive = findDecisiveAssumptions(household, [bare, full], REFERENCE_PRICES);
    expect(decisive.has("Alex.care")).toBe(true);
  });

  it("ignores care the family answered", () => {
    const household = single(answered([{ service: "outpatientSurgery", timesPerYear: 1, recurring: false }]));
    expect(findDecisiveAssumptions(household, [bare, full], REFERENCE_PRICES).size).toBe(0);
  });

  it("finds nothing decisive when only one option exists", () => {
    const household = single(
      assumed([{ service: "primaryCare", timesPerYear: 2, recurring: false }], "Assumed two visits."),
      { value: 0, status: "unknown", note: "Savings not given." },
    );
    expect(findDecisiveAssumptions(household, [full], REFERENCE_PRICES).size).toBe(0);
  });
});
