import type { ArrangementResult } from "@/lib/calc";
import { formatUsd } from "@/lib/format";

/** Good, expected and bad year as ledger lines, plus the hard ceiling. */
export function ScenarioLedger({
  result,
  badYearName,
}: {
  result: ArrangementResult;
  badYearName: string;
}) {
  const rows = [
    {
      title: "Good year",
      amount: result.costs.good,
      body: "Only check-ups and the care you need every year.",
      tone: "",
      bar: "bg-save",
    },
    {
      title: "Expected year",
      amount: result.costs.expected,
      body: "Everything you told us to expect.",
      tone: "",
      bar: "bg-ink",
    },
    {
      title: "Bad year",
      amount: result.costs.bad,
      body: `Expected care plus an emergency for ${badYearName}: ambulance, ER and a hospital stay. ${formatUsd(result.badYearShock)} more than expected.`,
      tone: "text-risk",
      bar: "bg-risk",
    },
  ];
  const scale = Math.max(result.worstCase, result.costs.bad);

  return (
    <section aria-labelledby="scenarios-title" className="space-y-3">
      <h2 id="scenarios-title" className="text-xl font-bold">
        What next year could cost
      </h2>
      <dl className="divide-y divide-rule border-y border-rule">
        {rows.map((row) => (
          <div key={row.title} className="space-y-3 py-4">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <dt className="font-semibold">{row.title}</dt>
                <dd className="max-w-md text-sm text-ink-soft">{row.body}</dd>
              </div>
              <dd className={`text-2xl font-bold tabular-nums ${row.tone}`}>{formatUsd(row.amount)}</dd>
            </div>
            <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-rule">
              <div
                className={`h-full rounded-full ${row.bar}`}
                style={{ width: `${scale > 0 ? (row.amount / scale) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
      <p className="text-sm text-ink-faint">
        Each bar is drawn against the ceiling. Ceiling: the most you could pay for covered in-network care is{" "}
        <span className="font-semibold text-ink tabular-nums">{formatUsd(result.worstCase)}</span>,
        premiums included.
      </p>
    </section>
  );
}
