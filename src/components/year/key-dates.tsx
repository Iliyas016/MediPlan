"use client";

import { Button } from "@/components/ui/button";
import { buildIcs, keyDates } from "./calendar";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

/** The dates that matter this plan year, downloadable into any calendar. */
export function KeyDates({ year, hasHsa }: { year: number; hasHsa: boolean }) {
  const dates = keyDates(year, hasHsa);

  const download = () => {
    const blob = new Blob([buildIcs(dates, new Date())], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mediplan-${year}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="dates-title" className="space-y-4">
      <h2 id="dates-title" className="text-xl font-bold">
        Dates to remember
      </h2>
      <dl className="divide-y divide-rule border-y border-rule">
        {dates.map((d) => (
          <div key={d.date} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-semibold tabular-nums">{dateFormat.format(new Date(`${d.date}T00:00:00Z`))}</dt>
            <dd>
              <span className="font-medium">{d.title}.</span>{" "}
              <span className="text-ink-soft">{d.description}</span>
            </dd>
          </div>
        ))}
      </dl>
      <Button variant="secondary" onClick={download}>
        Add these dates to my calendar
      </Button>
    </section>
  );
}
