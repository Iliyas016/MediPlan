import type { Arrangement } from "@/lib/calc";
import type { PersonRole } from "@/lib/domain/profile";
import { PersonFigure } from "@/components/ui/art";

/** Who goes on which plan: the decision the family actually has to make. */
export function Coverage({
  arrangement,
  labelOf,
  roleOf,
}: {
  arrangement: Arrangement;
  labelOf: (personId: string) => string;
  roleOf: (personId: string) => PersonRole;
}) {
  return (
    <dl className={`grid gap-3 ${arrangement.parts.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {arrangement.parts.map((part) => (
        <div key={part.plan.id} className="space-y-3 rounded-xl border border-rule bg-surface p-5">
          <dt className="text-lg font-bold">{part.plan.name}</dt>
          <dd className="flex flex-wrap gap-2">
            {part.coveredIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper py-1 pr-3.5 pl-2 text-sm font-semibold"
              >
                <PersonFigure role={roleOf(id)} className="w-6" />
                {labelOf(id)}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
