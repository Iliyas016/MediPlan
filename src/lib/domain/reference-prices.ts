import type { ServiceKey } from "./plan";

/**
 * Typical in-network price for one unit of each service: the amount the
 * insurer and provider agreed on, which deductibles and coinsurance apply to.
 *
 * Each sourced figure comes from employer-plan claims research and says what
 * was measured and when. Where no reliable public figure was found, the price
 * stays an estimate (`source: null`) and the UI labels it "Estimate".
 * Research notes: docs/research/prices.md.
 */
export interface ReferencePrice {
  allowed: number;
  unit: string;
  /** Link to the figure, or null for an estimate. */
  source: string | null;
  /** What the source measured, shown next to the price. */
  measured: string | null;
}

const HCCI_PRIMARY_CARE = "https://healthcostinstitute.org/all-hcci-reports/trends-in-primary-care-visits/";
const HCCI_IMAGING = "https://healthcostinstitute.org/wp-content/uploads/2026/03/Imaging-Brief_Final.pdf";
const FAIR_HEALTH_2023 =
  "https://www.prnewswire.com/news-releases/retail-clinic-and-urgent-care-center-utilization-each-decreased-12-percent-nationally-from-2022-to-2023-according-to-eighth-annual-fair-health-report-302408848.html";
const HCCI_2011 = "https://healthcostinstitute.org/wp-content/uploads/images/pdfs/2011-HCCI-Annual-Report.pdf";
const KFF_COMMON_SERVICES =
  "https://www.healthsystemtracker.org/chart-collection/how-costly-are-common-health-services-in-the-united-states/";

export const REFERENCE_PRICES: Record<ServiceKey, ReferencePrice> = {
  preventive: {
    allowed: 116,
    unit: "annual visit",
    source: HCCI_PRIMARY_CARE,
    measured: "Average primary care office visit, commercial insurance, 2022 (HCCI). Used for the check-up.",
  },
  primaryCare: {
    allowed: 116,
    unit: "visit",
    source: HCCI_PRIMARY_CARE,
    measured: "Average primary care office visit, commercial insurance, 2022 (HCCI).",
  },
  specialist: {
    allowed: 183,
    unit: "visit",
    source: FAIR_HEALTH_2023,
    measured: "Median allowed amount, new-patient office visit of 45 to 59 minutes (CPT 99204) in physician offices, 2023 (FAIR Health).",
  },
  diagnosticTest: {
    allowed: 61,
    unit: "lab test or x-ray",
    source: HCCI_IMAGING,
    measured: "Average price of the simplest imaging (level 1) in a physician's office, 2022 (HCCI). $227 in a hospital outpatient department.",
  },
  imaging: {
    allowed: 861,
    unit: "CT or MRI scan",
    source: KFF_COMMON_SERVICES,
    measured: "Average outpatient lower-back MRI, large employer plans, 2018 (Peterson-KFF).",
  },
  genericDrug: {
    allowed: 33,
    unit: "prescription",
    source: HCCI_2011,
    measured: "Average generic prescription price, commercially insured, 2011 (HCCI). The newest per-prescription figure we found.",
  },
  preferredBrandDrug: {
    allowed: 268,
    unit: "prescription",
    source: HCCI_2011,
    measured: "Average brand-name prescription price, commercially insured, 2011 (HCCI). The newest per-prescription figure we found.",
  },
  nonPreferredDrug: { allowed: 500, unit: "30-day fill", source: null, measured: null },
  specialtyDrug: { allowed: 4000, unit: "30-day fill", source: null, measured: null },
  urgentCare: {
    allowed: 179,
    unit: "visit",
    source: FAIR_HEALTH_2023,
    measured: "Median allowed amount, new-patient visit of 45 to 59 minutes (CPT 99204) at urgent care centers, 2023 (FAIR Health).",
  },
  emergencyRoom: {
    allowed: 2453,
    unit: "visit",
    source:
      "https://www.healthsystemtracker.org/brief/emergency-department-visits-exceed-affordability-thresholds-for-many-consumers-with-private-insurance/",
    measured: "Average emergency department visit, large employer plans, 2019 (Peterson-KFF).",
  },
  ambulance: {
    allowed: 758,
    unit: "transport",
    source: "https://www.healthcaredive.com/news/ground-ambulance-costs-continue-to-soar-study-finds/619195/",
    measured: "Average allowed amount, advanced life support emergency ground transport, 2020 (FAIR Health).",
  },
  hospitalStay: {
    allowed: 24680,
    unit: "admission",
    source: KFF_COMMON_SERVICES,
    measured: "Average inpatient admission, large employer plans, 2018 (Peterson-KFF).",
  },
  outpatientSurgery: {
    allowed: 7595,
    unit: "procedure",
    source: KFF_COMMON_SERVICES,
    measured: "Average outpatient knee meniscus repair, large employer plans (Peterson-KFF).",
  },
  mentalHealthVisit: { allowed: 150, unit: "session", source: null, measured: null },
  delivery: {
    allowed: 20416,
    unit: "birth",
    source: "https://www.kff.org/health-costs/health-costs-associated-with-pregnancy-childbirth-and-postpartum-care/",
    measured: "Average pregnancy, childbirth and postpartum care, employer plans, 2021 to 2023 claims (Peterson-KFF).",
  },
  physicalTherapy: { allowed: 110, unit: "session", source: null, measured: null },
};

export type PriceTable = Record<ServiceKey, { allowed: number }>;
