import { formatUsd } from "@/lib/format";

/*
 * Illustrative example, labelled as such on the page. Family of four, four
 * doctor visits a year ($150 each), and in the bad year a $14,000 hospital stay.
 *   Plan A: $250/month, $6,000 family deductible, then 20%.
 *   Plan B: $510/month, $30 visit copay, $1,000 deductible, then 20%.
 * Normal year: A = 3,000 + 600 = 3,600.   B = 6,120 + 120 = 6,240.
 * Bad year:    A = 3,000 + 6,000 + 20% of 8,600 = 10,720.
 *              B = 6,120 + 120 + 1,000 + 20% of 13,000 = 9,840.
 */
const PLANS = [
  { name: "Plan A", detail: "Lower premium, $6,000 deductible", normal: 3600, bad: 10720 },
  { name: "Plan B", detail: "Higher premium, $1,000 deductible", normal: 6240, bad: 9840 },
];

const columns = "grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-baseline gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem]";

export function YearComparison() {
  const [a, b] = PLANS;
  return (
    <figure className="space-y-4">
      <div className={`${columns} border-b border-rule-strong pb-2 text-sm text-ink-faint`}>
        <span>Total cost for the year</span>
        <span className="text-right">Normal year</span>
        <span className="text-right">Bad year</span>
      </div>
      <dl className="divide-y divide-rule">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`${columns} py-3`}>
            <dt>
              <span className="font-bold">{plan.name}</span>
              <span className="block text-sm text-ink-soft">{plan.detail}</span>
            </dt>
            <dd className="text-right text-xl font-bold tabular-nums">{formatUsd(plan.normal)}</dd>
            <dd className="text-right text-xl font-bold tabular-nums">{formatUsd(plan.bad)}</dd>
          </div>
        ))}
      </dl>
      <figcaption className="space-y-2">
        <p className="text-lg font-semibold">
          The cheap plan saves {formatUsd(b.normal - a.normal)} in a normal year, and costs{" "}
          <span className="marker">{formatUsd(a.bad - b.bad)} more in a bad one.</span>
        </p>
        <p className="text-sm text-ink-faint">
          Illustrative example: family of four, four doctor visits a year, and in the bad year a
          $14,000 hospital stay. Your result is calculated from your own plans.
        </p>
      </figcaption>
    </figure>
  );
}
