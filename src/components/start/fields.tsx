"use client";

import { useId, type ReactNode } from "react";

export const inputClass =
  "rounded-lg border border-rule-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-faint aria-invalid:border-risk";

/** Highlight state of one field: needs a second look, or cannot be saved yet. */
export interface FieldState {
  warn?: boolean;
  error?: string;
}

/**
 * Label, hint and messages around one input. A field the document reader was
 * unsure about, or could not find, gets a wash and a "Check this" note.
 */
export function Field({
  label,
  hint,
  state,
  children,
}: {
  label: string;
  hint?: string;
  state?: FieldState;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const noteId = `${id}-note`;
  const describedBy = [hint && hintId, (state?.error || state?.warn) && noteId].filter(Boolean).join(" ") || undefined;
  return (
    <div
      className={`space-y-1 ${state?.warn ? "-mx-2 rounded-lg bg-risk-wash px-2 py-2" : ""}`}
      data-field-error={state?.error ? "true" : undefined}
    >
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-ink-faint">
          {hint}
        </p>
      )}
      {children({ id, describedBy, invalid: Boolean(state?.error) })}
      <FieldNote id={noteId} state={state} />
    </div>
  );
}

export function FieldNote({ id, state }: { id?: string; state?: FieldState }) {
  if (state?.error) {
    return (
      <p id={id} className="text-sm font-medium text-risk">
        {state.error}
      </p>
    );
  }
  if (state?.warn) {
    return (
      <p id={id} className="text-sm text-risk">
        Check this against your document.
      </p>
    );
  }
  return null;
}

export function AmountField({
  label,
  hint,
  value,
  onChange,
  state,
  suffix,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  state?: FieldState;
  suffix?: string;
}) {
  return (
    <Field label={label} hint={hint} state={state}>
      {({ id, describedBy, invalid }) => (
        <div className="flex items-center gap-2">
          <span className="text-ink-faint">$</span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} w-32`}
          />
          {suffix && <span className="text-sm text-ink-faint">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

export function TextField({
  label,
  value,
  onChange,
  state,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  state?: FieldState;
}) {
  return (
    <Field label={label} state={state}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} w-full`}
        />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  state,
}: {
  label: string;
  hint?: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  state?: FieldState;
}) {
  return (
    <Field label={label} hint={hint} state={state}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          value={value}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value as T)}
          className={`${inputClass} w-full max-w-xs`}
        >
          <option value="" disabled>
            Choose…
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
