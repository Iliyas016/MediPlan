import type { ArrangementResult } from "@/lib/calc";
import { formatUsd } from "@/lib/format";

const columns = "sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] sm:items-baseline sm:gap-4";

/** Every valid way to cover the family as ledger rows, cheapest expected year first. */
export function OptionList({ ranked, bestId }: { ranked: ArrangementResult[]; bestId: string }) {
  const scale = Math.max(...ranked.map((r) => r.costs.bad), 1);
  const width = (amount: number) => ({ width: `${(amount / scale) * 100}%` });
  return (
    <section aria-labelledby="options-title" className="space-y-3">
      <h2 id="options-title" className="text-xl font-bold">
        All {ranked.length} ways to cover your family
      </h2>
      <p aria-hidden className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-ink" />
          Expected year
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-risk" />
          Bad year
        </span>
      </p>
      <div
        aria-hidden
        className={`hidden border-b border-rule-strong pb-2 text-sm text-ink-faint ${columns}`}
      >
        <span>Option</span>
        <span className="text-right">Expected year</span>
        <span className="text-right">Bad year</span>
        <span className="text-right">Premiums</span>
      </div>
      <ol className="divide-y divide-rule">
        {ranked.map((r) => {
          const isBest = r.arrangement.id === bestId;
          return (
            <li key={r.arrangement.id} className="py-4">
              <div className={columns}>
                <p className={isBest ? "font-bold" : "font-medium"}>
                  {r.arrangement.label}
                  {isBest && (
                    <span className="ml-2 inline-block rounded-full bg-save-wash px-2 py-0.5 align-middle text-xs font-semibold text-save">
                      Recommended
                    </span>
                  )}
                </p>
                <dl className="mt-2 grid grid-cols-3 gap-2 sm:contents">
                  <Figure label="Expected year" value={r.costs.expected} strong={isBest} />
                  <Figure label="Bad year" value={r.costs.bad} />
                  <Figure label="Premiums" value={r.premiums} />
                </dl>
              </div>
              <div aria-hidden className="mt-3 space-y-1">
                <div className={`h-2 rounded-full ${isBest ? "bg-save" : "bg-ink"}`} style={width(r.costs.expected)} />
                <div className="h-2 rounded-full bg-risk" style={width(r.costs.bad)} />
              </div>
              {r.flags.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-risk">
                  {r.flags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Figure({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="sm:text-right">
      <dt className="text-xs text-ink-faint sm:sr-only">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-bold" : ""}`}>{formatUsd(value)}</dd>
    </div>
  );
}
