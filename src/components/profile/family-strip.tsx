import { PersonFigure } from "@/components/ui/art";
import type { PersonRole } from "@/lib/domain/profile";

/** The family as the visitor has described it so far, redrawn on every answer. */
export function FamilyStrip({ people }: { people: { id: string; role: PersonRole; name: string }[] }) {
  return (
    <div
      role="img"
      aria-label={`Covering ${people.map((p) => p.name).join(", ")}`}
      className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-rule bg-surface px-5 pt-5 pb-4"
    >
      {people.map((person) => (
        <div key={person.id} className="enter flex flex-col items-center gap-1.5">
          <PersonFigure role={person.role} className={person.role === "child" ? "w-9" : "w-12"} />
          <span className="max-w-20 truncate text-xs font-semibold text-ink-soft">{person.name}</span>
        </div>
      ))}
      <p className="ml-auto self-center text-sm text-ink-faint tabular-nums">
        {people.length === 1 ? "1 person to cover" : `${people.length} people to cover`}
      </p>
    </div>
  );
}
