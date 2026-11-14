export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        MediPlan
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance">
        Two jobs, six health plans. Find the cheapest way to cover your family.
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Upload the plan summaries from both employers. We price every way to
        split your family across them, for a normal year and for a bad one.
      </p>
      <p className="text-sm text-zinc-500">
        Upload and comparison are being built. No account is needed.
      </p>
    </main>
  );
}
