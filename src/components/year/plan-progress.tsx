import type { PlanProgress } from "@/lib/calc/year";
import type { Progress } from "@/lib/calc/cost";
import { formatUsd } from "@/lib/format";

/** How far each plan is toward its deductible and its out-of-pocket limit. */
export function PlanProgressList({
  plans,
  labelOf,
}: {
  plans: PlanProgress[];
  labelOf: (id: string) => string;
}) {
  return (
    <section aria-labelledby="progress-title" className="space-y-4">
      <h2 id="progress-title" className="text-xl font-bold">
        Where you stand
      </h2>
      <div className="divide-y divide-rule border-y border-rule">
        {plans.map((p) => (
          <div key={p.plan.id} className="space-y-4 py-5">
            <p className="font-bold">
              {p.plan.name}
              <span className="font-normal text-ink-soft">
                {" "}
                for {p.coveredIds.map(labelOf).join(", ")}
              </span>
            </p>
            <Meter
              label="Deductible"
              progress={p.deductible}
              doneText="Deductible met. Your plan now shares the cost of covered care."
            />
            <Meter
              label="Out-of-pocket limit"
              progress={p.outOfPocket}
              doneText="Limit reached. Covered in-network care is paid in full for the rest of the year."
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function Meter({ label, progress, doneText }: { label: string; progress: Progress; doneText: string }) {
  const share = progress.limit > 0 ? Math.min(1, progress.paid / progress.limit) : 1;
  const done = progress.paid >= progress.limit;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-ink-soft">
          {formatUsd(progress.paid)} of {formatUsd(progress.limit)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={progress.limit}
        aria-valuenow={progress.paid}
        className="h-2.5 overflow-hidden rounded-full bg-rule"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${done ? "bg-save" : "bg-ink"}`}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      {done && <p className="text-sm text-save">{doneText}</p>}
    </div>
  );
}
