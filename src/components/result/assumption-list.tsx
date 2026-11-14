import Link from "next/link";

/**
 * Everything the verdict rests on that the family did not tell us. Only the
 * answers that could change the recommendation stay in view; the full list
 * folds away, so the verdict stays the first thing on the page.
 */
export function AssumptionList({
  assumptions,
  decisive,
}: {
  assumptions: { path: string; note: string }[];
  decisive: Set<string>;
}) {
  if (assumptions.length === 0) return null;
  const sorted = [...assumptions].sort((a, b) => Number(decisive.has(b.path)) - Number(decisive.has(a.path)));
  const count = assumptions.filter((a) => decisive.has(a.path)).length;

  return (
    <section aria-label="Assumptions" className="space-y-3">
      {count > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-risk-wash px-5 py-4">
          <span className="font-semibold">
            {count === 1 ? "One answer" : `${count} answers`} we guessed could change this result.
          </span>
          <Link href="/profile" className="font-semibold underline underline-offset-4">
            Answer {count === 1 ? "it" : "them"}
          </Link>
        </p>
      )}
      <details className="group rounded-xl border border-rule bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold">
          What we assumed ({assumptions.length})
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180"
          >
            <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="space-y-3 px-5 pb-5">
          <p className="max-w-prose text-sm text-ink-soft">
            Where you skipped a question we used a typical value. We re-ran the result with each
            guess pushed to its extremes to find the ones that matter.
          </p>
          <ul className="max-w-prose list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
            {sorted.map((a) => (
              <li key={a.path}>
                {decisive.has(a.path) && (
                  <span className="mr-2 inline-block rounded-full bg-risk-wash px-2 py-0.5 align-middle text-xs font-semibold text-risk">
                    Could change your result
                  </span>
                )}
                {a.note}
              </li>
            ))}
          </ul>
          <Link href="/profile" className="inline-block py-2 text-sm font-semibold underline">
            Answer these to sharpen the result
          </Link>
        </div>
      </details>
    </section>
  );
}
