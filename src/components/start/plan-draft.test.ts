import { describe, expect, it } from "vitest";
import { SERVICE_KEYS, type CostShare, type Plan, type ServiceKey } from "@/lib/domain/plan";
import {
  buildPlan,
  draftFromExtraction,
  draftFromPlan,
  emptyPlanDraft,
  parseAmount,
  withoutWarning,
} from "./plan-draft";

// Test-only plan. Real plans come from uploaded SBC files or the user's input.
const services = Object.fromEntries(
  SERVICE_KEYS.map((k) => [k, { kind: "coinsurance", rate: 0.2, afterDeductible: true }]),
) as Record<ServiceKey, CostShare>;
services.preventive = { kind: "free" };
services.primaryCare = { kind: "copay", amount: 25, afterDeductible: false };
services.specialtyDrug = { kind: "not_covered" };
services.imaging = { kind: "coinsurance", rate: 0.15, afterDeductible: true };

const plan: Plan = {
  id: "p1",
  employer: "B",
  name: "Silver HDHP",
  planType: "HDHP",
  hsaEligible: true,
  deductible: { individual: 2000, family: 4000, embedded: false },
  oopMax: { individual: 5000, family: 10000 },
  services,
  exclusions: ["Cosmetic surgery", "Acupuncture"],
  pricing: {
    premiumPerPaycheck: { employee: 40, employee_spouse: null, employee_children: 85.5, family: 120 },
    paychecksPerYear: 26,
    employerHsaPerYear: { individual: 500, family: 1000 },
    spousalSurchargePerYear: 0,
  },
};

describe("draftFromPlan + buildPlan", () => {
  it("round-trips a saved plan unchanged", () => {
    expect(buildPlan(draftFromPlan(plan))).toEqual({ ok: true, plan });
  });
});

describe("draftFromExtraction", () => {
  const extraction = {
    plan: { ...plan, deductible: { individual: 0, family: 4000, embedded: false } },
    warnings: ["deductible.individual", "services.imaging", "hsaEligible"] as const,
    missing: ["deductible.individual", "services.imaging"] as const,
  };

  it("leaves missing values empty, keeps uncertain ones, and keeps all warnings", () => {
    const draft = draftFromExtraction("p2", "A", "sbc.pdf", {
      ...extraction,
      warnings: [...extraction.warnings],
      missing: [...extraction.missing],
    });

    expect(draft.deductibleIndividual).toBe("");
    expect(draft.services.imaging.kind).toBe("");
    expect(draft.hsaEligible).toBe("yes");
    expect(draft.warnings).toEqual(["deductible.individual", "services.imaging", "hsaEligible"]);
    expect(draft.paychecksPerYear).toBe("");
  });

  it("will not build until missing values and premiums are filled in", () => {
    const draft = draftFromExtraction("p2", "A", "sbc.pdf", {
      ...extraction,
      warnings: [...extraction.warnings],
      missing: [...extraction.missing],
    });
    const result = buildPlan(draft);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ["deductible.individual", "paychecksPerYear", "premiums", "services.imaging"].sort(),
      );
    }
  });
});

describe("buildPlan", () => {
  it("asks for every answer on an empty manual entry", () => {
    const result = buildPlan(emptyPlanDraft("p3", "A"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.planType).toBeDefined();
      expect(result.errors["services.specialist"]).toBeDefined();
      expect(result.errors.premiums).toBe("Enter the premium for at least one coverage level.");
    }
  });

  it("ignores HSA money on a plan that is not HSA-eligible", () => {
    const draft = { ...draftFromPlan(plan), hsaEligible: "no" as const, planType: "PPO" as const };
    const result = buildPlan(draft);
    expect(result.ok && result.plan.pricing.employerHsaPerYear).toEqual({ individual: 0, family: 0 });
  });

  it("rejects a coinsurance above 100%", () => {
    const draft = draftFromPlan(plan);
    draft.services.imaging = { ...draft.services.imaging, percent: "120" };
    const result = buildPlan(draft);
    expect(!result.ok && result.errors["services.imaging"]).toBe("Enter a percentage from 0 to 100.");
  });
});

describe("parseAmount", () => {
  it("reads dollar formatting and rejects junk", () => {
    expect(parseAmount("$1,500")).toBe(1500);
    expect(parseAmount(" 42.5 ")).toBe(42.5);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("-5")).toBeNaN();
  });
});

describe("withoutWarning", () => {
  it("drops only the touched field", () => {
    const draft = { ...emptyPlanDraft("p4", "A"), warnings: ["name", "planType"] as ("name" | "planType")[] };
    expect(withoutWarning(draft, "name").warnings).toEqual(["planType"]);
  });
});
