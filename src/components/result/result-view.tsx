"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { recommend, type Recommendation } from "@/lib/calc";
import { REFERENCE_PRICES } from "@/lib/domain/reference-prices";
import { formatUsd } from "@/lib/format";
import { saveSession, type Session } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import { Button, ButtonLink } from "@/components/ui/button";
import { PaidGate } from "@/components/paywall/paywall";
import { AssumptionList } from "./assumption-list";
import { Coverage } from "./coverage";
import { OptionList } from "./option-list";
import { PricingNotes } from "./pricing-notes";
import { ScenarioLedger } from "./scenario-ledger";

type Outcome =
  | { kind: "loading" }
  | { kind: "missing-plans" }
  | { kind: "missing-profile" }
  | { kind: "no-valid-option" }
  | { kind: "ready"; session: Session; rec: Recommendation };

function evaluate(session: Session | null): Outcome {
  if (!session) return { kind: "loading" };
  if (session.plans.length === 0) return { kind: "missing-plans" };
  if (!session.household) return { kind: "missing-profile" };
  try {
    return { kind: "ready", session, rec: recommend(session.household, session.plans, REFERENCE_PRICES) };
  } catch {
    return { kind: "no-valid-option" };
  }
}

export function ResultView() {
  const session = useSession();
  const outcome = useMemo(() => evaluate(session), [session]);

  switch (outcome.kind) {
    case "loading":
      return <p className="text-ink-faint">Calculating…</p>;
    case "missing-plans":
      return (
        <EmptyState
          title="Add your health plans first"
          body="We compare the plans your employer offers. Upload their plan summaries or enter the numbers by hand."
          href="/start"
          action="Add plans"
        />
      );
    case "missing-profile":
      return (
        <EmptyState
          title="Tell us about your family"
          body="Who needs coverage and how much care you expect decides which plan is cheapest."
          href="/profile"
          action="Describe your family"
        />
      );
    case "no-valid-option":
      return (
        <EmptyState
          title="None of these plans covers everyone"
          body="Each way of covering your family needs a premium for the right coverage level, for example employee plus children. Fill in the premiums for every level your employer offers."
          href="/start"
          action="Review premiums"
        />
      );
    case "ready":
      return <Verdict session={outcome.session} rec={outcome.rec} />;
  }
}

function Verdict({ session, rec }: { session: Session; rec: Recommendation }) {
  const router = useRouter();
  const household = session.household!;
  const labelOf = (id: string) => household.people.find((p) => p.id === id)?.label ?? "Someone";
  const inSentence = (id: string) => {
    const label = labelOf(id);
    return label === "You" ? "you" : label;
  };
  const best = rec.best;
  const cheapest = rec.ranked[0];
  const providers = household.mustKeepProviders.value;

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Your best option</h1>
        <Coverage arrangement={best.arrangement} labelOf={labelOf} />
        <div className="space-y-2">
          <p className="text-lg text-ink-soft">
            Expected cost next year{" "}
            <strong className="block text-5xl font-extrabold tracking-tight text-ink tabular-nums">
              {formatUsd(best.costs.expected)}
            </strong>
          </p>
          <p className="text-ink-soft">
            Includes {formatUsd(best.premiums)} in premiums, after any employer HSA money.
          </p>
        </div>
        {rec.savingsVsWorst > 0 && (
          <p className="text-xl font-semibold">
            <span className="marker">{formatUsd(rec.savingsVsWorst)} a year less</span> than the most
            expensive way to cover your family.
          </p>
        )}
        {best !== cheapest && (
          <p className="max-w-prose text-ink-soft">
            {cheapest.arrangement.label} is {formatUsd(best.costs.expected - cheapest.costs.expected)}{" "}
            cheaper in an expected year. But a bad year on it would cost{" "}
            {formatUsd(cheapest.costs.bad)}, and the extra {formatUsd(cheapest.badYearShock)} is more
            than your savings cover. This option keeps a bad year at {formatUsd(best.costs.bad)}.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          <Button
            onClick={() => {
              saveSession({ ...session, chosenArrangementId: best.arrangement.id });
              router.push("/year");
            }}
          >
            Enroll in this and track my year
          </Button>
          <p className="text-sm text-ink-soft">Check every medical bill against your plan.</p>
        </div>
      </section>

      {(best.flags.length > 0 || providers.length > 0) && (
        <section aria-labelledby="enroll-title" className="space-y-3 rounded-xl bg-risk-wash p-5">
          <h2 id="enroll-title" className="text-lg font-bold">
            Before you enroll
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-risk">
            {best.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
            {providers.length > 0 && (
              <li>
                Prices assume in-network care. Look up {providers.join(", ")} in the provider
                directory of {best.arrangement.parts.map((p) => p.plan.name).join(" and ")}.
              </li>
            )}
          </ul>
        </section>
      )}

      <PaidGate
        returnPath="/result"
        teaser={`We priced ${rec.ranked.length} ${rec.ranked.length === 1 ? "way" : "ways"} to cover your family. See each one side by side, and what a bad year would cost on every plan.`}
      >
        <div className="space-y-12">
          <ScenarioLedger result={best} badYearName={inSentence(best.badYearPersonId)} />
          <OptionList ranked={rec.ranked} bestId={best.arrangement.id} />
        </div>
      </PaidGate>

      <AssumptionList assumptions={rec.assumptions} />

      <PricingNotes />

      <p className="max-w-prose text-sm text-ink-faint">
        MediPlan compares costs from your plan documents and your answers. It is not insurance or
        medical advice. Confirm your doctors are in network and your prescriptions are on each
        plan&apos;s drug list before you enroll.
      </p>
    </div>
  );
}

function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="max-w-prose text-lg text-ink-soft">{body}</p>
      <ButtonLink href={href}>{action}</ButtonLink>
    </section>
  );
}
