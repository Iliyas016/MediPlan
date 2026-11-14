import {
  answered,
  assumed,
  type CareItem,
  type Field,
  type Household,
  type Person,
  type PersonRole,
} from "@/lib/domain/profile";

/** "" means the question has not been answered yet. */
export type YesNo = "yes" | "no" | "";

/** What the questionnaire holds for one person. Inputs stay strings until submit. */
export interface PersonDraft {
  id: string;
  role: PersonRole;
  name: string;
  age: string;
  doctorVisits: string;
  urgentCareVisits: string;
  prescriptions: YesNo;
  genericRx: string;
  brandRx: string;
  specialtyRx: string;
  ongoingCare: YesNo;
  specialistVisits: string;
  therapySessions: string;
  physicalTherapySessions: string;
  plannedCare: YesNo;
  plannedBaby: boolean;
  plannedSurgery: boolean;
  plannedScan: boolean;
}

export interface HouseholdDraft {
  you: PersonDraft;
  hasPartner: boolean;
  partner: PersonDraft;
  children: PersonDraft[];
  savings: string;
  neededServices: string[];
  neededServicesAnswered: boolean;
  providers: string;
  noProviders: boolean;
}

/**
 * Services plans often exclude. `needle` is matched against the
 * "Excluded Services" lines of each plan's SBC.
 */
export const SPECIAL_SERVICES = [
  { needle: "infertility", label: "Fertility treatment such as IVF" },
  { needle: "bariatric", label: "Weight-loss surgery" },
  { needle: "weight loss", label: "Weight-loss programs" },
  { needle: "hearing aid", label: "Hearing aids" },
  { needle: "dental", label: "Adult dental care" },
  { needle: "eye care", label: "Adult eye exams and glasses" },
  { needle: "chiropractic", label: "Chiropractic care" },
  { needle: "acupuncture", label: "Acupuncture" },
  { needle: "long-term care", label: "Long-term care" },
] as const;

const DEFAULT_ADULT_AGE = 35;
const DEFAULT_CHILD_AGE = 8;
const DEFAULT_DOCTOR_VISITS = 2;
const MAX_CHILDREN = 8;

export function newPersonDraft(id: string, role: PersonRole): PersonDraft {
  return {
    id,
    role,
    name: "",
    age: "",
    doctorVisits: "",
    urgentCareVisits: "",
    prescriptions: "",
    genericRx: "",
    brandRx: "",
    specialtyRx: "",
    ongoingCare: "",
    specialistVisits: "",
    therapySessions: "",
    physicalTherapySessions: "",
    plannedCare: "",
    plannedBaby: false,
    plannedSurgery: false,
    plannedScan: false,
  };
}

export function emptyHouseholdDraft(hasPartner: boolean): HouseholdDraft {
  return {
    you: newPersonDraft("adultA", "adultA"),
    hasPartner,
    partner: newPersonDraft("adultB", "adultB"),
    children: [],
    savings: "",
    neededServices: [],
    neededServicesAnswered: false,
    providers: "",
    noProviders: false,
  };
}

/** Grows or shrinks the children list, keeping answers already given. */
export function resizeChildren(children: PersonDraft[], count: number): PersonDraft[] {
  const n = Math.max(0, Math.min(MAX_CHILDREN, Math.floor(count)));
  if (n <= children.length) return children.slice(0, n);
  const added = Array.from({ length: n - children.length }, (_, i) =>
    newPersonDraft(`child-${children.length + i + 1}`, "child"),
  );
  return [...children, ...added];
}

export function defaultName(person: PersonDraft, childIndex = 0): string {
  if (person.role === "adultA") return "You";
  if (person.role === "adultB") return "Partner";
  return `Child ${childIndex + 1}`;
}

/** People currently included in the household, in display order. */
export function activePeople(draft: HouseholdDraft): { person: PersonDraft; fallbackName: string }[] {
  return [
    { person: draft.you, fallbackName: defaultName(draft.you) },
    ...(draft.hasPartner ? [{ person: draft.partner, fallbackName: defaultName(draft.partner) }] : []),
    ...draft.children.map((child, i) => ({ person: child, fallbackName: defaultName(child, i) })),
  ];
}

/** Whole, non-negative number, or null when blank or invalid. */
function count(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function buildPerson(draft: PersonDraft, fallbackName: string): Person {
  const label = draft.name.trim() || fallbackName;
  const isAdult = draft.role !== "child";
  const items: CareItem[] = [];
  const gaps: string[] = [];
  const add = (service: CareItem["service"], times: number, recurring: boolean, itemLabel: string) => {
    if (times > 0) items.push({ service, timesPerYear: times, recurring, label: itemLabel });
  };

  const visits = count(draft.doctorVisits);
  if (visits === null) gaps.push(`doctor visits not given, assumed ${DEFAULT_DOCTOR_VISITS} a year`);
  add("primaryCare", visits ?? DEFAULT_DOCTOR_VISITS, false, "Doctor visits");

  const urgent = count(draft.urgentCareVisits);
  if (urgent === null) gaps.push("urgent care visits not given, assumed none");
  add("urgentCare", urgent ?? 0, false, "Urgent care visits");

  if (draft.prescriptions === "") gaps.push("prescriptions not answered, assumed none");
  if (draft.prescriptions === "yes") {
    add("genericDrug", (count(draft.genericRx) ?? 0) * 12, true, "Generic prescriptions, monthly");
    add("preferredBrandDrug", (count(draft.brandRx) ?? 0) * 12, true, "Brand-name prescriptions, monthly");
    add("specialtyDrug", (count(draft.specialtyRx) ?? 0) * 12, true, "Specialty prescriptions, monthly");
  }

  if (draft.ongoingCare === "") gaps.push("ongoing care not answered, assumed none");
  if (draft.ongoingCare === "yes") {
    add("specialist", count(draft.specialistVisits) ?? 0, true, "Specialist visits");
    add("mentalHealthVisit", count(draft.therapySessions) ?? 0, true, "Therapy sessions");
    add("physicalTherapy", count(draft.physicalTherapySessions) ?? 0, true, "Physical therapy");
  }

  if (draft.plannedCare === "") gaps.push("planned care not answered, assumed none");
  if (draft.plannedCare === "yes") {
    if (isAdult && draft.plannedBaby) add("delivery", 1, false, "Having a baby");
    if (draft.plannedSurgery) add("outpatientSurgery", 1, false, "Planned surgery");
    if (draft.plannedScan) add("imaging", 1, false, "Planned CT or MRI scan");
  }

  const age = count(draft.age);
  const defaultAge = isAdult ? DEFAULT_ADULT_AGE : DEFAULT_CHILD_AGE;

  return {
    id: draft.id,
    role: draft.role,
    label,
    age:
      age === null
        ? assumed(defaultAge, `${label}: age not given, assumed ${defaultAge}.`)
        : answered(age),
    care: gaps.length > 0 ? assumed(items, `${label}: ${gaps.join("; ")}.`) : answered(items),
  };
}

function parseProviders(text: string): string[] {
  return text
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Turns questionnaire answers into the engine's Household, marking every gap. */
export function buildHousehold(draft: HouseholdDraft): Household {
  const people = activePeople(draft).map(({ person, fallbackName }) =>
    buildPerson(person, fallbackName),
  );

  const savingsAmount = count(draft.savings);
  const emergencySavings: Field<number> =
    savingsAmount === null
      ? {
          value: 0,
          status: "unknown",
          note: "Emergency savings not given, so no option was ruled out for an expensive bad year.",
        }
      : answered(savingsAmount);

  const providerList = parseProviders(draft.providers);
  const mustKeepProviders: Field<string[]> =
    providerList.length > 0 || draft.noProviders
      ? answered(providerList)
      : assumed([], "No doctors to keep were listed. Check that your doctors are in network before you enroll.");

  const neededServices: Field<string[]> = draft.neededServicesAnswered
    ? answered(draft.neededServices)
    : assumed([], "Special services not answered, so plan exclusions were not checked against your needs.");

  return { people, emergencySavings, mustKeepProviders, neededServices };
}
