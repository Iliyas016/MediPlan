import { describe, expect, it } from "vitest";
import { SERVICE_KEYS, type CostShare, type Plan, type ServiceKey } from "../domain/plan";
import { answered, assumed, type Household, type Person } from "../domain/profile";
import { REFERENCE_PRICES } from "../domain/reference-prices";
import { enumerateArrangements } from "./combinations";
import { computePlanYear, type CareEvent } from "./cost";
import { recommend } from "./index";

// Test-only plans. Real plans come from uploaded SBC files.
function makePlan(overrides: Partial<Plan> & { defaultShare: CostShare; shares?: Partial<Record<ServiceKey, CostShare>> }): Plan {
  const { defaultShare, shares, ...rest } = overrides;
  const services = Object.fromEntries(
    SERVICE_KEYS.map((key) => [key, shares?.[key] ?? defaultShare]),
  ) as Record<ServiceKey, CostShare>;
  services.preventive = shares?.preventive ?? { kind: "free" };
  return {
    id: "plan",
    employer: "A",
    name: "Plan",
    planType: "PPO",
    hsaEligible: false,
    deductible: { individual: 500, family: 1000, embedded: true },
    oopMax: { individual: 4000, family: 8000 },
    services,
    exclusions: [],
    pricing: {
      premiumPerPaycheck: { employee: 100, employee_spouse: 220, employee_children: 190, family: 300 },
      paychecksPerYear: 12,
      employerHsaPerYear: { individual: 0, family: 0 },
      spousalSurchargePerYear: 0,
    },
    ...rest,
  };
}

const lowDeductible = makePlan({
  id: "ppo",
  name: "PPO 500",
  defaultShare: { kind: "coinsurance", rate: 0.2, afterDeductible: true },
  shares: {
    primaryCare: { kind: "copay", amount: 25, afterDeductible: false },
    specialist: { kind: "copay", amount: 50, afterDeductible: false },
  },
  pricing: {
    premiumPerPaycheck: { employee: 250, employee_spouse: 520, employee_children: 450, family: 700 },
    paychecksPerYear: 12,
    employerHsaPerYear: { individual: 0, family: 0 },
    spousalSurchargePerYear: 0,
  },
});

const highDeductible = makePlan({
  id: "hdhp",
  name: "HDHP 3000",
  planType: "HDHP",
  hsaEligible: true,
  defaultShare: { kind: "coinsurance", rate: 0.2, afterDeductible: true },
  deductible: { individual: 3000, family: 6000, embedded: false },
  oopMax: { individual: 6000, family: 12000 },
  pricing: {
    premiumPerPaycheck: { employee: 100, employee_spouse: 210, employee_children: 180, family: 280 },
    paychecksPerYear: 12,
    employerHsaPerYear: { individual: 500, family: 1000 },
    spousalSurchargePerYear: 0,
  },
});

// The stomach-pain episode: GP, ultrasound, labs, neurologist.
const episode = (personId: string): CareEvent[] => [
  { personId, service: "primaryCare", allowed: 150 },
  { personId, service: "imaging", allowed: 400 },
  { personId, service: "diagnosticTest", allowed: 200 },
  { personId, service: "specialist", allowed: 300 },
];

describe("computePlanYear", () => {
  it("applies copays outside the deductible and coinsurance after it", () => {
    const year = computePlanYear({
      plan: lowDeductible,
      tier: "employee",
      coveredIds: ["a"],
      events: episode("a"),
      spouseHasOwnCoverage: false,
    })!;
    // 25 copay + 50 copay + 500 deductible + 20% of the remaining 100
    expect(year.outOfPocket).toBe(595);
    expect(year.premiums).toBe(3000);
    expect(year.total).toBe(3595);
  });

  it("charges full price below a high deductible and credits employer HSA money", () => {
    const year = computePlanYear({
      plan: highDeductible,
      tier: "employee",
      coveredIds: ["a"],
      events: episode("a"),
      spouseHasOwnCoverage: false,
    })!;
    expect(year.outOfPocket).toBe(1050);
    expect(year.total).toBe(1200 + 1050 - 500);
  });

  it("never charges more than the out-of-pocket maximum", () => {
    const year = computePlanYear({
      plan: lowDeductible,
      tier: "employee",
      coveredIds: ["a"],
      events: [{ personId: "a", service: "hospitalStay", allowed: 90000 }],
      spouseHasOwnCoverage: false,
    })!;
    expect(year.outOfPocket).toBe(4000);
    expect(year.worstCase).toBe(3000 + 4000);
  });

  it("caps one person at the individual deductible when it is embedded", () => {
    const year = computePlanYear({
      plan: lowDeductible,
      tier: "family",
      coveredIds: ["a", "b"],
      events: [
        { personId: "a", service: "imaging", allowed: 1000 },
        { personId: "b", service: "imaging", allowed: 1000 },
      ],
      spouseHasOwnCoverage: false,
    })!;
    // each: 500 deductible + 20% of 500
    expect(year.outOfPocket).toBe(1200);
  });

  it("makes one person fill the whole family deductible when it is not embedded", () => {
    const year = computePlanYear({
      plan: highDeductible,
      tier: "family",
      coveredIds: ["a", "b"],
      events: [{ personId: "a", service: "imaging", allowed: 5000 }],
      spouseHasOwnCoverage: false,
    })!;
    expect(year.outOfPocket).toBe(5000);
  });

  it("charges excluded services in full and outside the cap", () => {
    const plan = makePlan({
      defaultShare: { kind: "coinsurance", rate: 0.2, afterDeductible: true },
      shares: { physicalTherapy: { kind: "not_covered" } },
    });
    const year = computePlanYear({
      plan,
      tier: "employee",
      coveredIds: ["a"],
      events: [{ personId: "a", service: "physicalTherapy", allowed: 110 }],
      spouseHasOwnCoverage: false,
    })!;
    expect(year.notCovered).toBe(110);
    expect(year.outOfPocket).toBe(0);
  });

  it("returns null when the tier is not offered", () => {
    const plan = makePlan({
      defaultShare: { kind: "free" },
      pricing: {
        premiumPerPaycheck: { employee: 100, employee_spouse: null, employee_children: null, family: null },
        paychecksPerYear: 12,
        employerHsaPerYear: { individual: 0, family: 0 },
        spousalSurchargePerYear: 0,
      },
    });
    expect(
      computePlanYear({ plan, tier: "family", coveredIds: ["a", "b"], events: [], spouseHasOwnCoverage: false }),
    ).toBeNull();
  });
});

const person = (id: string, role: Person["role"], care: Person["care"]["value"] = []): Person => ({
  id,
  role,
  label: id,
  age: answered(35),
  care: answered(care),
});

const couple = (savings = answered(20000)): Household => ({
  people: [
    person("Alex", "adultA"),
    person("Sam", "adultB", [{ service: "specialist", timesPerYear: 4, recurring: true }]),
    person("Kid", "child", [{ service: "urgentCare", timesPerYear: 2, recurring: false }]),
  ],
  emergencySavings: savings,
  mustKeepProviders: answered([]),
  neededServices: answered([]),
});

describe("enumerateArrangements", () => {
  it("lists one option per plan for a single employer", () => {
    expect(enumerateArrangements(couple(), [lowDeductible, highDeductible])).toHaveLength(2);
  });

  it("covers every split for two employers with children", () => {
    const planB = { ...highDeductible, id: "b-hdhp", employer: "B" as const, name: "B HDHP" };
    const all = enumerateArrangements(couple(), [lowDeductible, highDeductible, planB]);
    // 2 all-on-A + 1 all-on-B + 2 A-plans x 1 B-plan x 2 sides for the children
    expect(all).toHaveLength(7);
    for (const arrangement of all) {
      const covered = arrangement.parts.flatMap((p) => p.coveredIds).sort();
      expect(covered).toEqual(["Alex", "Kid", "Sam"]);
    }
  });
});

describe("recommend", () => {
  const planB = { ...highDeductible, id: "b-hdhp", employer: "B" as const, name: "B HDHP" };
  const plans = [lowDeductible, highDeductible, planB];

  it("ranks by expected cost and keeps scenarios ordered", () => {
    const rec = recommend(couple(), plans, REFERENCE_PRICES);
    expect(rec.ranked).toHaveLength(7);
    for (const r of rec.ranked) {
      expect(r.costs.good).toBeLessThanOrEqual(r.costs.expected);
      expect(r.costs.expected).toBeLessThanOrEqual(r.costs.bad);
      expect(r.costs.bad).toBeLessThanOrEqual(r.worstCase);
    }
    expect(rec.best.arrangement.id).toBe(rec.ranked[0].arrangement.id);
    expect(rec.savingsVsWorst).toBeGreaterThan(0);
  });

  it("never recommends an option that costs more in every scenario", () => {
    const tight = recommend(couple(answered(500)), plans, REFERENCE_PRICES);
    for (const other of tight.ranked) {
      const worseEverywhere =
        other.costs.good < tight.best.costs.good &&
        other.costs.expected < tight.best.costs.expected &&
        other.costs.bad < tight.best.costs.bad;
      expect(worseEverywhere, `${other.arrangement.label} beats the pick in every year`).toBe(false);
    }
  });

  it("trades a cheaper expected year for a smaller emergency the family can afford", () => {
    // Dearer plan with a low out-of-pocket max: worse in a normal year, better in a bad one.
    const protective = { ...lowDeductible, id: "ppo-low-max", oopMax: { individual: 3000, family: 6000 } };
    const single = (savings: number): Household => ({
      ...couple(answered(savings)),
      people: [person("Alex", "adultA", [{ service: "specialist", timesPerYear: 2, recurring: true }])],
    });
    const rich = recommend(single(100000), [protective, highDeductible], REFERENCE_PRICES);
    const tight = recommend(single(4000), [protective, highDeductible], REFERENCE_PRICES);

    expect(rich.best.arrangement.id).toBe("all:hdhp");
    expect(tight.best.arrangement.id).toBe("all:ppo-low-max");
    expect(tight.best.badYearShock).toBeLessThanOrEqual(4000);
    expect(tight.best.costs.bad).toBeLessThan(rich.best.costs.bad);
  });

  it("warns when even the safest sensible option exceeds the savings", () => {
    const tight = recommend(couple(answered(500)), plans, REFERENCE_PRICES);
    expect(tight.best.shockAffordable).toBe(false);
    expect(tight.best.flags).toContainEqual(
      expect.stringMatching(/^A bad year adds \$[\d,]+ to the expected cost, more than your \$500 in savings\.$/),
    );
  });

  it("reports unanswered fields as assumptions", () => {
    const rec = recommend(couple(assumed(0, "Savings not provided.")), plans, REFERENCE_PRICES);
    expect(rec.assumptions.map((a) => a.path)).toContain("emergencySavings");
  });

  it("flags a plan that excludes a needed service", () => {
    const household = { ...couple(), neededServices: answered(["infertility"]) };
    const excluding = { ...lowDeductible, exclusions: ["Infertility treatment"] };
    const rec = recommend(household, [excluding], REFERENCE_PRICES);
    expect(rec.best.flags.join(" ")).toContain("PPO 500 does not cover: Infertility treatment.");
  });
});
