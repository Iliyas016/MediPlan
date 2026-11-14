import type { CoverageTier } from "./domain/plan";

/**
 * A two-employer household built from real, public documents, so anyone
 * without their own benefits packet can try the full flow. The PDFs go through
 * the same POST /api/extract as a user's upload; only the premiums, which no
 * SBC contains, are filled in from the employers' published rate tables.
 * Sources for the PDFs: public/samples/SOURCES.md.
 */
export interface SamplePlan {
  /** File in public/samples. */
  file: string;
  employer: "A" | "B";
  label: string;
  /** Employee's monthly contribution per coverage tier, as published. */
  monthlyPremiums: Record<CoverageTier, number>;
  premiumSource: string;
}

const IU_PREMIUMS =
  "Indiana University 2027 plan premiums, salary band below $41,510, monthly: https://hr.iu.edu/open-enrollment/premiums/index.html";

export const SAMPLE_PLANS: SamplePlan[] = [
  {
    file: "iu-anthem-ppo500-2026.pdf",
    employer: "A",
    label: "Indiana University, Anthem PPO $500",
    monthlyPremiums: { employee: 170.33, employee_children: 306.58, employee_spouse: 586.78, family: 708.55 },
    premiumSource: IU_PREMIUMS,
  },
  {
    file: "iu-anthem-ppo-hdhp-2026.pdf",
    employer: "A",
    label: "Indiana University, Anthem PPO HDHP",
    monthlyPremiums: { employee: 48.54, employee_children: 87.35, employee_spouse: 167.21, family: 201.9 },
    premiumSource: IU_PREMIUMS,
  },
  {
    file: "uky-ppo-2026-27.pdf",
    employer: "B",
    label: "University of Kentucky, UK-PPO",
    monthlyPremiums: { employee: 107, employee_children: 253, employee_spouse: 508, family: 727 },
    premiumSource:
      "University of Kentucky 2026-2027 PPO, monthly amount the employee pays: https://hr.uky.edu/insurance-and-retirement/health-insurance-and-benefits/ppo",
  },
];
