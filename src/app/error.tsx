"use client";

import { Button, ButtonLink } from "@/components/ui/button";

/** Shown when a screen fails to render. Saved plans and answers stay in this browser. */
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="space-y-5">
        <h1 className="text-3xl font-extrabold sm:text-4xl">This screen did not load</h1>
        <p className="max-w-prose text-lg text-ink-soft">
          Something went wrong on our side. Your plans and answers are still saved in this
          browser, so trying again usually picks up where you left off.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={() => retry()}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Back to the start
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
