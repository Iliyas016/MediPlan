import Link from "next/link";

/** Everything the verdict rests on that the family did not tell us. */
export function AssumptionList({ assumptions }: { assumptions: { path: string; note: string }[] }) {
  if (assumptions.length === 0) return null;
  return (
    <section aria-labelledby="assumptions-title" className="space-y-3">
      <h2 id="assumptions-title" className="text-xl font-bold">
        Based on these assumptions
      </h2>
      <ul className="max-w-prose list-disc space-y-1.5 pl-5 text-ink-soft">
        {assumptions.map((a) => (
          <li key={a.path}>{a.note}</li>
        ))}
      </ul>
      <Link href="/profile" className="inline-block font-semibold underline">
        Answer these to sharpen the result
      </Link>
    </section>
  );
}
