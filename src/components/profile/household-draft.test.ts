import { describe, expect, it } from "vitest";
import { listAssumptions } from "@/lib/domain/profile";
import {
  buildHousehold,
  emptyHouseholdDraft,
  resizeChildren,
  type PersonDraft,
} from "./household-draft";

const fullyAnswered = (person: PersonDraft): PersonDraft => ({
  ...person,
  age: "34",
  doctorVisits: "3",
  urgentCareVisits: "0",
  prescriptions: "no",
  ongoingCare: "no",
  plannedCare: "no",
});

describe("buildHousehold", () => {
  it("marks every unanswered question as an assumption", () => {
    const household = buildHousehold(emptyHouseholdDraft(false));
    const notes = listAssumptions(household).map((a) => a.note).join(" ");

    expect(household.people).toHaveLength(1);
    expect(household.people[0].label).toBe("You");
    expect(household.emergencySavings.status).toBe("unknown");
    expect(notes).toContain("doctor visits not given, assumed 2 a year");
    expect(notes).toContain("prescriptions not answered");
    expect(notes).toContain("plan exclusions were not checked");
    // The default visits are still priced.
    expect(household.people[0].care.value).toEqual([
      { service: "primaryCare", timesPerYear: 2, recurring: false, label: "Doctor visits" },
    ]);
  });

  it("produces no assumptions when everything is answered", () => {
    const draft = emptyHouseholdDraft(true);
    const household = buildHousehold({
      ...draft,
      you: fullyAnswered(draft.you),
      partner: fullyAnswered(draft.partner),
      savings: "5000",
      neededServicesAnswered: true,
      noProviders: true,
    });
    expect(listAssumptions(household)).toEqual([]);
    expect(household.people.map((p) => p.role)).toEqual(["adultA", "adultB"]);
  });

  it("turns monthly prescriptions into twelve recurring fills", () => {
    const draft = emptyHouseholdDraft(false);
    const household = buildHousehold({
      ...draft,
      you: { ...fullyAnswered(draft.you), prescriptions: "yes", genericRx: "2", brandRx: "1" },
    });
    const care = household.people[0].care.value;
    expect(care).toContainEqual(expect.objectContaining({ service: "genericDrug", timesPerYear: 24, recurring: true }));
    expect(care).toContainEqual(expect.objectContaining({ service: "preferredBrandDrug", timesPerYear: 12 }));
    expect(care.some((c) => c.service === "specialtyDrug")).toBe(false);
  });

  it("ignores answers behind a gate the user closed", () => {
    const draft = emptyHouseholdDraft(false);
    const household = buildHousehold({
      ...draft,
      you: { ...fullyAnswered(draft.you), ongoingCare: "no", specialistVisits: "10" },
    });
    expect(household.people[0].care.value.some((c) => c.service === "specialist")).toBe(false);
  });

  it("never plans a birth for a child", () => {
    const draft = emptyHouseholdDraft(false);
    const [child] = resizeChildren([], 1);
    const household = buildHousehold({
      ...draft,
      children: [{ ...fullyAnswered(child), plannedCare: "yes", plannedBaby: true, plannedScan: true }],
    });
    const childCare = household.people[1].care.value.map((c) => c.service);
    expect(childCare).toContain("imaging");
    expect(childCare).not.toContain("delivery");
  });

  it("drops the partner when not included and keeps names given", () => {
    const draft = emptyHouseholdDraft(false);
    const household = buildHousehold({
      ...draft,
      you: { ...draft.you, name: "  Maria " },
      partner: { ...draft.partner, name: "Sam" },
    });
    expect(household.people.map((p) => p.label)).toEqual(["Maria"]);
  });

  it("splits the providers list on commas and new lines", () => {
    const household = buildHousehold({
      ...emptyHouseholdDraft(false),
      providers: "Dr. Lee, Mercy Hospital\nDr. Patel",
    });
    expect(household.mustKeepProviders).toEqual({
      value: ["Dr. Lee", "Mercy Hospital", "Dr. Patel"],
      status: "answered",
    });
  });
});

describe("resizeChildren", () => {
  it("keeps existing answers and numbers new children in order", () => {
    const two = resizeChildren([], 2);
    const edited = [{ ...two[0], name: "Ava" }, two[1]];
    const three = resizeChildren(edited, 3);
    expect(three.map((c) => c.id)).toEqual(["child-1", "child-2", "child-3"]);
    expect(three[0].name).toBe("Ava");
    expect(resizeChildren(three, 1).map((c) => c.name)).toEqual(["Ava"]);
  });
});
