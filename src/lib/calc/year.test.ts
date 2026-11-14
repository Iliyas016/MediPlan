import { describe, expect, it } from "vitest";
import { SERVICE_KEYS, type CostShare, type Plan, type ServiceKey } from "../domain/plan";
import type { LedgerEntry } from "../store/session";
import type { Arrangement } from "./combinations";
import { estimateVisit, trackYear } from "./year";

function plan(id: string, overrides: Partial<Plan> = {}): Plan {
  const services = Object.fromEntries(
    SERVICE_KEYS.map((key) => [key, { kind: "coinsurance", rate: 0.2, afterDeductible: true }]),
  ) as Record<ServiceKey, CostShare>;
  services.primaryCare = { kind: "copay", amount: 25, afterDeductible: false };
  services.physicalTherapy = { kind: "not_covered" };
  return {
    id,
    employer: "A",
    name: id,
    planType: "PPO",
    hsaEligible: false,
    deductible: { individual: 1000, family: 2000, embedded: true },
    oopMax: { individual: 4000, family: 8000 },
    services,
    exclusions: [],
    pricing: {
      premiumPerPaycheck: { employee: 100, employee_spouse: 200, employee_children: 180, family: 300 },
      paychecksPerYear: 12,
      employerHsaPerYear: { individual: 0, family: 0 },
      spousalSurchargePerYear: 0,
    },
    ...overrides,
  };
}

const split: Arrangement = {
  id: "split",
  label: "split",
  singleEmployer: false,
  parts: [
    { plan: plan("Plan A"), tier: "employee_children", coveredIds: ["alex", "kid"] },
    { plan: plan("Plan B", { employer: "B" }), tier: "employee", coveredIds: ["sam"] },
  ],
};

let n = 0;
const bill = (
  personId: string,
  service: ServiceKey,
  allowed: number,
  date: string,
  billed: number | null = null,
): LedgerEntry => ({ id: `e${++n}`, date, personId, service, allowed, billed });

describe("trackYear", () => {
  it("charges each bill to the plan that covers the person", () => {
    const status = trackYear(split, [
      bill("alex", "imaging", 600, "2027-02-01"),
      bill("sam", "imaging", 600, "2027-02-02"),
    ]);
    expect(status.entries.map((e) => [e.planName, e.shouldOwe])).toEqual([
      ["Plan A", 600],
      ["Plan B", 600],
    ]);
    expect(status.plans[0].deductible).toEqual({ paid: 600, limit: 2000 });
    expect(status.plans[1].deductible).toEqual({ paid: 600, limit: 1000 });
  });

  it("replays bills in date order, whatever order they were logged in", () => {
    const status = trackYear(split, [
      bill("sam", "imaging", 500, "2027-05-01"),
      bill("sam", "imaging", 900, "2027-03-01"),
    ]);
    // March fills 900 of the 1,000 deductible; May pays the last 100 then 20% of 400.
    expect(status.entries.map((e) => [e.entry.date, e.shouldOwe])).toEqual([
      ["2027-03-01", 900],
      ["2027-05-01", 180],
    ]);
  });

  it("flags a bill that asks for more than the plan's share", () => {
    const status = trackYear(split, [
      bill("alex", "primaryCare", 150, "2027-01-10", 150),
      bill("alex", "primaryCare", 150, "2027-02-10", 25),
    ]);
    expect(status.entries[0].overbilled).toBe(125);
    expect(status.entries[1].overbilled).toBe(0);
  });

  it("keeps excluded services outside the deductible", () => {
    const status = trackYear(split, [bill("kid", "physicalTherapy", 110, "2027-04-01")]);
    expect(status.entries[0]).toMatchObject({ shouldOwe: 110, notCovered: true });
    expect(status.plans[0].deductible.paid).toBe(0);
  });

  it("marks a person nobody in the arrangement covers", () => {
    const status = trackYear(split, [bill("stranger", "primaryCare", 150, "2027-01-01")]);
    expect(status.entries[0]).toMatchObject({ planName: null, shouldOwe: 150 });
  });
});

describe("estimateVisit", () => {
  it("prices the next visit after the deductible already met", () => {
    const ledger = [bill("sam", "hospitalStay", 5000, "2027-06-01")];
    const before = estimateVisit(split, [], "sam", "imaging", 900);
    const after = estimateVisit(split, ledger, "sam", "imaging", 900);
    expect(before).toEqual({ planName: "Plan B", pay: 900, notCovered: false });
    expect(after?.pay).toBe(180);
  });

  it("returns null for someone not on any plan", () => {
    expect(estimateVisit(split, [], "stranger", "imaging", 900)).toBeNull();
  });
});
