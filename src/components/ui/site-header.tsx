"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./brand-mark";

const STEPS = [
  { href: "/start", label: "Plans" },
  { href: "/profile", label: "Family" },
  { href: "/result", label: "Result" },
] as const;

/** Wordmark plus the three steps of the flow, so every screen says where you are. */
export function SiteHeader() {
  const pathname = usePathname();
  const current = STEPS.findIndex((s) => pathname.startsWith(s.href));

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight no-underline"
        >
          <BrandMark className="h-5 w-auto" />
          MediPlan
        </Link>
        {current >= 0 && (
          <nav aria-label="Steps">
            <ol className="flex items-center gap-1 text-sm">
              {STEPS.map((step, i) => {
                const state = i === current ? "current" : i < current ? "done" : "todo";
                return (
                  <li key={step.href} className="flex items-center gap-1">
                    {i > 0 && (
                      <span aria-hidden className="mx-1 h-px w-4 bg-rule-strong" />
                    )}
                    <Link
                      href={step.href}
                      aria-current={state === "current" ? "step" : undefined}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 no-underline ${
                        state === "current" ? "font-semibold text-ink" : "text-ink-faint hover:text-ink"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`grid size-5 place-items-center rounded-full text-xs tabular-nums ${
                          state === "current"
                            ? "bg-ink text-paper"
                            : state === "done"
                              ? "bg-save-wash text-save"
                              : "border border-rule-strong"
                        }`}
                      >
                        {i + 1}
                      </span>
                      {step.label}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
}
