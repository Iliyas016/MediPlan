"use client";

import { useState } from "react";
import { CheckboxField, GateField, NumberField, TextField } from "./fields";
import type { PersonDraft } from "./household-draft";

/** Expected care for one person. Asks how much care, never about diagnoses. */
export function PersonCard({
  person,
  fallbackName,
  onChange,
}: {
  person: PersonDraft;
  fallbackName: string;
  onChange: (patch: Partial<PersonDraft>) => void;
}) {
  const isAdult = person.role !== "child";
  const name = person.name.trim() || fallbackName;
  const subject = person.role === "adultA" && !person.name.trim() ? "you" : name;
  const does = subject === "you" ? "do you" : `does ${subject}`;
  const will = subject === "you" ? "you" : subject;
  const [showAbout, setShowAbout] = useState(Boolean(person.name || person.age));

  return (
    <section
      aria-label={name}
      className="space-y-5 rounded-xl border border-rule bg-surface p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-bold">{name}</h3>
        {!showAbout && (
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="cursor-pointer text-sm text-ink-soft underline underline-offset-4"
          >
            Add a name and age
          </button>
        )}
      </div>

      {showAbout && (
        <div className="flex flex-wrap gap-4">
          <TextField
            label="Name (optional)"
            value={person.name}
            placeholder={fallbackName}
            onChange={(v) => onChange({ name: v })}
          />
          <NumberField label="Age" value={person.age} onChange={(v) => onChange({ age: v })} />
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <NumberField
          label="Doctor visits a year"
          hint="Sick visits, not the free annual check-up."
          value={person.doctorVisits}
          placeholder="2"
          onChange={(v) => onChange({ doctorVisits: v })}
        />
        <NumberField
          label="Urgent care visits a year"
          value={person.urgentCareVisits}
          placeholder="0"
          onChange={(v) => onChange({ urgentCareVisits: v })}
        />
      </div>

      <GateField
        legend={`${capitalize(does)} take prescriptions every month?`}
        value={person.prescriptions}
        onChange={(v) => onChange({ prescriptions: v })}
      >
        <p className="text-sm text-ink-faint">How many different prescriptions of each kind?</p>
        <div className="flex flex-wrap gap-4">
          <NumberField
            label="Generic"
            value={person.genericRx}
            placeholder="0"
            onChange={(v) => onChange({ genericRx: v })}
          />
          <NumberField
            label="Brand-name"
            value={person.brandRx}
            placeholder="0"
            onChange={(v) => onChange({ brandRx: v })}
          />
          <NumberField
            label="Specialty"
            hint="Injectables and other high-cost drugs."
            value={person.specialtyRx}
            placeholder="0"
            onChange={(v) => onChange({ specialtyRx: v })}
          />
        </div>
      </GateField>

      <GateField
        legend={`${capitalize(does)} see a specialist, therapist or physical therapist regularly?`}
        value={person.ongoingCare}
        onChange={(v) => onChange({ ongoingCare: v })}
      >
        <p className="text-sm text-ink-faint">Visits a year for each.</p>
        <div className="flex flex-wrap gap-4">
          <NumberField
            label="Specialist"
            value={person.specialistVisits}
            placeholder="0"
            onChange={(v) => onChange({ specialistVisits: v })}
          />
          <NumberField
            label="Therapy"
            value={person.therapySessions}
            placeholder="0"
            onChange={(v) => onChange({ therapySessions: v })}
          />
          <NumberField
            label="Physical therapy"
            value={person.physicalTherapySessions}
            placeholder="0"
            onChange={(v) => onChange({ physicalTherapySessions: v })}
          />
        </div>
      </GateField>

      <GateField
        legend={`Is anything planned for ${will} next year?`}
        value={person.plannedCare}
        onChange={(v) => onChange({ plannedCare: v })}
      >
        <div className="space-y-2">
          {isAdult && (
            <CheckboxField
              label="Having a baby"
              checked={person.plannedBaby}
              onChange={(v) => onChange({ plannedBaby: v })}
            />
          )}
          <CheckboxField
            label="A surgery or procedure"
            checked={person.plannedSurgery}
            onChange={(v) => onChange({ plannedSurgery: v })}
          />
          <CheckboxField
            label="A CT or MRI scan"
            checked={person.plannedScan}
            onChange={(v) => onChange({ plannedScan: v })}
          />
        </div>
      </GateField>
    </section>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
