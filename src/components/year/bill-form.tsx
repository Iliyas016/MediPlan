"use client";

import { useId, useState, type FormEvent } from "react";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/domain/plan";
import type { Person } from "@/lib/domain/profile";
import { SERVICE_LABELS } from "@/lib/format";
import type { LedgerEntry } from "@/lib/store/session";
import { Button } from "@/components/ui/button";
import { controlClass, hintClass, labelClass } from "./form-styles";

const today = () => new Date().toISOString().slice(0, 10);

/** Log one bill from the insurer's statement and, optionally, the provider's bill. */
export function BillForm({ people, onAdd }: { people: Person[]; onAdd: (entry: LedgerEntry) => void }) {
  const id = useId();
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [service, setService] = useState<ServiceKey>("primaryCare");
  const [date, setDate] = useState(today);
  const [allowed, setAllowed] = useState("");
  const [billed, setBilled] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const allowedAmount = Number(allowed);
    const billedAmount = billed.trim() === "" ? null : Number(billed);
    if (!date) return setError("Enter the date of the visit.");
    if (!(allowedAmount > 0)) return setError("Enter the allowed amount from your insurer's statement.");
    if (billedAmount !== null && !(billedAmount >= 0)) return setError("The billed amount must be a number.");
    setError(null);
    onAdd({
      id: crypto.randomUUID(),
      date,
      personId,
      service,
      allowed: allowedAmount,
      billed: billedAmount,
    });
    setAllowed("");
    setBilled("");
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-rule bg-surface p-5">
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
            onChange={(e) => setService(e.target.value as ServiceKey)}
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
          <label htmlFor={`${id}-date`} className={labelClass}>
            Date
          </label>
          <input id={`${id}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={controlClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-allowed`} className={labelClass}>
            Allowed amount
          </label>
          <p id={`${id}-allowed-hint`} className={hintClass}>
            On your insurer&apos;s Explanation of Benefits, often called &ldquo;allowed&rdquo; or
            &ldquo;plan discount price&rdquo;.
          </p>
          <MoneyInput id={`${id}-allowed`} hintId={`${id}-allowed-hint`} value={allowed} onChange={setAllowed} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-billed`} className={labelClass}>
            Amount the provider is asking (optional)
          </label>
          <p id={`${id}-billed-hint`} className={hintClass}>
            From the provider&apos;s bill. We check it against your plan&apos;s share.
          </p>
          <MoneyInput id={`${id}-billed`} hintId={`${id}-billed-hint`} value={billed} onChange={setBilled} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-risk">
          {error}
        </p>
      )}
      <Button type="submit">Add bill</Button>
    </form>
  );
}

function MoneyInput({
  id,
  hintId,
  value,
  onChange,
}: {
  id: string;
  hintId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-faint">$</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        aria-describedby={hintId}
        onChange={(e) => onChange(e.target.value)}
        className={`${controlClass} max-w-40`}
      />
    </div>
  );
}
