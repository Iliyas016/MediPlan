import { z } from "zod";
import { SERVICE_KEYS, type ServiceKey } from "../domain/plan";

/**
 * The shape the model fills in. It is deliberately flatter and looser than
 * ExtractedPlanSchema: every value can be null ("not in the document"), each
 * service keeps the cell text it was read from, and the model flags what it is
 * unsure about. normalize.ts turns this into an ExtractedPlan plus warnings.
 *
 * OpenAI strict structured outputs require every field to be present, so
 * "missing" is always an explicit null, never an absent key.
 */
const amount = z.number().nullable();

export const ModelServiceSchema = z.object({
  /** The in-network cell, copied as printed, e.g. "$30 copay; deductible does not apply". */
  asWritten: z.string(),
  kind: z.enum(["free", "copay", "coinsurance", "not_covered", "not_found"]),
  copayAmount: amount,
  /** As printed: 20 for "20% coinsurance". */
  coinsurancePercent: amount,
  afterDeductible: z.boolean().nullable(),
  uncertain: z.boolean(),
});
export type ModelService = z.infer<typeof ModelServiceSchema>;

export const TOP_LEVEL_PATHS = [
  "name",
  "planType",
  "hsaEligible",
  "deductible.individual",
  "deductible.family",
  "deductible.embedded",
  "oopMax.individual",
  "oopMax.family",
  "exclusions",
] as const;

/** A field of ExtractedPlan the review screen should highlight. */
export type WarningPath = (typeof TOP_LEVEL_PATHS)[number] | `services.${ServiceKey}`;

const servicesShape = Object.fromEntries(
  SERVICE_KEYS.map((key) => [key, ModelServiceSchema]),
) as Record<ServiceKey, typeof ModelServiceSchema>;

export const ModelPlanSchema = z.object({
  isSbc: z.boolean(),
  name: z.string().nullable(),
  planType: z.enum(["HMO", "PPO", "EPO", "POS", "HDHP", "OTHER"]).nullable(),
  hsaEligible: z.boolean().nullable(),
  deductibleIndividual: amount,
  deductibleFamily: amount,
  deductibleEmbedded: z.boolean().nullable(),
  oopMaxIndividual: amount,
  oopMaxFamily: amount,
  services: z.object(servicesShape),
  exclusions: z.array(z.string()),
  uncertainFields: z.array(z.enum(TOP_LEVEL_PATHS)),
});
export type ModelPlan = z.infer<typeof ModelPlanSchema>;
