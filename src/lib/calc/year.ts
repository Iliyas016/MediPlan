import type { CoverageTier, Plan, ServiceKey } from "../domain/plan";
import type { LedgerEntry } from "../store/session";
import type { Arrangement } from "./combinations";
import { createPlanYearTracker, type PlanYearTracker, type Progress } from "./cost";

/** A bill counts as overcharged when it exceeds the plan's share by more than this. */
const OVERBILL_TOLERANCE = 1;

export interface CheckedEntry {
  entry: LedgerEntry;
  /** Plan that covers the person, or null if nobody in the arrangement covers them. */
  planName: string | null;
  /** The family's share under the plan, given everything logged before it. */
  shouldOwe: number;
  notCovered: boolean;
  /** How much the provider asked above the plan's share, when they asked more. */
  overbilled: number;
}

export interface PlanProgress {
  plan: Plan;
  tier: CoverageTier;
  coveredIds: string[];
  deductible: Progress;
  outOfPocket: Progress;
  people: { personId: string; deductiblePaid: number; outOfPocketPaid: number }[];
}

export interface YearStatus {
  /** Entries in date order, each checked against the plan. */
  entries: CheckedEntry[];
  plans: PlanProgress[];
}

function byDate(a: LedgerEntry, b: LedgerEntry): number {
  return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
}

function replay(arrangement: Arrangement, ledger: LedgerEntry[]) {
  const trackers = arrangement.parts.map((part) => ({
    part,
    tracker: createPlanYearTracker(part.plan, part.tier),
  }));
  const trackerFor = (personId: string) =>
    trackers.find((t) => t.part.coveredIds.includes(personId)) ?? null;

  const entries: CheckedEntry[] = [...ledger].sort(byDate).map((entry) => {
    const owner = trackerFor(entry.personId);
    if (!owner) {
      return { entry, planName: null, shouldOwe: entry.allowed, notCovered: true, overbilled: 0 };
    }
    const charge = owner.tracker.charge({
      personId: entry.personId,
      service: entry.service,
      allowed: entry.allowed,
    });
    const overbilled =
      entry.billed !== null && entry.billed - charge.pay > OVERBILL_TOLERANCE
        ? Math.round((entry.billed - charge.pay) * 100) / 100
        : 0;
    return {
      entry,
      planName: owner.part.plan.name,
      shouldOwe: charge.pay,
      notCovered: charge.notCovered,
      overbilled,
    };
  });

  return { trackers, trackerFor, entries };
}

function progressOf(part: Arrangement["parts"][number], tracker: PlanYearTracker): PlanProgress {
  return {
    plan: part.plan,
    tier: part.tier,
    coveredIds: part.coveredIds,
    deductible: tracker.deductible(),
    outOfPocket: tracker.outOfPocket(),
    people: part.coveredIds.map((personId) => ({
      personId,
      deductiblePaid: tracker.personDeductiblePaid(personId),
      outOfPocketPaid: tracker.personOutOfPocketPaid(personId),
    })),
  };
}

/** Replays every logged bill through the chosen plans, in date order. */
export function trackYear(arrangement: Arrangement, ledger: LedgerEntry[]): YearStatus {
  const { trackers, entries } = replay(arrangement, ledger);
  return { entries, plans: trackers.map((t) => progressOf(t.part, t.tracker)) };
}

/**
 * What one more visit would cost today, after everything already logged.
 * Null when the person is not covered by the arrangement.
 */
export function estimateVisit(
  arrangement: Arrangement,
  ledger: LedgerEntry[],
  personId: string,
  service: ServiceKey,
  allowed: number,
): { planName: string; pay: number; notCovered: boolean } | null {
  const { trackerFor } = replay(arrangement, ledger);
  const owner = trackerFor(personId);
  if (!owner) return null;
  const charge = owner.tracker.charge({ personId, service, allowed });
  return { planName: owner.part.plan.name, pay: charge.pay, notCovered: charge.notCovered };
}
