import type { ArrangementResult } from "@/lib/calc";
import { formatUsd } from "@/lib/format";

/** Good, expected and bad year side by side, plus the hard ceiling. */
export function ScenarioCards({
  result,
  badYearName,
}: {
  result: ArrangementResult;
  badYearName: string;
}) {
  const cards = [
    {
      title: "Good year",
      amount: result.costs.good,
      body: "Only check-ups and the care you need every year.",
    },
    {
      title: "Expected year",
      amount: result.costs.expected,
      body: "Everything you told us to expect.",
    },
    {
      title: "Bad year",
      amount: result.costs.bad,
      body: `Expected care plus an emergency for ${badYearName}: ambulance, ER and a hospital stay. ${formatUsd(result.badYearShock)} more than expected.`,
    },
  ];

  return (
    <section aria-labelledby="scenarios-title" className="space-y-3">
      <h2 id="scenarios-title" className="text-lg font-semibold">
        What next year could cost
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.title}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <p className="text-sm text-zinc-500">{card.title}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatUsd(card.amount)}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{card.body}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The most you could pay for covered in-network care is {formatUsd(result.worstCase)}, premiums
        included. Totals are after any money your employer puts into your HSA.
      </p>
    </section>
  );
}
