import type { ArrangementResult } from "@/lib/calc";
import { formatUsd } from "@/lib/format";

/** Every valid way to cover the family, cheapest expected year first. */
export function OptionList({ ranked, bestId }: { ranked: ArrangementResult[]; bestId: string }) {
  return (
    <section aria-labelledby="options-title" className="space-y-3">
      <h2 id="options-title" className="text-lg font-semibold">
        All {ranked.length} ways to cover your family
      </h2>
      <ol className="space-y-3">
        {ranked.map((r) => {
          const isBest = r.arrangement.id === bestId;
          return (
            <li
              key={r.arrangement.id}
              className={`rounded-xl border p-4 ${
                isBest
                  ? "border-emerald-600 dark:border-emerald-500"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{r.arrangement.label}</p>
                {isBest && (
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    Recommended
                  </span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Stat label="Expected year" value={r.costs.expected} />
                <Stat label="Bad year" value={r.costs.bad} />
                <Stat label="Premiums" value={r.premiums} />
              </dl>
              {r.flags.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-amber-800 dark:text-amber-300">
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium tabular-nums">{formatUsd(value)}</dd>
    </div>
  );
}
