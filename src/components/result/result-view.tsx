"use client";

import Link from "next/link";
import { useMemo } from "react";
import { recommend, type Recommendation } from "@/lib/calc";
import { REFERENCE_PRICES } from "@/lib/domain/reference-prices";
import { formatUsd } from "@/lib/format";
import type { Session } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import { AssumptionList } from "./assumption-list";
import { OptionList } from "./option-list";
import { PricingNotes } from "./pricing-notes";
import { ScenarioCards } from "./scenario-cards";

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
      return <p className="text-zinc-500">Calculating…</p>;
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
          body="Each way of covering your family needs a premium for the right coverage level, for example employee plus children. Check that the premiums are filled in for every level your employer offers."
          href="/start"
          action="Review premiums"
        />
      );
    case "ready":
      return <Verdict session={outcome.session} rec={outcome.rec} />;
  }
}

function Verdict({ session, rec }: { session: Session; rec: Recommendation }) {
  const household = session.household!;
  const nameOf = (id: string) => {
    const label = household.people.find((p) => p.id === id)?.label ?? "one of you";
    return label === "You" ? "you" : label;
  };
  const best = rec.best;
  const cheapest = rec.ranked[0];
  const providers = household.mustKeepProviders.value;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Your best option</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {best.arrangement.label}
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">
          Expected cost next year:{" "}
          <strong className="font-semibold text-zinc-950 dark:text-white">
            {formatUsd(best.costs.expected)}
          </strong>
          , including {formatUsd(best.premiums)} in premiums.
        </p>
        {rec.savingsVsWorst > 0 && (
          <p className="inline-block rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            About {formatUsd(rec.savingsVsWorst)} a year less than the most expensive way to cover
            your family.
          </p>
        )}
        {best !== cheapest && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {cheapest.arrangement.label} is {formatUsd(best.costs.expected - cheapest.costs.expected)}{" "}
            cheaper in an expected year. But a bad year on it would cost{" "}
            {formatUsd(cheapest.costs.bad)}, and the extra {formatUsd(cheapest.badYearShock)} is more
            than your savings cover. This option keeps a bad year at {formatUsd(best.costs.bad)}.
          </p>
        )}
      </section>

      <ScenarioCards result={best} badYearName={nameOf(best.badYearPersonId)} />

      {best.flags.length > 0 && (
        <section aria-labelledby="flags-title" className="space-y-2">
          <h2 id="flags-title" className="text-lg font-semibold">
            Before you enroll
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
            {best.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </section>
      )}

      {providers.length > 0 && (
        <section aria-labelledby="network-title" className="space-y-2">
          <h2 id="network-title" className="text-lg font-semibold">
            Check your doctors
          </h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            Prices above assume in-network care. Before you enroll, look up{" "}
            {providers.join(", ")} in the provider directory of{" "}
            {best.arrangement.parts.map((p) => p.plan.name).join(" and ")}.
          </p>
        </section>
      )}

      <OptionList ranked={rec.ranked} bestId={best.arrangement.id} />

      <AssumptionList assumptions={rec.assumptions} />

      <PricingNotes />

      <p className="text-sm text-zinc-500">
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
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">{body}</p>
      <Link
        href={href}
        className="inline-block rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {action}
      </Link>
    </section>
  );
}
