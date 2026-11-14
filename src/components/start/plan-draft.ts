import {
  COVERAGE_TIERS,
  PlanSchema,
  SERVICE_KEYS,
  type CostShare,
  type CoverageTier,
  type ExtractedPlan,
  type Plan,
  type ServiceKey,
} from "@/lib/domain/plan";
import type { WarningPath } from "@/lib/extract/schema";

export type Employer = Plan["employer"];
export type PlanType = ExtractedPlan["planType"];
export type YesNo = "" | "yes" | "no";

/** One service row as typed on the review screen. Empty kind = not answered yet. */
export interface ServiceDraft {
  kind: "" | CostShare["kind"];
  amount: string;
  percent: string;
  afterDeductible: boolean;
}

/**
 * One plan as the review form holds it: every input is a string, so a value
 * the document did not contain stays visibly empty instead of becoming 0.
 */
export interface PlanDraft {
  id: string;
  employer: Employer;
  /** Uploaded file name, or null for a plan entered by hand. */
  source: string | null;
  name: string;
  planType: "" | PlanType;
  hsaEligible: YesNo;
  deductibleIndividual: string;
  deductibleFamily: string;
  embedded: YesNo;
  oopIndividual: string;
  oopFamily: string;
  services: Record<ServiceKey, ServiceDraft>;
  /** One excluded service per line. */
  exclusions: string;
  premiums: Record<CoverageTier, string>;
  paychecksPerYear: string;
  hsaIndividual: string;
  hsaFamily: string;
  surcharge: string;
  /** Fields still highlighted for the user to check. */
  warnings: WarningPath[];
}

/** `source` of a plan read from one of the built-in sample SBCs. */
export const SAMPLE_SOURCE_PREFIX = "sample SBC: ";

/** The sample's label, or null for a user's own upload or manual entry. */
export const sampleLabel = (source: string | null): string | null =>
  source?.startsWith(SAMPLE_SOURCE_PREFIX) ? source.slice(SAMPLE_SOURCE_PREFIX.length) : null;

export type FieldPath =
  | WarningPath
  | "premiums"
  | "paychecksPerYear"
  | "hsaIndividual"
  | "hsaFamily"
  | "surcharge";

const blankService = (): ServiceDraft => ({
  kind: "",
  amount: "",
  percent: "",
  afterDeductible: true,
});

const blankPricing = () => ({
  premiums: Object.fromEntries(COVERAGE_TIERS.map((t) => [t, ""])) as Record<CoverageTier, string>,
  paychecksPerYear: "",
  hsaIndividual: "",
  hsaFamily: "",
  surcharge: "",
});

export function emptyPlanDraft(id: string, employer: Employer): PlanDraft {
  return {
    id,
    employer,
    source: null,
    name: "",
    planType: "",
    hsaEligible: "",
    deductibleIndividual: "",
    deductibleFamily: "",
    embedded: "",
    oopIndividual: "",
    oopFamily: "",
    services: Object.fromEntries(SERVICE_KEYS.map((k) => [k, blankService()])) as Record<
      ServiceKey,
      ServiceDraft
    >,
    exclusions: "",
    ...blankPricing(),
    warnings: [],
  };
}

const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");
const text = (value: number): string => String(value);
/** 0.2 -> "20", without floating-point noise such as "20.000000000000004". */
const percentText = (rate: number): string => String(Math.round(rate * 10000) / 100);

function serviceDraft(share: CostShare): ServiceDraft {
  switch (share.kind) {
    case "free":
    case "not_covered":
      return { ...blankService(), kind: share.kind };
    case "copay":
      return { ...blankService(), kind: "copay", amount: text(share.amount), afterDeductible: share.afterDeductible };
    case "coinsurance":
      return {
        ...blankService(),
        kind: "coinsurance",
        percent: percentText(share.rate),
        afterDeductible: share.afterDeductible,
      };
  }
}

function sbcFields(plan: ExtractedPlan) {
  return {
    name: plan.name,
    planType: plan.planType,
    hsaEligible: yesNo(plan.hsaEligible),
    deductibleIndividual: text(plan.deductible.individual),
    deductibleFamily: text(plan.deductible.family),
    embedded: yesNo(plan.deductible.embedded),
    oopIndividual: text(plan.oopMax.individual),
    oopFamily: text(plan.oopMax.family),
    services: Object.fromEntries(
      SERVICE_KEYS.map((k) => [k, serviceDraft(plan.services[k])]),
    ) as Record<ServiceKey, ServiceDraft>,
    exclusions: plan.exclusions.join("\n"),
  };
}

/** A plan read from an SBC. Fields in `missing` are left empty for the user to fill in. */
export function draftFromExtraction(
  id: string,
  employer: Employer,
  source: string,
  extraction: { plan: ExtractedPlan; warnings: WarningPath[]; missing: WarningPath[] },
): PlanDraft {
  const draft: PlanDraft = {
    ...emptyPlanDraft(id, employer),
    ...sbcFields(extraction.plan),
    source,
    warnings: extraction.warnings,
  };
  for (const path of extraction.missing) clearValue(draft, path);
  return draft;
}

/** A plan already saved in the session, back into the form. */
export function draftFromPlan(plan: Plan): PlanDraft {
  const { pricing } = plan;
  return {
    ...emptyPlanDraft(plan.id, plan.employer),
    ...sbcFields(plan),
    premiums: Object.fromEntries(
      COVERAGE_TIERS.map((t) => [t, pricing.premiumPerPaycheck[t] === null ? "" : text(pricing.premiumPerPaycheck[t])]),
    ) as Record<CoverageTier, string>,
    paychecksPerYear: text(pricing.paychecksPerYear),
    hsaIndividual: pricing.employerHsaPerYear.individual ? text(pricing.employerHsaPerYear.individual) : "",
    hsaFamily: pricing.employerHsaPerYear.family ? text(pricing.employerHsaPerYear.family) : "",
    surcharge: pricing.spousalSurchargePerYear ? text(pricing.spousalSurchargePerYear) : "",
  };
}

function clearValue(draft: PlanDraft, path: WarningPath): void {
  switch (path) {
    case "name":
      // The API falls back to the file name, which is a fine starting point.
      return;
    case "planType":
      draft.planType = "";
      return;
    case "hsaEligible":
      draft.hsaEligible = "";
      return;
    case "deductible.individual":
      draft.deductibleIndividual = "";
      return;
    case "deductible.family":
      draft.deductibleFamily = "";
      return;
    case "deductible.embedded":
      draft.embedded = "";
      return;
    case "oopMax.individual":
      draft.oopIndividual = "";
      return;
    case "oopMax.family":
      draft.oopFamily = "";
      return;
    case "exclusions":
      return;
    default: {
      const key = path.slice("services.".length) as ServiceKey;
      draft.services[key] = blankService();
    }
  }
}

/** The user touched a highlighted field: it no longer needs a second look. */
export function withoutWarning(draft: PlanDraft, path: WarningPath): PlanDraft {
  return draft.warnings.includes(path)
    ? { ...draft, warnings: draft.warnings.filter((w) => w !== path) }
    : draft;
}

/** "$1,500" -> 1500. Empty -> null. Anything else that is not a number >= 0 -> NaN. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
}

export type BuildResult =
  | { ok: true; plan: Plan }
  | { ok: false; errors: Partial<Record<FieldPath, string>> };

const ENTER_AMOUNT = "Enter an amount in dollars.";
const CHOOSE = "Choose one.";

/** Turns the form into a Plan, or says which fields still need an answer. */
export function buildPlan(draft: PlanDraft): BuildResult {
  const errors: Partial<Record<FieldPath, string>> = {};

  const required = (path: FieldPath, input: string): number => {
    const value = parseAmount(input);
    if (value === null || Number.isNaN(value)) {
      errors[path] = ENTER_AMOUNT;
      return 0;
    }
    return value;
  };
  const optional = (path: FieldPath, input: string): number => {
    const value = parseAmount(input);
    if (Number.isNaN(value)) {
      errors[path] = ENTER_AMOUNT;
      return 0;
    }
    return value ?? 0;
  };
  const choice = <T extends string>(path: FieldPath, value: T | ""): T | null => {
    if (value === "") errors[path] = CHOOSE;
    return value === "" ? null : value;
  };

  const name = draft.name.trim();
  if (!name) errors.name = "Enter the plan's name.";
  const planType = choice("planType", draft.planType);
  const hsaEligible = choice("hsaEligible", draft.hsaEligible) === "yes";
  const embedded = choice("deductible.embedded", draft.embedded) === "yes";

  const services = {} as Record<ServiceKey, CostShare>;
  for (const key of SERVICE_KEYS) {
    const share = buildShare(draft.services[key]);
    if (typeof share === "string") {
      errors[`services.${key}`] = share;
      services[key] = { kind: "not_covered" };
    } else {
      services[key] = share;
    }
  }

  const premiumPerPaycheck = {} as Record<CoverageTier, number | null>;
  for (const tier of COVERAGE_TIERS) {
    const value = parseAmount(draft.premiums[tier]);
    if (Number.isNaN(value)) errors.premiums = "Premiums must be amounts in dollars.";
    premiumPerPaycheck[tier] = value === null || Number.isNaN(value) ? null : value;
  }
  if (!errors.premiums && COVERAGE_TIERS.every((t) => premiumPerPaycheck[t] === null)) {
    errors.premiums = "Enter the premium for at least one coverage level.";
  }

  const paychecks = Number(draft.paychecksPerYear);
  if (!Number.isInteger(paychecks) || paychecks <= 0) errors.paychecksPerYear = CHOOSE;

  const plan: Plan = {
    id: draft.id,
    employer: draft.employer,
    name,
    planType: planType ?? "OTHER",
    hsaEligible,
    deductible: {
      individual: required("deductible.individual", draft.deductibleIndividual),
      family: required("deductible.family", draft.deductibleFamily),
      embedded,
    },
    oopMax: {
      individual: required("oopMax.individual", draft.oopIndividual),
      family: required("oopMax.family", draft.oopFamily),
    },
    services,
    exclusions: draft.exclusions
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    pricing: {
      premiumPerPaycheck,
      paychecksPerYear: paychecks,
      employerHsaPerYear: {
        individual: hsaEligible ? optional("hsaIndividual", draft.hsaIndividual) : 0,
        family: hsaEligible ? optional("hsaFamily", draft.hsaFamily) : 0,
      },
      spousalSurchargePerYear: optional("surcharge", draft.surcharge),
    },
  };

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const checked = PlanSchema.safeParse(plan);
  if (!checked.success) return { ok: false, errors: { name: "Some values are not valid. Check the numbers." } };
  return { ok: true, plan: checked.data };
}

function buildShare(service: ServiceDraft): CostShare | string {
  switch (service.kind) {
    case "":
      return CHOOSE;
    case "free":
    case "not_covered":
      return { kind: service.kind };
    case "copay": {
      const amount = parseAmount(service.amount);
      if (amount === null || Number.isNaN(amount)) return ENTER_AMOUNT;
      return { kind: "copay", amount, afterDeductible: service.afterDeductible };
    }
    case "coinsurance": {
      const percent = parseAmount(service.percent.replace("%", ""));
      if (percent === null || Number.isNaN(percent) || percent > 100) return "Enter a percentage from 0 to 100.";
      return { kind: "coinsurance", rate: percent / 100, afterDeductible: service.afterDeductible };
    }
  }
}
