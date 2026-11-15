import { ButtonLink } from "@/components/ui/button";
import { stagger } from "@/components/ui/motion";
import { YearExplorer } from "@/components/landing/year-explorer";
import { AnswerArt, FamilyArt, PlansArt } from "@/components/landing/step-art";
import { HeroOrnaments } from "@/components/landing/hero-ornaments";

const STEPS = [
  { title: "Add your plans", body: "Upload the PDFs from both jobs, or try samples.", Art: PlansArt },
  { title: "Describe your family", body: "Who needs coverage and how much care you expect.", Art: FamilyArt },
  { title: "Get the answer", body: "The cheapest safe way to cover everyone, in dollars.", Art: AnswerArt },
];

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <section aria-labelledby="hero-title" className="landing-hero mx-auto w-full max-w-3xl px-4 pt-14 pb-14 sm:pt-24">
        <HeroOrnaments />
        <p style={stagger(0)} className="enter text-sm font-semibold text-ink-soft">
          Open enrollment: your choice locks in for a year
        </p>
        <h1
          id="hero-title"
          style={stagger(1)}
          className="enter mt-3 text-4xl leading-[1.05] font-extrabold sm:text-6xl"
        >
          Which health plan should cover each person in your family?
        </h1>
        <p style={stagger(2)} className="enter mt-5 max-w-prose text-lg text-ink-soft">
          Upload the plan summaries from both jobs. We find the cheapest way to cover everyone, for
          a normal year and a bad one.
        </p>
        <div style={stagger(3)} className="enter mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/start">Compare my plans</ButtonLink>
          <ButtonLink href="/start?sample=1" variant="secondary">
            Try with sample plans
          </ButtonLink>
        </div>
        <p style={stagger(4)} className="enter mt-3 text-sm text-ink-faint">
          About five minutes. No sign-up. The answer is free.
        </p>
      </section>

      <section aria-labelledby="how-title" className="border-t border-rule">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <h2 id="how-title" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map(({ title, body, Art }, i) => (
              <li key={title} className="step-card flex items-center gap-4 sm:block">
                <div className="w-24 shrink-0 sm:w-32">
                  <Art />
                </div>
                <div className="flex gap-3 sm:mt-4">
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-paper tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm text-ink-soft">{body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="why-title" className="border-t border-rule">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
          <h2 id="why-title" className="text-2xl font-extrabold sm:text-3xl">
            The cheapest premium is not always the cheapest year
          </h2>
          <YearExplorer />
        </div>
      </section>

      <footer className="border-t border-rule">
        <p className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-ink-faint">
          MediPlan compares costs from your plan documents and your answers. It is not an insurance
          broker and does not give medical advice. Your answers stay in this browser.
        </p>
      </footer>
    </main>
  );
}
