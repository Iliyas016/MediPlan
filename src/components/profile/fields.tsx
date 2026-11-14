"use client";

import { useId, type ReactNode } from "react";
import type { YesNo } from "./household-draft";

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950";

export function NumberField({
  label,
  hint,
  value,
  onChange,
  prefix,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-zinc-500">
          {hint}
        </p>
      )}
      <div className="flex items-center gap-2">
        {prefix && <span className="text-zinc-500">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} w-32`}
        />
      </div>
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-zinc-500">
          {hint}
        </p>
      )}
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} w-full max-w-xs`}
      />
    </div>
  );
}

/** Segmented choice built on radio inputs, so it works with a keyboard and screen readers. */
export function ChoiceField<T extends string>({
  legend,
  hint,
  value,
  options,
  onChange,
}: {
  legend: string;
  hint?: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {hint && <p className="text-sm text-zinc-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-400 ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const YES_NO: { value: Exclude<YesNo, "">; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** A yes/no gate; the follow-up questions render only after "Yes". */
export function GateField({
  legend,
  hint,
  value,
  onChange,
  children,
}: {
  legend: string;
  hint?: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <ChoiceField legend={legend} hint={hint} value={value} options={YES_NO} onChange={onChange} />
      {value === "yes" && (
        <div className="space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">{children}</div>
      )}
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-zinc-900 dark:accent-white"
      />
      <span>{label}</span>
    </label>
  );
}
