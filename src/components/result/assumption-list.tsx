import Link from "next/link";

/**
 * Everything the verdict rests on that the family did not tell us. The ones
 * whose real answer could change the recommendation come first and say so.
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
    <section aria-labelledby="assumptions-title" className="space-y-3">
      <h2 id="assumptions-title" className="text-xl font-bold">
        Based on these assumptions
      </h2>
      {count > 0 && (
        <p className="max-w-prose text-ink-soft">
          We re-ran your result with each guess pushed to its extremes.{" "}
          {count === 1 ? "One answer" : `${count} answers`} could change which option we recommend.
        </p>
      )}
      <ul className="max-w-prose list-disc space-y-1.5 pl-5 text-ink-soft">
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
      <Link href="/profile" className="inline-block py-2 font-semibold underline">
        {count > 0 ? "Answer these to confirm your result" : "Answer these to sharpen the result"}
      </Link>
    </section>
  );
}
