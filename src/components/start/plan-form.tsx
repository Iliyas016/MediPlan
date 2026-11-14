"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { COVERAGE_TIERS, SERVICE_KEYS, type CoverageTier, type ServiceKey } from "@/lib/domain/plan";
import type { WarningPath } from "@/lib/extract/schema";
import { SERVICE_LABELS } from "@/lib/format";
import { AmountField, FieldNote, inputClass, SelectField, TextField, type FieldState } from "./fields";
import {
  parseAmount,
  sampleLabel,
  withoutWarning,
  type Employer,
  type FieldPath,
  type PlanDraft,
  type PlanType,
  type ServiceDraft,
  type YesNo,
} from "./plan-draft";

export const EMPLOYER_LABELS: Record<Employer, string> = {
  A: "Your employer",
  B: "Your spouse's or partner's employer",
};

const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: "PPO", label: "PPO" },
  { value: "HMO", label: "HMO" },
  { value: "EPO", label: "EPO" },
  { value: "POS", label: "POS" },
  { value: "HDHP", label: "High-deductible (HDHP)" },
  { value: "OTHER", label: "Other" },
];

const YES_NO: { value: Exclude<YesNo, "">; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const KIND_OPTIONS: { value: Exclude<ServiceDraft["kind"], "">; label: string }[] = [
  { value: "free", label: "No charge" },
  { value: "copay", label: "Copay ($)" },
  { value: "coinsurance", label: "Coinsurance (%)" },
  { value: "not_covered", label: "Not covered" },
];

const PAYCHECK_OPTIONS = [
  { value: "52", label: "52 (weekly)" },
  { value: "26", label: "26 (every two weeks)" },
  { value: "24", label: "24 (twice a month)" },
  { value: "12", label: "12 (monthly)" },
];

const SHORT_TIER_LABELS: Record<CoverageTier, string> = {
  employee: "You only",
  employee_spouse: "You + spouse",
  employee_children: "You + kids",
  family: "Family",
};

/** Fields shown together in the always-visible premiums row, not in the check list. */
const PRICING_PATHS: FieldPath[] = ["premiums", "paychecksPerYear"];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "1500" -> "$1,500", "48.54" -> "$48.54"; empty or invalid -> "—". */
const money = (input: string): string => {
  const value = parseAmount(input);
  return value === null || Number.isNaN(value) ? "—" : usd.format(value);
};

/** One service as a short phrase, e.g. "$25 copay" or "20% after deductible". */
function shareText(service: ServiceDraft): string {
  switch (service.kind) {
    case "free":
      return "No charge";
    case "not_covered":
      return "Not covered";
    case "copay":
      return `${money(service.amount)} copay${service.afterDeductible ? " after deductible" : ""}`;
    case "coinsurance":
      return `${service.percent || "—"}%${service.afterDeductible ? " after deductible" : ""}`;
    default:
      return "—";
  }
}

const SUMMARY_SERVICES: ServiceKey[] = ["primaryCare", "specialist", "emergencyRoom"];

const yesNoText = (value: YesNo) => (value === "yes" ? "Yes" : value === "no" ? "No" : "—");

/** Label and current value of one field, for the short "check these" list. */
function describe(draft: PlanDraft, path: FieldPath): { label: string; value: string } {
  switch (path) {
    case "name":
      return { label: "Plan name", value: draft.name.trim() || "—" };
    case "planType":
      return { label: "Plan type", value: draft.planType || "—" };
    case "hsaEligible":
      return { label: "HSA-eligible", value: yesNoText(draft.hsaEligible) };
    case "deductible.individual":
      return { label: "Deductible, one person", value: money(draft.deductibleIndividual) };
    case "deductible.family":
      return { label: "Deductible, family", value: money(draft.deductibleFamily) };
    case "deductible.embedded":
      return { label: "Each person meets only their own deductible", value: yesNoText(draft.embedded) };
    case "oopMax.individual":
      return { label: "Out-of-pocket limit, one person", value: money(draft.oopIndividual) };
    case "oopMax.family":
      return { label: "Out-of-pocket limit, family", value: money(draft.oopFamily) };
    case "exclusions":
      return { label: "Services not covered", value: `${draft.exclusions.split("\n").filter((l) => l.trim()).length} listed` };
    case "hsaIndividual":
      return { label: "Employer HSA money, one person", value: money(draft.hsaIndividual) };
    case "hsaFamily":
      return { label: "Employer HSA money, family", value: money(draft.hsaFamily) };
    case "surcharge":
      return { label: "Spousal surcharge", value: money(draft.surcharge) };
    case "premiums":
      return { label: "Premiums", value: "—" };
    case "paychecksPerYear":
      return { label: "Paychecks per year", value: draft.paychecksPerYear || "—" };
    default: {
      const key = path.slice("services.".length) as ServiceKey;
      return { label: SERVICE_LABELS[key], value: shareText(draft.services[key]) };
    }
  }
}

/**
 * One plan on /start. Shows the few numbers that decide the result, the values
 * the reader was unsure of, and the premiums, which no SBC contains. Every
 * other field sits behind "Edit all details".
 */
export function PlanForm({
  draft,
  errors,
  onChange,
  onRemove,
}: {
  draft: PlanDraft;
  /** Shown only after the user tried to continue. */
  errors: Partial<Record<FieldPath, string>> | null;
  onChange: (draft: PlanDraft) => void;
  onRemove: () => void;
}) {
  // A plan typed by hand has nothing to summarise yet, so its form starts open.
  const [showAll, setShowAll] = useState(!draft.source);
  const [openChecks, setOpenChecks] = useState<FieldPath[]>([]);
  const [editPricing, setEditPricing] = useState(false);
  const detailsId = useId();

  const state = (path: FieldPath): FieldState => ({
    warn: (draft.warnings as FieldPath[]).includes(path),
    error: errors?.[path],
  });
  const set = (path: WarningPath | null, patch: Partial<PlanDraft>) => {
    const next = { ...draft, ...patch };
    onChange(path ? withoutWarning(next, path) : next);
  };
  const setService = (key: ServiceKey, patch: Partial<ServiceDraft>) =>
    set(`services.${key}`, { services: { ...draft.services, [key]: { ...draft.services[key], ...patch } } });

  const sample = sampleLabel(draft.source);
  const toCheck: FieldPath[] = [
    ...(draft.warnings as FieldPath[]),
    ...((Object.keys(errors ?? {}) as FieldPath[]).filter(
      (path) => !PRICING_PATHS.includes(path) && !(draft.warnings as FieldPath[]).includes(path),
    )),
  ];

  const pricingErrors = Boolean(errors?.premiums || errors?.paychecksPerYear);
  const pricingFilled =
    draft.paychecksPerYear !== "" && COVERAGE_TIERS.some((tier) => draft.premiums[tier].trim() !== "");
  const showPricingInputs = editPricing || pricingErrors || !pricingFilled;
  const toggleCheck = (path: FieldPath) =>
    setOpenChecks((open) => (open.includes(path) ? open.filter((p) => p !== path) : [...open, path]));

  /** The input for one field, wherever it is shown. */
  const editor = (path: FieldPath) => {
    switch (path) {
      case "name":
        return <TextField label="Plan name" value={draft.name} onChange={(v) => set("name", { name: v })} state={state("name")} />;
      case "planType":
        return (
          <SelectField label="Plan type" value={draft.planType} options={PLAN_TYPES} onChange={(v) => set("planType", { planType: v })} state={state("planType")} />
        );
      case "hsaEligible":
        return (
          <SelectField
            label="Can it be paired with an HSA?"
            hint="The SBC says so if the plan is HSA-eligible."
            value={draft.hsaEligible}
            options={YES_NO}
            onChange={(v) => set("hsaEligible", { hsaEligible: v })}
            state={state("hsaEligible")}
          />
        );
      case "deductible.individual":
        return <AmountField label="Deductible, one person" value={draft.deductibleIndividual} onChange={(v) => set(path, { deductibleIndividual: v })} state={state(path)} />;
      case "deductible.family":
        return <AmountField label="Deductible, family" value={draft.deductibleFamily} onChange={(v) => set(path, { deductibleFamily: v })} state={state(path)} />;
      case "oopMax.individual":
        return <AmountField label="Out-of-pocket limit, one person" value={draft.oopIndividual} onChange={(v) => set(path, { oopIndividual: v })} state={state(path)} />;
      case "oopMax.family":
        return <AmountField label="Out-of-pocket limit, family" value={draft.oopFamily} onChange={(v) => set(path, { oopFamily: v })} state={state(path)} />;
      case "deductible.embedded":
        return (
          <SelectField
            label="On a family plan, does each person only have to meet their own deductible?"
            hint="Often worded as “each family member meets their own individual deductible”."
            value={draft.embedded}
            options={YES_NO}
            onChange={(v) => set(path, { embedded: v })}
            state={state(path)}
          />
        );
      case "exclusions":
        return <ExclusionsField value={draft.exclusions} onChange={(v) => set("exclusions", { exclusions: v })} state={state("exclusions")} />;
      case "hsaIndividual":
        return <AmountField label="Employer HSA money, one person" hint="Per year. Leave empty if none." value={draft.hsaIndividual} onChange={(v) => set(null, { hsaIndividual: v })} state={state(path)} />;
      case "hsaFamily":
        return <AmountField label="Employer HSA money, family" hint="Per year. Leave empty if none." value={draft.hsaFamily} onChange={(v) => set(null, { hsaFamily: v })} state={state(path)} />;
      case "surcharge":
        return (
          <AmountField
            label="Spousal surcharge"
            hint="Extra yearly charge to cover a spouse who could get their own employer's plan. Leave empty if none."
            value={draft.surcharge}
            onChange={(v) => set(null, { surcharge: v })}
            state={state(path)}
          />
        );
      case "premiums":
      case "paychecksPerYear":
        return null;
      default: {
        const key = path.slice("services.".length) as ServiceKey;
        return (
          <ul>
            <ServiceRow label={SERVICE_LABELS[key]} service={draft.services[key]} state={state(path)} onChange={(patch) => setService(key, patch)} />
          </ul>
        );
      }
    }
  };

  return (
    <article className="space-y-6 rounded-xl border border-rule bg-surface px-4 py-5 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-bold break-words">{draft.name.trim() || "New plan"}</h3>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-faint">
            {sample ? (
              <>
                <span className="rounded-full bg-highlight px-2 py-0.5 text-xs font-semibold tracking-wide text-on-highlight uppercase">
                  Sample
                </span>
                <span>Real plan from {sample}</span>
              </>
            ) : (
              <span className="break-all">{draft.source ? `Read from ${draft.source}` : "Entered by hand"}</span>
            )}
          </p>
        </div>
        <button type="button" onClick={onRemove} className="shrink-0 cursor-pointer text-sm text-ink-faint underline underline-offset-4 hover:text-risk">
          Remove
        </button>
      </header>

      {draft.source && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <SummaryItem label="Deductible" value={`${money(draft.deductibleIndividual)} / ${money(draft.deductibleFamily)}`} hint="you / family" />
          <SummaryItem label="Out-of-pocket limit" value={`${money(draft.oopIndividual)} / ${money(draft.oopFamily)}`} hint="you / family" />
          <SummaryItem label="Plan type" value={`${draft.planType || "—"}${draft.hsaEligible === "yes" ? " · HSA" : ""}`} />
          {SUMMARY_SERVICES.map((key) => (
            <SummaryItem key={key} label={SERVICE_LABELS[key]} value={shareText(draft.services[key])} />
          ))}
        </dl>
      )}

      {/* A plan typed by hand shows its errors in the open form below instead. */}
      {draft.source && toCheck.length > 0 && (
        <section className="space-y-4 rounded-lg border border-risk/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-bold text-risk">
              {errors && Object.keys(errors).length > 0 ? "Fix" : "Check"} {toCheck.length}{" "}
              {toCheck.length === 1 ? "value" : "values"} against the PDF
            </h4>
            {draft.warnings.length > 0 && (
              <Button type="button" variant="secondary" className="min-h-9 px-4 py-1.5 text-sm" onClick={() => set(null, { warnings: [] })}>
                These look right
              </Button>
            )}
          </div>
          <ul className="divide-y divide-rule">
            {toCheck.map((path) => {
              const { label, value } = describe(draft, path);
              const open = openChecks.includes(path) || Boolean(errors?.[path]);
              return (
                <li key={path} className="space-y-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0 text-sm">
                      {label}: <b className="tabular-nums">{value}</b>
                    </span>
                    {!errors?.[path] && (
                      <button
                        type="button"
                        onClick={() => toggleCheck(path)}
                        aria-expanded={open}
                        className="shrink-0 cursor-pointer text-sm font-medium underline underline-offset-4"
                      >
                        {open ? "Done" : "Edit"}
                      </button>
                    )}
                  </div>
                  {open && editor(path)}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {showPricingInputs ? (
        <fieldset className="space-y-3" data-field-error={errors?.premiums || errors?.paychecksPerYear ? "true" : undefined}>
          <legend className="font-bold">Your premium per paycheck</legend>
          <p className="text-sm text-ink-faint">
            {sample ? "From the employer’s published rates." : "Not in the plan summary: copy it from your enrollment guide. Leave a level empty if it isn’t offered."}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {COVERAGE_TIERS.map((tier) => (
              <AmountField
                key={tier}
                label={SHORT_TIER_LABELS[tier]}
                value={draft.premiums[tier]}
                onChange={(v) => set(null, { premiums: { ...draft.premiums, [tier]: v } })}
              />
            ))}
          </div>
          <FieldNote state={{ error: errors?.premiums }} />
          <SelectField
            label="Paychecks per year"
            value={draft.paychecksPerYear}
            options={PAYCHECK_OPTIONS}
            onChange={(v) => set(null, { paychecksPerYear: v })}
            state={state("paychecksPerYear")}
          />
        </fieldset>
      ) : (
        <div className="flex items-baseline justify-between gap-4">
          <p className="min-w-0 text-sm">
            <span className="font-bold">Premium per paycheck: </span>
            {COVERAGE_TIERS.filter((tier) => draft.premiums[tier].trim() !== "")
              .map((tier) => `${SHORT_TIER_LABELS[tier]} ${money(draft.premiums[tier])}`)
              .join(" · ")}
            {` · ${draft.paychecksPerYear} paychecks a year`}
          </p>
          <button type="button" onClick={() => setEditPricing(true)} className="shrink-0 cursor-pointer text-sm font-medium underline underline-offset-4">
            Edit
          </button>
        </div>
      )}

      <div className="space-y-6">
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls={detailsId}
          onClick={() => setShowAll((open) => !open)}
          className="cursor-pointer text-sm font-medium underline underline-offset-4"
        >
          {showAll ? "Hide details" : "Edit all details"}
        </button>
        {showAll && (
          <div id={detailsId} className="space-y-8 border-t border-rule pt-6">
            <section className="space-y-4">
              <h4 className="font-bold">The plan</h4>
              {editor("name")}
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Whose employer offers it?"
                  value={draft.employer}
                  options={[
                    { value: "A", label: EMPLOYER_LABELS.A },
                    { value: "B", label: EMPLOYER_LABELS.B },
                  ]}
                  onChange={(v) => set(null, { employer: v })}
                />
                {editor("planType")}
                {editor("hsaEligible")}
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="font-bold">Deductible and out-of-pocket limit</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {editor("deductible.individual")}
                {editor("deductible.family")}
                {editor("oopMax.individual")}
                {editor("oopMax.family")}
              </div>
              {editor("deductible.embedded")}
            </section>
            <section className="space-y-3">
              <div className="space-y-1">
                <h4 className="font-bold">What you pay for care</h4>
                <p className="text-sm text-ink-faint">The in-network column of the plan summary.</p>
              </div>
              <ul className="divide-y divide-rule">
                {SERVICE_KEYS.map((key) => (
                  <ServiceRow
                    key={key}
                    label={SERVICE_LABELS[key]}
                    service={draft.services[key]}
                    state={state(`services.${key}`)}
                    onChange={(patch) => setService(key, patch)}
                  />
                ))}
              </ul>
            </section>
            {editor("exclusions")}
            <section className="space-y-4">
              <h4 className="font-bold">Extras</h4>
              {draft.hsaEligible === "yes" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {editor("hsaIndividual")}
                  {editor("hsaFamily")}
                </div>
              )}
              {editor("surcharge")}
            </section>
          </div>
        )}
      </div>
    </article>
  );
}

function SummaryItem({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-faint">
        {label}
        {hint && <span className="sr-only"> ({hint})</span>}
      </dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ServiceRow({
  label,
  service,
  state,
  onChange,
}: {
  label: string;
  service: ServiceDraft;
  state: FieldState;
  onChange: (patch: Partial<ServiceDraft>) => void;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const describedBy = state.error || state.warn ? noteId : undefined;
  const needsTiming = service.kind === "copay" || service.kind === "coinsurance";
  return (
    <li
      className={`grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_19rem] sm:items-start sm:gap-4 ${
        state.warn ? "-mx-2 rounded-lg bg-risk-wash px-2" : ""
      }`}
      data-field-error={state.error ? "true" : undefined}
    >
      <label htmlFor={id} className="pt-2 text-sm font-medium">
        {label}
      </label>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            id={id}
            value={service.kind}
            aria-describedby={describedBy}
            aria-invalid={state.error ? true : undefined}
            onChange={(e) => onChange({ kind: e.target.value as ServiceDraft["kind"] })}
            className={`${inputClass} w-44`}
          >
            <option value="" disabled>
              Choose…
            </option>
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {service.kind === "copay" && (
            <span className="flex items-center gap-2">
              <span className="text-ink-faint">$</span>
              <input
                type="text"
                inputMode="decimal"
                aria-label={`${label} copay in dollars`}
                value={service.amount}
                onChange={(e) => onChange({ amount: e.target.value })}
                className={`${inputClass} w-24`}
              />
            </span>
          )}
          {service.kind === "coinsurance" && (
            <span className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                aria-label={`${label} coinsurance in percent`}
                value={service.percent}
                onChange={(e) => onChange({ percent: e.target.value })}
                className={`${inputClass} w-20`}
              />
              <span className="text-ink-faint">%</span>
            </span>
          )}
        </div>
        {needsTiming && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={service.afterDeductible}
              onChange={(e) => onChange({ afterDeductible: e.target.checked })}
              className="size-4 accent-[var(--ink)]"
            />
            Only after the deductible is met
          </label>
        )}
        <FieldNote id={noteId} state={state} />
      </div>
    </li>
  );
}

function ExclusionsField({
  value,
  onChange,
  state,
}: {
  value: string;
  onChange: (value: string) => void;
  state: FieldState;
}) {
  const id = useId();
  return (
    <div className={`space-y-1 ${state.warn ? "-mx-2 rounded-lg bg-risk-wash px-2 py-2" : ""}`}>
      <label htmlFor={id} className="block font-bold">
        Services the plan does not cover
      </label>
      <p className="text-sm text-ink-faint">One per line, from “Services Your Plan Generally Does NOT Cover”.</p>
      <textarea
        id={id}
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} w-full`}
      />
      <FieldNote state={state} />
    </div>
  );
}
