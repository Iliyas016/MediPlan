import { ButtonLink } from "@/components/ui/button";

const ROWS = ["You", "Your spouse or partner", "Your children"];

/**
 * The hero is the benefits election form itself: the question every employer
 * asks in November, with the answer lines still blank.
 */
export function ElectionSheet() {
  return (
    <section
      aria-labelledby="hero-title"
      className="rounded-md border border-rule bg-surface px-5 py-7 shadow-[0_1px_2px_rgb(22_48_79/0.06),0_24px_48px_-24px_rgb(22_48_79/0.25)] sm:px-10 sm:py-10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3 text-sm">
        <span className="font-semibold">Open enrollment election</span>
        <span className="text-ink-soft">Your choice locks in for the whole year</span>
      </div>

      <h1
        id="hero-title"
        className="mt-8 text-4xl leading-[1.08] font-extrabold sm:text-5xl"
      >
        Which health plan should cover each person in your family?
      </h1>
      <p className="mt-5 max-w-prose text-lg text-ink-soft">
        Upload the plan summaries from your job and your partner&apos;s. MediPlan prices every way
        to split your family across them, for a normal year and a bad one, and fills in the
        answer.
      </p>

      <dl className="mt-8">
        {ROWS.map((row) => (
          <div
            key={row}
            className="grid grid-cols-[minmax(0,11rem)_1fr] items-end gap-4 border-b border-rule py-3"
          >
            <dt className="font-semibold">{row}</dt>
            <dd className="h-6 border-b border-dashed border-rule-strong" aria-label="Not chosen yet" />
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink href="/start">Fill this in with MediPlan</ButtonLink>
        <p className="text-sm text-ink-soft">About five minutes. No sign-up.</p>
      </div>
    </section>
  );
}
