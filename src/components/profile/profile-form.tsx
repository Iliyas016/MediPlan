"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveSession({ ...session, household: buildHousehold(draft) });
    router.push("/result");
  };

  return (
    <form onSubmit={submit} className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Tell us about your family</h1>
        <p className="max-w-prose text-lg text-ink-soft">
          The cheapest plan depends on how much care your family uses. Skip anything you are not
          sure about: we will use a typical value and show it next to your result.
        </p>
        <p className="text-sm text-ink-faint">
          Your answers stay in this browser. We ask how much care you expect, never about
          diagnoses.
        </p>
        {session.plans.length === 0 && (
          <p className="rounded-lg bg-risk-wash px-4 py-3 text-sm">
            You have not added any plans yet.{" "}
            <Link href="/start" className="font-medium underline underline-offset-4">
              Add your plans
            </Link>{" "}
            to see a result.
          </p>
        )}
      </header>

      <section aria-labelledby="who-title" className="space-y-5">
        <h2 id="who-title" className="text-xl font-bold">
          Who needs coverage?
        </h2>
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
            You added plans from your partner&apos;s employer. Include your partner to compare
            them.
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

      <section aria-labelledby="care-title" className="space-y-5">
        <div className="space-y-1">
          <h2 id="care-title" className="text-xl font-bold">
            Care you expect next year
          </h2>
          <p className="text-sm text-ink-faint">A rough guess is fine. Last year is a good guide.</p>
        </div>
        {activePeople(draft).map(({ person, fallbackName }) => (
          <PersonCard
            key={person.id}
            person={person}
            fallbackName={fallbackName}
            onChange={(patch) => updatePerson(person.id, patch)}
          />
        ))}
      </section>

      <section aria-labelledby="money-title" className="space-y-5">
        <h2 id="money-title" className="text-xl font-bold">
          If something goes wrong
        </h2>
        <NumberField
          label="How much could you pay from savings if a large medical bill arrived tomorrow?"
          hint="We will not recommend a plan whose bad year you could not afford."
          prefix="$"
          value={draft.savings}
          onChange={(v) => update({ savings: v })}
        />
      </section>

      <section aria-labelledby="services-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="services-title" className="text-xl font-bold">
            Will anyone need any of these?
          </h2>
          <p className="text-sm text-ink-faint">
            Many plans do not cover them. We check each plan&apos;s list of excluded services.
          </p>
        </div>
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
      </section>

      <section aria-labelledby="doctors-title" className="space-y-3">
        <h2 id="doctors-title" className="text-xl font-bold">
          Doctors you want to keep
        </h2>
        <p className="text-sm text-ink-faint">
          Plans only pay their prices inside their network. We will remind you which directories to
          check.
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
      </section>

      <Button type="submit" className="w-full sm:w-auto">
        See my best option
      </Button>
    </form>
  );
}
