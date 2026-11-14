import type { Arrangement } from "@/lib/calc";

/** Who goes on which plan: the decision the family actually has to make. */
export function Coverage({
  arrangement,
  labelOf,
}: {
  arrangement: Arrangement;
  labelOf: (personId: string) => string;
}) {
  return (
    <dl className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface">
      {arrangement.parts.map((part) => (
        <div
          key={part.plan.id}
          className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
        >
          <dt className="text-lg font-bold">{part.plan.name}</dt>
          <dd className="text-ink-soft">{part.coveredIds.map(labelOf).join(", ")}</dd>
        </div>
      ))}
    </dl>
  );
}
