import { zodTextFormat } from "openai/helpers/zod";
import { describe, expect, it } from "vitest";
import { ExtractedPlanSchema, SERVICE_KEYS, type ServiceKey } from "../domain/plan";
import { toExtractedPlan } from "./normalize";
import { ModelPlanSchema, type ModelPlan, type ModelService } from "./schema";

// Test-only model answer. Real answers come from uploaded SBC files.
const coinsurance20: ModelService = {
  asWritten: "20% coinsurance",
  kind: "coinsurance",
  copayAmount: null,
  coinsurancePercent: 20,
  afterDeductible: true,
  uncertain: false,
};

function modelAnswer(overrides: Partial<ModelPlan> = {}, services: Partial<Record<ServiceKey, ModelService>> = {}): ModelPlan {
  return {
    isSbc: true,
    name: "Gold PPO 500",
    planType: "PPO",
    hsaEligible: false,
    deductibleIndividual: 500,
    deductibleFamily: 1000,
    deductibleEmbedded: true,
    oopMaxIndividual: 4000,
    oopMaxFamily: 8000,
    services: Object.fromEntries(
      SERVICE_KEYS.map((key) => [key, services[key] ?? coinsurance20]),
    ) as Record<ServiceKey, ModelService>,
    exclusions: ["Cosmetic surgery", "  Long-term care "],
    uncertainFields: [],
    ...overrides,
  };
}

describe("toExtractedPlan", () => {
  it("maps a complete answer with no warnings and passes ExtractedPlanSchema", () => {
    const { plan, warnings } = toExtractedPlan(
      modelAnswer({}, {
        preventive: { ...coinsurance20, asWritten: "No charge", kind: "free", coinsurancePercent: null, afterDeductible: null },
        primaryCare: {
          asWritten: "$25 copay; deductible does not apply",
          kind: "copay",
          copayAmount: 25,
          coinsurancePercent: null,
          afterDeductible: false,
          uncertain: false,
        },
      }),
      "file",
    );

    expect(warnings).toEqual([]);
    expect(ExtractedPlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.services.preventive).toEqual({ kind: "free" });
    expect(plan.services.primaryCare).toEqual({ kind: "copay", amount: 25, afterDeductible: false });
    expect(plan.services.imaging).toEqual({ kind: "coinsurance", rate: 0.2, afterDeductible: true });
    expect(plan.exclusions).toEqual(["Cosmetic surgery", "Long-term care"]);
  });

  it("flags missing values and fills placeholders that still pass the schema", () => {
    const { plan, warnings } = toExtractedPlan(
      modelAnswer({ name: " ", planType: null, deductibleFamily: null, deductibleEmbedded: null }),
      "acme-sbc",
    );

    expect(plan.name).toBe("acme-sbc");
    expect(plan.planType).toBe("OTHER");
    expect(plan.deductible.family).toBe(0);
    expect(warnings).toEqual(["name", "planType", "deductible.family", "deductible.embedded"]);
    expect(ExtractedPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("flags uncertain, missing and incomplete services", () => {
    const { plan, warnings } = toExtractedPlan(
      modelAnswer({}, {
        emergencyRoom: { ...coinsurance20, asWritten: "$250 copay then 20% coinsurance", uncertain: true },
        ambulance: { ...coinsurance20, asWritten: "", kind: "not_found", coinsurancePercent: null },
        urgentCare: { ...coinsurance20, kind: "copay", copayAmount: null, coinsurancePercent: null },
      }),
      "file",
    );

    expect(warnings).toEqual(["services.urgentCare", "services.emergencyRoom", "services.ambulance"]);
    expect(plan.services.ambulance).toEqual({ kind: "not_covered" });
    expect(ExtractedPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("keeps fractions, rejects impossible percentages and negative amounts", () => {
    const { plan, warnings } = toExtractedPlan(
      modelAnswer({ oopMaxFamily: -5 }, {
        specialist: { ...coinsurance20, coinsurancePercent: 0.3 },
        imaging: { ...coinsurance20, coinsurancePercent: 140 },
      }),
      "file",
    );

    expect(plan.services.specialist).toEqual({ kind: "coinsurance", rate: 0.3, afterDeductible: true });
    expect(warnings).toEqual(["services.imaging", "oopMax.family"]);
    expect(plan.oopMax.family).toBe(0);
    expect(ExtractedPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("does not flag unknown deductible timing when the plan has no deductible", () => {
    const unknownTiming = { ...coinsurance20, afterDeductible: null };
    const zero = toExtractedPlan(
      modelAnswer({ deductibleIndividual: 0, deductibleFamily: 0 }, { specialist: unknownTiming }),
      "file",
    );
    const nonZero = toExtractedPlan(modelAnswer({}, { specialist: unknownTiming }), "file");

    expect(zero.warnings).toEqual([]);
    expect(nonZero.warnings).toEqual(["services.specialist"]);
  });

  it("keeps the model's own uncertain fields", () => {
    const { warnings } = toExtractedPlan(modelAnswer({ uncertainFields: ["hsaEligible"] }), "file");
    expect(warnings).toEqual(["hsaEligible"]);
  });
});

describe("ModelPlanSchema", () => {
  it("builds a strict JSON schema with every property required", () => {
    const format = zodTextFormat(ModelPlanSchema, "sbc_plan");
    const schema = format.schema as { required: string[]; properties: Record<string, unknown>; additionalProperties: boolean };

    expect(format.strict).toBe(true);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
  });
});
