import type { CheckedEntry } from "@/lib/calc/year";
import { formatUsd, SERVICE_LABELS } from "@/lib/format";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Logged bills, each with what the plan says the family owes. */
export function BillList({
  entries,
  labelOf,
  onRemove,
}: {
  entries: CheckedEntry[];
  labelOf: (id: string) => string;
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {[...entries].reverse().map(({ entry, planName, shouldOwe, notCovered, overbilled }) => (
        <li key={entry.id} className="space-y-2 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p>
              <span className="font-semibold">{SERVICE_LABELS[entry.service]}</span>
              <span className="text-ink-soft">
                {" "}
                for {labelOf(entry.personId)},{" "}
                {dateFormat.format(new Date(`${entry.date}T00:00:00Z`))}
              </span>
            </p>
            <p className="tabular-nums">
              You owe <strong className="font-bold">{formatUsd(shouldOwe)}</strong>
              <span className="text-ink-soft"> of {formatUsd(entry.allowed)}</span>
            </p>
          </div>
          {planName === null && (
            <p className="text-sm text-risk">This person is not on any of your plans.</p>
          )}
          {notCovered && planName !== null && (
            <p className="text-sm text-risk">{planName} does not cover this service, so you pay it in full.</p>
          )}
          {overbilled > 0 && (
            <p className="text-sm text-risk">
              Billed {formatUsd(entry.billed ?? 0)}, which is {formatUsd(overbilled)} more than your
              plan’s share. Ask the provider for an itemized bill and compare it with your
              insurer’s Explanation of Benefits before you pay.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove the ${SERVICE_LABELS[entry.service].toLowerCase()} bill from your log?`)) {
                onRemove(entry.id);
              }
            }}
            className="cursor-pointer py-3 text-sm text-ink-faint underline hover:text-ink"
          >
            Remove
          </button>
        </li>
      ))}
    </ol>
  );
}
