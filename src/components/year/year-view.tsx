"use client";

import { useMemo } from "react";
import { enumerateArrangements, recommend, type Arrangement } from "@/lib/calc";
import { trackYear } from "@/lib/calc/year";
import { REFERENCE_PRICES } from "@/lib/domain/reference-prices";
import { formatUsd } from "@/lib/format";
import { saveSession, type LedgerEntry, type Session } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import { Button, ButtonLink } from "@/components/ui/button";
import { PaidGate } from "@/components/paywall/paywall";
import { Coverage } from "@/components/result/coverage";
import { BillForm } from "./bill-form";
import { BillList } from "./bill-list";
import { planYearFor } from "./calendar";
import { KeyDates } from "./key-dates";
import { PlanProgressList } from "./plan-progress";
import { VisitEstimate } from "./visit-estimate";

export function YearView() {
  const session = useSession();
  const arrangement = useMemo(() => {
    if (!session?.household || !session.chosenArrangementId) return null;
    return (
      enumerateArrangements(session.household, session.plans).find(
        (a) => a.id === session.chosenArrangementId,
      ) ?? null
    );
  }, [session]);

  if (!session) return <p className="text-ink-faint">Loading…</p>;
  if (session.plans.length === 0 || !session.household) {
    return (
      <section className="space-y-5">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Track your plan year</h1>
        <p className="max-w-prose text-lg text-ink-soft">
          Pick your plans first. Then log each medical bill here and we check it against what your
          plan says you owe.
        </p>
        <ButtonLink href={session.plans.length === 0 ? "/start" : "/profile"}>
          {session.plans.length === 0 ? "Add plans" : "Describe your family"}
        </ButtonLink>
      </section>
    );
  }
  return (
    <PaidGate returnPath="/year">
      {arrangement ? (
        <Tracker session={session} arrangement={arrangement} />
      ) : (
        <ChooseArrangement session={session} />
      )}
    </PaidGate>
  );
}

function ChooseArrangement({ session }: { session: Session }) {
  const options = useMemo(() => {
    try {
      const rec = recommend(session.household!, session.plans, REFERENCE_PRICES);
      return { bestId: rec.best.arrangement.id, ranked: rec.ranked };
    } catch {
      return null;
    }
  }, [session]);

  const choose = (id: string) => saveSession({ ...session, chosenArrangementId: id });

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Which option did you enroll in?</h1>
      <p className="max-w-prose text-lg text-ink-soft">
        We track your deductible and check each bill against the plans you actually picked.
      </p>
      {options ? (
        <ol className="divide-y divide-rule border-y border-rule">
          {options.ranked.map((r) => (
            <li
              key={r.arrangement.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">
                  {r.arrangement.label}
                  {r.arrangement.id === options.bestId && (
                    <span className="ml-2 inline-block rounded-full bg-save-wash px-2 py-0.5 align-middle text-xs font-semibold text-save">
                      Recommended
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">Expected {formatUsd(r.costs.expected)} a year</p>
              </div>
              <Button
                variant={r.arrangement.id === options.bestId ? "primary" : "secondary"}
                onClick={() => choose(r.arrangement.id)}
              >
                Track this option
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <ButtonLink href="/start">Review your plans</ButtonLink>
      )}
    </section>
  );
}

function Tracker({ session, arrangement }: { session: Session; arrangement: Arrangement }) {
  const household = session.household!;
  const status = useMemo(() => trackYear(arrangement, session.ledger), [arrangement, session.ledger]);
  const labelOf = (id: string) => household.people.find((p) => p.id === id)?.label ?? "Someone";
  const year = planYearFor(new Date());
  const hasHsa = arrangement.parts.some((p) => p.plan.hsaEligible);

  const owed = status.entries.reduce((sum, e) => sum + e.shouldOwe, 0);
  const overbilled = status.entries.reduce((sum, e) => sum + e.overbilled, 0);

  const addBill = (entry: LedgerEntry) => saveSession({ ...session, ledger: [...session.ledger, entry] });
  const removeBill = (id: string) =>
    saveSession({ ...session, ledger: session.ledger.filter((e) => e.id !== id) });
  const changeOption = () => saveSession({ ...session, chosenArrangementId: null });

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Your {year} plan year</h1>
        <Coverage arrangement={arrangement} labelOf={labelOf} />
        <p className="text-lg text-ink-soft">
          {status.entries.length === 0 ? (
            "No bills logged yet. Add each one as it arrives and we will check it against your plan."
          ) : (
            <>
              {status.entries.length} {status.entries.length === 1 ? "bill" : "bills"} logged. Under
              your plan you owe{" "}
              <strong className="font-bold text-ink tabular-nums">{formatUsd(owed)}</strong> for
              them.
            </>
          )}
        </p>
        {overbilled > 0 && (
          <p className="text-xl font-semibold">
            <span className="marker">{formatUsd(overbilled)} may be overcharged.</span> The bills
            marked below ask for more than your plan&apos;s share.
          </p>
        )}
      </section>

      <PlanProgressList plans={status.plans} labelOf={labelOf} />

      <section aria-labelledby="bills-title" className="space-y-5">
        <h2 id="bills-title" className="text-xl font-bold">
          Medical bills
        </h2>
        <BillForm people={household.people} onAdd={addBill} />
        <BillList entries={status.entries} labelOf={labelOf} onRemove={removeBill} />
      </section>

      <VisitEstimate arrangement={arrangement} ledger={session.ledger} people={household.people} />

      <KeyDates year={year} hasHsa={hasHsa} />

      <p className="text-sm text-ink-faint">
        Enrolled in a different option?{" "}
        <button type="button" onClick={changeOption} className="cursor-pointer font-semibold text-ink underline">
          Change it
        </button>
      </p>
    </div>
  );
}
