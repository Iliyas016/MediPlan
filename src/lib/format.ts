import type { ServiceKey } from "./domain/plan";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Whole dollars, e.g. "$12,340". */
export function formatUsd(amount: number): string {
  return usd.format(Math.round(amount));
}

/** Plain-English names for the services we price. */
export const SERVICE_LABELS: Record<ServiceKey, string> = {
  preventive: "Annual check-up",
  primaryCare: "Doctor visit",
  specialist: "Specialist visit",
  diagnosticTest: "Lab test or X-ray",
  imaging: "CT or MRI scan",
  genericDrug: "Generic prescription",
  preferredBrandDrug: "Brand-name prescription",
  nonPreferredDrug: "Non-preferred brand prescription",
  specialtyDrug: "Specialty prescription",
  urgentCare: "Urgent care visit",
  emergencyRoom: "Emergency room visit",
  ambulance: "Ambulance",
  hospitalStay: "Hospital stay",
  outpatientSurgery: "Outpatient surgery",
  mentalHealthVisit: "Therapy session",
  delivery: "Having a baby",
  physicalTherapy: "Physical therapy session",
};
