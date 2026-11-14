"use client";

import { useId } from "react";
import { COVERAGE_TIERS, SERVICE_KEYS, type CoverageTier, type ServiceKey } from "@/lib/domain/plan";
import type { WarningPath } from "@/lib/extract/schema";
import { SERVICE_LABELS } from "@/lib/format";
import { AmountField, FieldNote, inputClass, SelectField, TextField, type FieldState } from "./fields";
import {
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

const TIER_LABELS: Record<CoverageTier, string> = {
  employee: "Employee only",
  employee_spouse: "Employee + spouse",
  employee_children: "Employee + children",
  family: "Employee + family",
};

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

  const toCheck = draft.warnings.length;
  const sample = sampleLabel(draft.source);
  const errorCount = errors ? Object.keys(errors).length : 0;

  return (
    // Samples start folded so the page stays short on a phone; the summary
    // already says what they are and how many fields to check.
    <details open={!sample} className="group rounded-xl border border-rule bg-surface">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <span className="min-w-0 space-y-1">
          <span className="block text-lg font-bold break-words">{draft.name.trim() || "New plan"}</span>
          <span className="flex flex-wrap items-center gap-2 text-sm text-ink-faint">
            {sample ? (
              <>
                <span className="rounded-full bg-highlight px-2 py-0.5 text-xs font-semibold tracking-wide text-on-highlight uppercase">
                  Sample
                </span>
                <span>Real plan document from {sample}, read live. Premiums from the employer’s rate table.</span>
              </>
            ) : (
              <span className="break-all">{draft.source ? `Read from ${draft.source}` : "Entered by hand"}</span>
            )}
          </span>
          {errorCount > 0 ? (
            <span className="block text-sm font-medium text-risk">
              {errorCount} {errorCount === 1 ? "answer" : "answers"} missing
            </span>
          ) : toCheck > 0 ? (
            <span className="block text-sm text-risk">
              {toCheck} {toCheck === 1 ? "field" : "fields"} to check
            </span>
          ) : null}
        </span>
        <span aria-hidden className="pt-1 text-xl leading-none text-ink-faint transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="space-y-8 border-t border-rule px-4 py-5 sm:px-5">
        {draft.source && toCheck > 0 && (
          <p className="rounded-lg bg-risk-wash px-3 py-2 text-sm">
            Highlighted fields were missing from the document or hard to read. Check them against
            the PDF; the highlight goes away once you edit a field.
          </p>
        )}

        <section className="space-y-4">
          <h3 className="font-bold">The plan</h3>
          <TextField label="Plan name" value={draft.name} onChange={(v) => set("name", { name: v })} state={state("name")} />
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
            <SelectField
              label="Plan type"
              value={draft.planType}
              options={PLAN_TYPES}
              onChange={(v) => set("planType", { planType: v })}
              state={state("planType")}
            />
            <SelectField
              label="Can it be paired with an HSA?"
              hint="The SBC says so if the plan is HSA-eligible."
              value={draft.hsaEligible}
              options={YES_NO}
              onChange={(v) => set("hsaEligible", { hsaEligible: v })}
              state={state("hsaEligible")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold">Deductible and out-of-pocket limit</h3>
            <p className="text-sm text-ink-faint">In-network amounts, per year.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AmountField
              label="Deductible, one person"
              value={draft.deductibleIndividual}
              onChange={(v) => set("deductible.individual", { deductibleIndividual: v })}
              state={state("deductible.individual")}
            />
            <AmountField
              label="Deductible, family"
              value={draft.deductibleFamily}
              onChange={(v) => set("deductible.family", { deductibleFamily: v })}
              state={state("deductible.family")}
            />
            <AmountField
              label="Out-of-pocket limit, one person"
              value={draft.oopIndividual}
              onChange={(v) => set("oopMax.individual", { oopIndividual: v })}
              state={state("oopMax.individual")}
            />
            <AmountField
              label="Out-of-pocket limit, family"
              value={draft.oopFamily}
              onChange={(v) => set("oopMax.family", { oopFamily: v })}
              state={state("oopMax.family")}
            />
          </div>
          <SelectField
            label="On a family plan, does each person only have to meet their own deductible?"
            hint="Often worded as “each family member meets their own individual deductible” (an embedded deductible)."
            value={draft.embedded}
            options={YES_NO}
            onChange={(v) => set("deductible.embedded", { embedded: v })}
            state={state("deductible.embedded")}
          />
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-bold">What you pay for care</h3>
            <p className="text-sm text-ink-faint">The in-network column of the SBC.</p>
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

        <section className="space-y-2">
          <ExclusionsField
            value={draft.exclusions}
            onChange={(v) => set("exclusions", { exclusions: v })}
            state={state("exclusions")}
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold">Premiums and extras</h3>
            <p className="text-sm text-ink-faint">
              These are not in the SBC. Find them in the enrollment guide or the benefits portal.
            </p>
          </div>
          <fieldset className="space-y-3" data-field-error={errors?.premiums ? "true" : undefined}>
            <legend className="text-sm font-medium">Your share of the premium, per paycheck</legend>
            <p className="text-sm text-ink-faint">Leave a level empty if the employer does not offer it.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {COVERAGE_TIERS.map((tier) => (
                <AmountField
                  key={tier}
                  label={TIER_LABELS[tier]}
                  value={draft.premiums[tier]}
                  onChange={(v) => set(null, { premiums: { ...draft.premiums, [tier]: v } })}
                />
              ))}
            </div>
            <FieldNote state={{ error: errors?.premiums }} />
          </fieldset>
          <SelectField
            label="Paychecks per year"
            value={draft.paychecksPerYear}
            options={PAYCHECK_OPTIONS}
            onChange={(v) => set(null, { paychecksPerYear: v })}
            state={state("paychecksPerYear")}
          />
          {draft.hsaEligible === "yes" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <AmountField
                label="Employer HSA money, one person"
                hint="Per year. Leave empty if none."
                value={draft.hsaIndividual}
                onChange={(v) => set(null, { hsaIndividual: v })}
                state={state("hsaIndividual")}
              />
              <AmountField
                label="Employer HSA money, family"
                hint="Per year. Leave empty if none."
                value={draft.hsaFamily}
                onChange={(v) => set(null, { hsaFamily: v })}
                state={state("hsaFamily")}
              />
            </div>
          )}
          <AmountField
            label="Spousal surcharge"
            hint="Some employers charge extra to cover a spouse who could get their own employer's plan. Per year; leave empty if none."
            value={draft.surcharge}
            onChange={(v) => set(null, { surcharge: v })}
            state={state("surcharge")}
          />
        </section>

        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer text-sm font-medium text-risk underline underline-offset-4"
        >
          Remove this plan
        </button>
      </div>
    </details>
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
