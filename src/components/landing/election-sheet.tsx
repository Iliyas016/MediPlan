import { ButtonLink } from "@/components/ui/button";
import { stagger } from "@/components/ui/motion";

const ROWS = ["You", "Your spouse or partner", "Your children"];

/**
 * The hero is the benefits election form itself: the question every employer
 * asks in November, with the answer lines still blank. The sheet settles in
 * and its answer lines are ruled one by one, waiting to be filled.
 */
export function ElectionSheet() {
  return (
    <section
      aria-labelledby="hero-title"
      style={stagger(0)}
      className="enter rounded-md border border-rule bg-surface px-5 py-7 shadow-[0_1px_2px_rgb(22_48_79/0.06),0_24px_48px_-24px_rgb(22_48_79/0.25)] sm:px-10 sm:py-10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3 text-sm">
        <span className="font-semibold">Open enrollment election</span>
        <span className="text-ink-soft">Your choice locks in for the whole year</span>
      </div>

      <h1
        id="hero-title"
        style={stagger(1)}
        className="enter mt-8 text-4xl leading-[1.08] font-extrabold sm:text-5xl"
      >
        Which health plan should cover each person in your family?
      </h1>
      <p style={stagger(2)} className="enter mt-5 max-w-prose text-lg text-ink-soft">
        Upload the plan summaries from your job and your partner’s. MediPlan prices every way
        to split your family across them, for a normal year and a bad one, and fills in the
        answer.
      </p>

      <dl className="mt-8">
        {ROWS.map((row, i) => (
          <div
            key={row}
            className="grid grid-cols-[minmax(0,11rem)_1fr] items-end gap-4 border-b border-rule py-3"
          >
            <dt style={stagger(3 + i)} className="enter font-semibold">
              {row}
            </dt>
            <dd
              style={stagger(2 + i)}
              className="draw h-6 border-b border-dashed border-rule-strong"
              aria-label="Not chosen yet"
            />
          </div>
        ))}
      </dl>

      <div style={stagger(7)} className="enter mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink href="/start">Fill this in with MediPlan</ButtonLink>
        <ButtonLink href="/start?sample=1" variant="secondary">
          Try with sample plans
        </ButtonLink>
      </div>
      <p style={stagger(8)} className="enter mt-3 text-sm text-ink-soft">
        About five minutes. No sign-up. The samples are real plan documents from two university
        employers.
      </p>
    </section>
  );
}
