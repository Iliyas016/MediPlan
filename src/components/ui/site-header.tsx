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
    // Frosted glass: the page scrolls under the header, so the steps stay in
    // reach on long screens. Opaque enough that text on it keeps its contrast.
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur-md backdrop-saturate-150">
      <a
        href="#main"
        className="sr-only rounded-md bg-ink px-4 py-2 font-semibold text-paper focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10"
      >
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link
          href="/"
          translate="no"
          className="flex items-center gap-2 py-2 text-lg font-extrabold tracking-tight no-underline"
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
