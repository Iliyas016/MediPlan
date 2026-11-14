import { ButtonLink } from "@/components/ui/button";
import { ElectionSheet } from "@/components/landing/election-sheet";
import { YearComparison } from "@/components/landing/year-comparison";

const KFF_2026 =
  "https://www.kff.org/other-health/workers-now-pay-7471-on-average-annually-for-family-health-coverage-up-9-or-621-from-2025-benchmark-employer-health-benefits-survey-finds/";

const STEPS = [
  {
    title: "Add both employers' plans",
    body: "Upload each plan's Summary of Benefits and Coverage, the standard PDF in every benefits packet. We read the deductibles, copays and limits. You check them and add your paycheck premiums.",
  },
  {
    title: "Describe your family",
    body: "Who needs coverage, how often you see a doctor, prescriptions, anything planned. Skip what you are unsure of and we show the assumption we used.",
  },
  {
    title: "Get the answer",
    body: "Every way to split your family across both employers, priced for a good, an expected and a bad year, with the one we recommend and why.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:pt-16">
        <ElectionSheet />
      </div>

      <section aria-labelledby="price-title" className="border-t border-rule">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-16">
          <h2 id="price-title" className="text-3xl font-extrabold">
            The monthly price is the wrong number
          </h2>
          <p className="max-w-prose text-lg text-ink-soft">
            In 2026 the average worker paid{" "}
            <a href={KFF_2026} className="font-semibold text-ink underline">
              $7,471 toward family coverage
            </a>
            . Yet the paycheck premium is only part of the bill. The deductible, copays and the
            out-of-pocket limit decide the rest, and which plan wins depends on the year you have.
          </p>
          <YearComparison />
        </div>
      </section>

      <section aria-labelledby="how-title" className="border-t border-rule">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16">
          <h2 id="how-title" className="text-3xl font-extrabold">
            How it works
          </h2>
          <ol className="divide-y divide-rule border-y border-rule">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-6">
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full bg-ink text-sm font-bold text-paper tabular-nums"
                >
                  {i + 1}
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="max-w-prose text-ink-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="couples-title" className="border-t border-rule bg-surface">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-16">
          <h2 id="couples-title" className="text-3xl font-extrabold">
            Built for families with two jobs
          </h2>
          <p className="max-w-prose text-lg text-ink-soft">
            Your employer&apos;s benefits tool only knows its own plans. With two employers you
            have two menus and several ways to combine them: everyone on yours, everyone on your
            partner&apos;s, each of you on your own, the children on either side. MediPlan prices
            all of them in one place.
          </p>
          <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <Point title="A bad year, not just an average one">
              Each option is tested against an emergency, and we will not recommend one whose bad
              year your savings could not cover.
            </Point>
            <Point title="What your plan will not pay for">
              Each plan&apos;s excluded services are checked against what your family needs, like
              fertility treatment or hearing aids.
            </Point>
            <Point title="Every number traceable">
              The result lists each assumption and the price used for every service, so you can
              see how the answer was reached.
            </Point>
            <Point title="Your answers stay with you">
              No sign-up. Your family&apos;s answers are kept in this browser, not on our servers.
            </Point>
          </ul>
        </div>
      </section>

      <section aria-labelledby="plans-title" className="border-t border-rule">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16">
          <h2 id="plans-title" className="text-3xl font-extrabold">
            Free to compare. $49 a year to stay covered.
          </h2>
          <div className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2">
            <div className="space-y-3 bg-surface p-6">
              <h3 className="text-lg font-bold">Free</h3>
              <p className="text-3xl font-extrabold tabular-nums">$0</p>
              <ul className="list-disc space-y-1.5 pl-5 text-ink-soft">
                <li>Your best option and its expected cost</li>
                <li>How much it saves against the dearest option</li>
              </ul>
            </div>
            <div className="space-y-3 bg-surface p-6">
              <h3 className="text-lg font-bold">MediPlan Annual</h3>
              <p className="text-3xl font-extrabold tabular-nums">
                $49<span className="text-base font-normal text-ink-soft"> a year</span>
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-ink-soft">
                <li>Every option compared, with the bad-year test</li>
                <li>A plan-year tracker that checks each medical bill against your plan</li>
                <li>A fresh comparison when your family or job changes, and at next enrollment</li>
              </ul>
            </div>
          </div>
          <ButtonLink href="/start">Compare my plans</ButtonLink>
        </div>
      </section>

      <footer className="border-t border-rule">
        <p className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-ink-faint">
          MediPlan compares costs from your plan documents and your answers. It is not an insurance
          broker and does not give medical advice.
        </p>
      </footer>
    </main>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="space-y-1.5">
      <h3 className="font-bold">{title}</h3>
      <p className="text-ink-soft">{children}</p>
    </li>
  );
}
