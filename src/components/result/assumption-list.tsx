import Link from "next/link";

/** Everything the verdict rests on that the family did not tell us. */
export function AssumptionList({ assumptions }: { assumptions: { path: string; note: string }[] }) {
  if (assumptions.length === 0) return null;
  return (
    <section aria-labelledby="assumptions-title" className="space-y-2">
      <h2 id="assumptions-title" className="text-lg font-semibold">
        Based on these assumptions
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
        {assumptions.map((a) => (
          <li key={a.path}>{a.note}</li>
        ))}
      </ul>
      <Link href="/profile" className="inline-block font-medium underline underline-offset-4">
        Answer these to sharpen the result
      </Link>
    </section>
  );
}
