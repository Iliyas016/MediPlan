"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";
import {
  BAD_YEAR_BILL,
  ILLUSTRATIVE_PLANS,
  MAX_HOSPITAL_BILL,
  breakEvenBill,
  yearCost,
} from "./illustration";

const PRESETS = [
  { label: "Normal year", bill: 0 },
  { label: "Bad year", bill: BAD_YEAR_BILL },
];

/** The widest bar: the dearest plan with the largest bill the slider allows. */
const SCALE = Math.max(...ILLUSTRATIVE_PLANS.map((plan) => yearCost(plan, MAX_HOSPITAL_BILL).total));
const BREAK_EVEN = breakEvenBill(ILLUSTRATIVE_PLANS);

const percent = (amount: number) => `${(amount / SCALE) * 100}%`;

/** Drag the hospital bill and watch the cheap plan stop being the cheap one. */
export function YearExplorer() {
  const [bill, setBill] = useState(0);
  const costs = ILLUSTRATIVE_PLANS.map((plan) => ({ plan, cost: yearCost(plan, bill) }));
  const cheapest = Math.min(...costs.map(({ cost }) => cost.total));
  const dearest = Math.max(...costs.map(({ cost }) => cost.total));
  const winner = costs.find(({ cost }) => cost.total === cheapest)!.plan;

  return (
    <figure className="space-y-6">
      <div className="rounded-xl border border-rule bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <label htmlFor="hospital-bill" className="font-bold">
            How bad is the year?
          </label>
          <output htmlFor="hospital-bill" className="text-sm text-ink-soft tabular-nums">
            {bill === 0 ? "No hospital bill" : `${formatUsd(bill)} hospital bill`}
          </output>
        </div>
        <input
          id="hospital-bill"
          type="range"
          min={0}
          max={MAX_HOSPITAL_BILL}
          step={500}
          value={bill}
          onChange={(event) => setBill(Number(event.target.value))}
          aria-valuetext={bill === 0 ? "No hospital bill" : `${formatUsd(bill)} hospital bill`}
          className="year-slider mt-3 w-full"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={bill === preset.bill}
              onClick={() => setBill(preset.bill)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97] ${
                bill === preset.bill
                  ? "border-ink bg-ink text-paper"
                  : "border-rule-strong bg-surface text-ink hover:border-ink"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <dl className="mt-6 divide-y divide-rule border-t border-rule">
          {costs.map(({ plan, cost }) => {
            const wins = cost.total === cheapest && cheapest !== dearest;
            return (
              <div key={plan.name} className="space-y-2 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <dt>
                    <span className="font-bold">{plan.name}</span>
                    <span className="block text-sm text-ink-soft">{plan.detail}</span>
                  </dt>
                  <dd className="text-right">
                    <span className={`text-2xl font-extrabold tabular-nums ${wins ? "text-save" : ""}`}>
                      {formatUsd(cost.total)}
                    </span>
                    <span className={`block text-sm font-semibold ${wins ? "text-save" : "text-ink-faint"}`}>
                      {wins ? "Cheaper this year" : `${formatUsd(cost.total - cheapest)} more`}
                    </span>
                  </dd>
                </div>
                <div aria-hidden className="flex h-5 overflow-hidden rounded-full bg-paper">
                  <span className="bg-ink" style={{ width: percent(cost.premiums) }} />
                  <span className="bg-risk" style={{ width: percent(cost.care) }} />
                </div>
              </div>
            );
          })}
        </dl>
        <p aria-hidden className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-ink" />
            Premiums
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-risk" />
            What you pay for care
          </span>
        </p>
        <p role="status" className="sr-only">
          {winner.name} is cheaper with {bill === 0 ? "no hospital bill" : `a ${formatUsd(bill)} hospital bill`}.
        </p>
      </div>

      <figcaption className="space-y-2">
        {BREAK_EVEN !== null && (
          <p className="text-lg font-semibold">
            The cheap plan stops being cheaper once a hospital bill passes{" "}
            <span className="marker">{formatUsd(BREAK_EVEN)}.</span>
          </p>
        )}
        <p className="text-sm text-ink-faint">
          Illustrative example: family of four, four doctor visits a year at $150 each. Plan A:
          everything counts toward the deductible, then you pay 20%. Plan B: $30 per visit, then
          20% of hospital bills after the deductible. Your result is calculated from your own plans.
        </p>
      </figcaption>
    </figure>
  );
}
