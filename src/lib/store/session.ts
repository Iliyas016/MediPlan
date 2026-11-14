import type { Plan } from "../domain/plan";
import type { Household } from "../domain/profile";

/**
 * The whole working state of one visitor. There are no accounts: it lives in
 * the visitor's browser only, which also keeps health details off our server.
 */
export interface Session {
  plans: Plan[];
  household: Household | null;
}

const KEY = "mediplan.session.v1";
const EMPTY: Session = { plans: [], household: null };

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
