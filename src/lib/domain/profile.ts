import type { ServiceKey } from "./plan";

/**
 * Every profile value carries where it came from, so the verdict can list
 * what the user told us versus what we assumed. Nothing is filled in silently.
 */
export type FieldStatus = "answered" | "assumed" | "unknown";

export interface Field<T> {
  value: T;
  status: FieldStatus;
  /** Shown next to the verdict when status is not "answered". */
  note?: string;
}

export const answered = <T>(value: T): Field<T> => ({ value, status: "answered" });
export const assumed = <T>(value: T, note: string): Field<T> => ({
  value,
  status: "assumed",
  note,
});

export type PersonRole = "adultA" | "adultB" | "child";

/** One line of expected care for one person in the coming plan year. */
export interface CareItem {
  service: ServiceKey;
  timesPerYear: number;
  /**
   * true: happens every year no matter what (chronic medication, regular
   * specialist). false: likely but not certain (a planned procedure, sports
   * injuries). The "good year" scenario keeps only recurring items.
   */
  recurring: boolean;
  /** Free-text origin, e.g. "asthma inhaler, monthly". */
  label?: string;
}

export interface Person {
  id: string;
  role: PersonRole;
  label: string;
  age: Field<number>;
  care: Field<CareItem[]>;
}

export interface Household {
  /** Exactly one adultA, at most one adultB, any number of children. */
  people: Person[];
  /** Cash the family could put toward a surprise medical bill. */
  emergencySavings: Field<number>;
  /** Doctors or hospitals the family will not give up. Network check is manual for now. */
  mustKeepProviders: Field<string[]>;
  /** Services the family knows it needs, checked against each plan's exclusions. */
  neededServices: Field<string[]>;
}

/** Every non-answered field, for the "based on these assumptions" list. */
export function listAssumptions(household: Household): { path: string; note: string }[] {
  const out: { path: string; note: string }[] = [];
  const check = (path: string, field: Field<unknown>) => {
    if (field.status !== "answered") {
      out.push({ path, note: field.note ?? "No answer given; a default was used." });
    }
  };
  check("emergencySavings", household.emergencySavings);
  check("mustKeepProviders", household.mustKeepProviders);
  check("neededServices", household.neededServices);
  for (const person of household.people) {
    check(`${person.label}.age`, person.age);
    check(`${person.label}.care`, person.care);
  }
  return out;
}
