import type { ServiceKey } from "./plan";

/**
 * In-network allowed amount for one unit of each service: the price the
 * insurer has negotiated, which is what deductibles and coinsurance apply to.
 *
 * STATUS: rough working estimates so the engine can run. Before submission
 * each number must be replaced with a sourced figure (FAIR Health, HCCI,
 * MEPS) and `source` filled in. The UI must show these as editable
 * assumptions, never as facts.
 */
export interface ReferencePrice {
  allowed: number;
  unit: string;
  source: string | null;
}

export const REFERENCE_PRICES: Record<ServiceKey, ReferencePrice> = {
  preventive: { allowed: 200, unit: "annual visit", source: null },
  primaryCare: { allowed: 150, unit: "visit", source: null },
  specialist: { allowed: 250, unit: "visit", source: null },
  diagnosticTest: { allowed: 100, unit: "lab panel or x-ray", source: null },
  imaging: { allowed: 900, unit: "CT or MRI scan", source: null },
  genericDrug: { allowed: 20, unit: "30-day fill", source: null },
  preferredBrandDrug: { allowed: 250, unit: "30-day fill", source: null },
  nonPreferredDrug: { allowed: 500, unit: "30-day fill", source: null },
  specialtyDrug: { allowed: 4000, unit: "30-day fill", source: null },
  urgentCare: { allowed: 200, unit: "visit", source: null },
  emergencyRoom: { allowed: 2500, unit: "visit", source: null },
  ambulance: { allowed: 1300, unit: "transport", source: null },
  hospitalStay: { allowed: 18000, unit: "admission", source: null },
  outpatientSurgery: { allowed: 6000, unit: "procedure", source: null },
  mentalHealthVisit: { allowed: 150, unit: "session", source: null },
  delivery: { allowed: 15000, unit: "birth", source: null },
  physicalTherapy: { allowed: 110, unit: "session", source: null },
};

export type PriceTable = Record<ServiceKey, { allowed: number }>;
