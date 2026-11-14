"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { saveSession, type Session } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import { Button } from "@/components/ui/button";
import { CheckboxField, ChoiceField, NumberField } from "./fields";
import {
  activePeople,
  buildHousehold,
  emptyHouseholdDraft,
  resizeChildren,
  SPECIAL_SERVICES,
  type HouseholdDraft,
  type PersonDraft,
} from "./household-draft";
import { PersonCard } from "./person-card";

const DRAFT_KEY = "mediplan.profile-draft.v1";

const STEPS = ["Who needs coverage?", "How much care do you expect?", "If something goes wrong"];

function loadDraft(fallback: HouseholdDraft): HouseholdDraft {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<HouseholdDraft>) } : fallback;
  } catch {
    return fallback;
  }
}

function saveDraft(draft: HouseholdDraft): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // The answers still live in memory for this visit.
  }
}

export function ProfileForm() {
  const session = useSession();
  if (!session) return <p className="text-ink-faint">Loading…</p>;
  return <ProfileFormLoaded session={session} />;
}

function ProfileFormLoaded({ session }: { session: Session }) {
  const router = useRouter();
  const hasPartnerPlans = session.plans.some((p) => p.employer === "B");
  const [draft, setDraft] = useState<HouseholdDraft>(() =>
    loadDraft(emptyHouseholdDraft(hasPartnerPlans)),
  );
  const childCountId = useId();
  const [step, setStep] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const stepRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const update = (patch: Partial<HouseholdDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const updatePerson = (id: string, patch: Partial<PersonDraft>) =>
    setDraft((d) => {
      if (id === d.you.id) return { ...d, you: { ...d.you, ...patch } };
      if (id === d.partner.id) return { ...d, partner: { ...d.partner, ...patch } };
      return { ...d, children: d.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    });

  const toggleService = (needle: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      neededServicesAnswered: true,
      neededServices: on
        ? [...d.neededServices.filter((n) => n !== needle), needle]
        : d.neededServices.filter((n) => n !== needle),
    }));

  const finish = () => {
    saveSession({ ...session, household: buildHousehold(draft) });
    router.push("/result");
  };

  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      stepRef.current?.focus();
    });
  };

  // Enter in any field moves to the next step; only the last step submits.
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < STEPS.length - 1) goTo(step + 1);
    else finish();
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-ink-faint">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 ref={stepRef} tabIndex={-1} className="text-3xl font-extrabold outline-none sm:text-4xl">
          {STEPS[step]}
        </h1>
        {step === 0 && (
          <p className="max-w-prose text-ink-soft">
            Skip anything you are not sure about: we use a typical value and show it with your
            result. Your answers stay in this browser.
          </p>
        )}
        {step === 0 && session.plans.length === 0 && (
          <p className="rounded-lg bg-risk-wash px-4 py-3 text-sm">
            You have not added any plans yet.{" "}
            <Link href="/start" className="font-medium underline underline-offset-4">
              Add your plans
            </Link>{" "}
            to see a result.
          </p>
        )}
      </header>

      {step === 0 && (
        <section aria-label="Who needs coverage" className="space-y-6">
          <ChoiceField
            legend="Adults"
            value={draft.hasPartner ? "couple" : "single"}
            options={[
              { value: "single", label: "Just me" },
              { value: "couple", label: "Me and my spouse or partner" },
            ]}
            onChange={(v) => update({ hasPartner: v === "couple" })}
          />
          {hasPartnerPlans && !draft.hasPartner && (
            <p className="text-sm text-risk">
              You added plans from your partner’s employer. Include your partner to compare them.
            </p>
          )}
          <div className="space-y-1">
            <label htmlFor={childCountId} className="block text-sm font-medium">
              Children
            </label>
            <select
              id={childCountId}
              value={draft.children.length}
              onChange={(e) => update({ children: resizeChildren(draft.children, Number(e.target.value)) })}
              className="rounded-lg border border-rule-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-faint"
            >
              {Array.from({ length: 9 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Care you expect next year" className="space-y-5">
          <p className="text-ink-soft">A rough guess is fine. Last year is a good guide. We never ask about diagnoses.</p>
          {activePeople(draft).map(({ person, fallbackName }) => (
            <PersonCard
              key={person.id}
              person={person}
              fallbackName={fallbackName}
              onChange={(patch) => updatePerson(person.id, patch)}
            />
          ))}
        </section>
      )}

      {step === 2 && (
        <section aria-label="If something goes wrong" className="space-y-6">
          <NumberField
            label="How much could you pay from savings if a large medical bill arrived tomorrow?"
            hint="We will not recommend a plan whose bad year you could not afford."
            prefix="$"
            value={draft.savings}
            onChange={(v) => update({ savings: v })}
          />

          <div className="space-y-6">
            <button
              type="button"
              aria-expanded={showMore}
              onClick={() => setShowMore((open) => !open)}
              className="cursor-pointer text-sm font-medium underline underline-offset-4"
            >
              {showMore ? "Hide the optional questions" : "More (optional): special services and doctors"}
            </button>
            {showMore && (
              <div className="space-y-8 border-t border-rule pt-6">
                <fieldset className="space-y-3">
                  <legend className="font-bold">Will anyone need any of these?</legend>
                  <p className="text-sm text-ink-faint">Many plans do not cover them. We check each plan’s exclusions.</p>
                  <div className="space-y-2">
                    {SPECIAL_SERVICES.map((s) => (
                      <CheckboxField
                        key={s.needle}
                        label={s.label}
                        checked={draft.neededServices.includes(s.needle)}
                        onChange={(on) => toggleService(s.needle, on)}
                      />
                    ))}
                    <CheckboxField
                      label="None of these"
                      checked={draft.neededServicesAnswered && draft.neededServices.length === 0}
                      onChange={(on) => update({ neededServicesAnswered: on, neededServices: [] })}
                    />
                  </div>
                </fieldset>

                <div className="space-y-3">
                  <h2 id="doctors-title" className="font-bold">
                    Doctors you want to keep
                  </h2>
                  <p className="text-sm text-ink-faint">
                    Plans only pay their prices inside their network. We will remind you which
                    directories to check.
                  </p>
                  <textarea
                    aria-labelledby="doctors-title"
                    value={draft.providers}
                    disabled={draft.noProviders}
                    placeholder="For example: Dr. Lee, Children's Hospital"
                    onChange={(e) => update({ providers: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-rule-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-faint disabled:opacity-50"
                  />
                  <CheckboxField
                    label="No specific doctors"
                    checked={draft.noProviders}
                    onChange={(on) => update({ noProviders: on, providers: on ? "" : draft.providers })}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => goTo(step - 1)}>
            Back
          </Button>
        )}
        <Button type="submit" className="flex-1 sm:flex-none">
          {step < STEPS.length - 1 ? "Next" : "See my best option"}
        </Button>
        {step < STEPS.length - 1 && (
          <button type="button" onClick={finish} className="cursor-pointer text-sm font-medium text-ink-soft underline underline-offset-4">
            Skip the rest and see my result
          </button>
        )}
      </div>
    </form>
  );
}
