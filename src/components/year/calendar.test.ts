import { describe, expect, it } from "vitest";
import { buildIcs, keyDates, planYearFor } from "./calendar";

describe("planYearFor", () => {
  it("looks at next year from September, during enrollment season", () => {
    expect(planYearFor(new Date(2026, 10, 14))).toBe(2027);
    expect(planYearFor(new Date(2027, 2, 1))).toBe(2027);
  });
});

describe("keyDates", () => {
  it("adds the HSA deadline only for HSA plans", () => {
    expect(keyDates(2027, false).some((d) => d.title.includes("HSA"))).toBe(false);
    expect(keyDates(2027, true).map((d) => d.date)).toEqual([
      "2027-01-01",
      "2027-04-15",
      "2027-07-01",
      "2027-11-01",
      "2027-12-15",
    ]);
  });
});

describe("buildIcs", () => {
  it("writes valid all-day events with escaped text", () => {
    const ics = buildIcs(
      [{ date: "2027-12-31", title: "Ends, soon", description: "Line one\nline two; done" }],
      new Date("2026-11-14T12:00:00.000Z"),
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20271231\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20280101\r\n");
    expect(ics).toContain("SUMMARY:Ends\\, soon\r\n");
    expect(ics).toContain("DESCRIPTION:Line one\\nline two\\; done\r\n");
    expect(ics).toContain("DTSTAMP:20261114T120000Z\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
