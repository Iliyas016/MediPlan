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
const CHANGE_EVENT = "mediplan:session-change";
const EMPTY: Session = {
  plans: [],
  household: null,
  chosenArrangementId: null,
  ledger: [],
  paid: false,
};

/** Used when the browser blocks storage, so the app still works for this visit. */
let memoryRaw: string | null = null;

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function parse(raw: string | null): Session {
  if (!raw) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Session>) };
  } catch {
    return EMPTY;
  }
}

let cachedRaw: string | null = null;
let cachedSession: Session = EMPTY;

/** Same object until the stored session changes, as useSyncExternalStore requires. */
export function getSessionSnapshot(): Session {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = parse(raw);
  }
  return cachedSession;
}

/** What the server renders: there is no session on the server. */
export function getServerSessionSnapshot(): Session {
  return EMPTY;
}

/** Notifies on changes from this tab and from other tabs. */
export function subscribeSession(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function loadSession(): Session {
  return getSessionSnapshot();
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(session);
  memoryRaw = raw;
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // Storage is blocked: memoryRaw keeps the state for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  memoryRaw = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
