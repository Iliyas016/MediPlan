import { SERVICE_KEYS, type CostShare, type ExtractedPlan, type ServiceKey } from "../domain/plan";
import type { ModelPlan, ModelService, WarningPath } from "./schema";

/**
 * Maps the model's answer onto ExtractedPlan. No cost math happens here: the
 * only conversions are "20%" -> 0.2 and filling a placeholder where the
 * document had no value. Every placeholder and every value the model was unsure
 * about is listed in `warnings`, so the user confirms it on the review screen.
 */
export function toExtractedPlan(
  raw: ModelPlan,
  fallbackName: string,
): { plan: ExtractedPlan; warnings: WarningPath[] } {
  const warnings = new Set<WarningPath>(raw.uncertainFields);

  const pick = <T>(path: WarningPath, value: T | null, placeholder: T): T => {
    if (value === null) {
      warnings.add(path);
      return placeholder;
    }
    return value;
  };
  const money = (path: WarningPath, value: number | null): number => {
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      warnings.add(path);
      return 0;
    }
    return pick(path, value, 0);
  };

  const name = raw.name?.trim() ? raw.name.trim() : null;
  // With no deductible, "before or after the deductible" changes nothing.
  const noDeductible = raw.deductibleIndividual === 0 && raw.deductibleFamily === 0;
  const services = {} as Record<ServiceKey, CostShare>;
  for (const key of SERVICE_KEYS) {
    const { share, sure } = toCostShare(raw.services[key], noDeductible);
    services[key] = share;
    if (!sure) warnings.add(`services.${key}`);
  }

  const plan: ExtractedPlan = {
    name: pick("name", name, fallbackName),
    planType: pick("planType", raw.planType, "OTHER"),
    hsaEligible: pick("hsaEligible", raw.hsaEligible, false),
    deductible: {
      individual: money("deductible.individual", raw.deductibleIndividual),
      family: money("deductible.family", raw.deductibleFamily),
      embedded: pick("deductible.embedded", raw.deductibleEmbedded, false),
    },
    oopMax: {
      individual: money("oopMax.individual", raw.oopMaxIndividual),
      family: money("oopMax.family", raw.oopMaxFamily),
    },
    services,
    exclusions: raw.exclusions.map((item) => item.trim()).filter(Boolean),
  };

  return { plan, warnings: [...warnings] };
}

function toCostShare(
  service: ModelService,
  noDeductible: boolean,
): { share: CostShare; sure: boolean } {
  const sure = !service.uncertain;
  const timingKnown = noDeductible || service.afterDeductible !== null;
  switch (service.kind) {
    case "free":
      return { share: { kind: "free" }, sure };
    case "not_covered":
      return { share: { kind: "not_covered" }, sure };
    case "not_found":
      return { share: { kind: "not_covered" }, sure: false };
    case "copay": {
      const amount = service.copayAmount;
      const valid = amount !== null && Number.isFinite(amount) && amount >= 0;
      return {
        share: {
          kind: "copay",
          amount: valid ? amount : 0,
          afterDeductible: service.afterDeductible ?? false,
        },
        sure: sure && valid && timingKnown,
      };
    }
    case "coinsurance": {
      const rate = toRate(service.coinsurancePercent);
      return {
        share: {
          kind: "coinsurance",
          rate: rate ?? 0,
          afterDeductible: service.afterDeductible ?? true,
        },
        sure: sure && rate !== null && timingKnown,
      };
    }
  }
}

/** "20" (percent, as printed) -> 0.2. A value already written as a fraction is kept. */
function toRate(percent: number | null): number | null {
  if (percent === null || !Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  return percent > 1 ? percent / 100 : percent;
}
