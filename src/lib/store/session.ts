import type { Plan, ServiceKey } from "../domain/plan";
import type { Household } from "../domain/profile";

/** One bill or visit the family logged during the plan year. */
export interface LedgerEntry {
  id: string;
  /** ISO date, e.g. "2027-02-14". */
  date: string;
  personId: string;
  service: ServiceKey;
  /** In-network allowed amount shown on the insurer's statement. */
  allowed: number;
  /** What the provider asked the family to pay, if they have the bill. */
  billed: number | null;
}

/**
 * The whole working state of one visitor. There are no accounts: it lives in
 * the visitor's browser only, which also keeps health details off our server.
 */
export interface Session {
  plans: Plan[];
  household: Household | null;
  /** `Arrangement.id` the family went with; drives the plan-year tracker. */
  chosenArrangementId: string | null;
  ledger: LedgerEntry[];
  /** Set only after the server has verified a completed checkout. */
  paid: boolean;
}

const KEY = "mediplan.session.v1";
const EMPTY: Session = {
  plans: [],
  household: null,
  chosenArrangementId: null,
  ledger: [],
  paid: false,
};

export function loadSession(): Session {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Session>) } : EMPTY;
  } catch {
    // Private mode or blocked storage: the app still works for this visit.
    return EMPTY;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Nothing to do: state stays in memory for this visit.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
