import { z } from "zod";

/**
 * Service categories we price. They mirror the "Common Medical Event" rows of
 * the federal Summary of Benefits and Coverage (SBC) template, so every plan's
 * SBC can be mapped onto the same keys.
 */
export const SERVICE_KEYS = [
  "preventive",
  "primaryCare",
  "specialist",
  "diagnosticTest",
  "imaging",
  "genericDrug",
  "preferredBrandDrug",
  "nonPreferredDrug",
  "specialtyDrug",
  "urgentCare",
  "emergencyRoom",
  "ambulance",
  "hospitalStay",
  "outpatientSurgery",
  "mentalHealthVisit",
  "delivery",
  "physicalTherapy",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

/**
 * What the member pays for one service, in network.
 * - free: $0 (e.g. preventive care)
 * - copay: flat amount. afterDeductible=true means full price until the
 *   deductible is met, then the copay.
 * - coinsurance: member's share (0..1). afterDeductible=true means full price
 *   until the deductible is met, then the share.
 * - not_covered: member pays everything and it does not count toward limits.
 */
export const CostShareSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("free") }),
  z.object({
    kind: z.literal("copay"),
    amount: z.number().nonnegative(),
    afterDeductible: z.boolean(),
  }),
  z.object({
    kind: z.literal("coinsurance"),
    rate: z.number().min(0).max(1),
    afterDeductible: z.boolean(),
  }),
  z.object({ kind: z.literal("not_covered") }),
]);
export type CostShare = z.infer<typeof CostShareSchema>;

/** Everything we read out of the SBC PDF. This is the /api/extract contract. */
export const ExtractedPlanSchema = z.object({
  name: z.string().min(1),
  planType: z.enum(["HMO", "PPO", "EPO", "POS", "HDHP", "OTHER"]),
  hsaEligible: z.boolean(),
  deductible: z.object({
    individual: z.number().nonnegative(),
    family: z.number().nonnegative(),
    /** true: one person never pays more than the individual deductible on a family plan. */
    embedded: z.boolean(),
  }),
  oopMax: z.object({
    individual: z.number().nonnegative(),
    family: z.number().nonnegative(),
  }),
  services: z.record(z.enum(SERVICE_KEYS), CostShareSchema),
  /** "Excluded Services" section of the SBC, verbatim items. */
  exclusions: z.array(z.string()),
});
export type ExtractedPlan = z.infer<typeof ExtractedPlanSchema>;

export const COVERAGE_TIERS = [
  "employee",
  "employee_spouse",
  "employee_children",
  "family",
] as const;
export type CoverageTier = (typeof COVERAGE_TIERS)[number];

/** Not in the SBC. The user types these in from the enrollment guide. */
export const PlanPricingSchema = z.object({
  /** Employee's share per paycheck for each tier; null = tier not offered. */
  premiumPerPaycheck: z.record(z.enum(COVERAGE_TIERS), z.number().nonnegative().nullable()),
  paychecksPerYear: z.number().int().positive(),
  employerHsaPerYear: z.object({
    individual: z.number().nonnegative(),
    family: z.number().nonnegative(),
  }),
  /** Extra yearly charge if a spouse who has their own employer coverage is added. */
  spousalSurchargePerYear: z.number().nonnegative(),
});
export type PlanPricing = z.infer<typeof PlanPricingSchema>;

export const PlanSchema = ExtractedPlanSchema.extend({
  id: z.string().min(1),
  /** Whose employer offers it: adult A's or adult B's. */
  employer: z.enum(["A", "B"]),
  pricing: PlanPricingSchema,
});
export type Plan = z.infer<typeof PlanSchema>;
