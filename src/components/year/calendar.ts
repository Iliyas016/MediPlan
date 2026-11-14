export interface KeyDate {
  /** ISO date, e.g. "2027-11-01". */
  date: string;
  title: string;
  description: string;
}

/**
 * The plan year the family is choosing or living in. From September on,
 * people are enrolling for next year.
 */
export function planYearFor(today: Date): number {
  return today.getMonth() >= 8 ? today.getFullYear() + 1 : today.getFullYear();
}

export function keyDates(year: number, hasHsa: boolean): KeyDate[] {
  const dates: KeyDate[] = [
    {
      date: `${year}-01-01`,
      title: "Your health plan year starts",
      description: "Deductibles and out-of-pocket limits start again from zero. Log each medical bill in MediPlan as it arrives.",
    },
    {
      date: `${year}-07-01`,
      title: "Mid-year check on your health plan",
      description: "Open MediPlan, log any bills you have not added and see how close you are to your deductible.",
    },
    {
      date: `${year}-11-01`,
      title: "Open enrollment: compare plans for next year",
      description: "Your employers send next year's plans around now. Rerun MediPlan with the new plan summaries before your deadline.",
    },
    {
      date: `${year}-12-15`,
      title: "Plan year ends soon",
      description: "Your deductible resets on January 1. If you have met it, care booked before then may cost you less.",
    },
  ];
  if (hasHsa) {
    dates.splice(1, 0, {
      date: `${year}-04-15`,
      title: `Last day to add HSA money for ${year - 1}`,
      description: "Contributions for last year count until the tax filing deadline.",
    });
  }
  return dates;
}

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function compact(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** An iCalendar file with one all-day event per date. */
export function buildIcs(dates: KeyDate[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MediPlan//Plan year//EN",
    "CALSCALE:GREGORIAN",
    ...dates.flatMap((d) => [
      "BEGIN:VEVENT",
      `UID:${compact(d.date)}-${compact(d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}@mediplan`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(d.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(d.date))}`,
      `SUMMARY:${escape(d.title)}`,
      `DESCRIPTION:${escape(d.description)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
