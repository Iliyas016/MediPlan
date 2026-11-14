"use client";

import { useId, useState } from "react";
import type { Arrangement } from "@/lib/calc";
import { estimateVisit } from "@/lib/calc/year";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/domain/plan";
import type { Person } from "@/lib/domain/profile";
import { REFERENCE_PRICES } from "@/lib/domain/reference-prices";
import { formatUsd, SERVICE_LABELS } from "@/lib/format";
import type { LedgerEntry } from "@/lib/store/session";
import { controlClass, hintClass, labelClass } from "./form-styles";

/** What a visit would cost today, given the deductible already met. */
export function VisitEstimate({
  arrangement,
  ledger,
  people,
}: {
  arrangement: Arrangement;
  ledger: LedgerEntry[];
  people: Person[];
}) {
  const id = useId();
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [service, setService] = useState<ServiceKey>("specialist");
  const [price, setPrice] = useState(String(REFERENCE_PRICES.specialist.allowed));

  const allowed = Number(price);
  const estimate = allowed > 0 ? estimateVisit(arrangement, ledger, personId, service, allowed) : null;
  const label = people.find((p) => p.id === personId)?.label ?? "This person";
  const name = label === "You" ? "you" : label;

  const chooseService = (next: ServiceKey) => {
    setService(next);
    setPrice(String(REFERENCE_PRICES[next].allowed));
  };

  return (
    <section aria-labelledby="estimate-title" className="space-y-4">
      <h2 id="estimate-title" className="text-xl font-bold">
        Before your next visit
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor={`${id}-person`} className={labelClass}>
            Who
          </label>
          <select id={`${id}-person`} value={personId} onChange={(e) => setPersonId(e.target.value)} className={controlClass}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-service`} className={labelClass}>
            What
          </label>
          <select
            id={`${id}-service`}
            value={service}
            onChange={(e) => chooseService(e.target.value as ServiceKey)}
            className={controlClass}
          >
            {SERVICE_KEYS.map((key) => (
              <option key={key} value={key}>
                {SERVICE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-price`} className={labelClass}>
            Price
          </label>
          <div className="flex items-center gap-2">
            <span className="text-ink-faint">$</span>
            <input
              id={`${id}-price`}
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={price}
              aria-describedby={`${id}-price-hint`}
              onChange={(e) => setPrice(e.target.value)}
              className={controlClass}
            />
          </div>
        </div>
      </div>
      <p id={`${id}-price-hint`} className={hintClass}>
        Starts at a typical in-network price. Ask the provider or your insurer for the real one.
      </p>
      <p aria-live="polite" className="text-lg">
        {estimate === null ? (
          <span className="text-ink-soft">Enter a price to see your share.</span>
        ) : estimate.notCovered ? (
          <>
            {estimate.planName} does not cover this. {label} would pay{" "}
            <strong className="font-bold tabular-nums">{formatUsd(estimate.pay)}</strong>.
          </>
        ) : (
          <>
            On {estimate.planName}, {name} would pay about{" "}
            <strong className="font-bold tabular-nums">{formatUsd(estimate.pay)}</strong> right now.
          </>
        )}
      </p>
    </section>
  );
}
