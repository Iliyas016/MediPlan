import { describe, expect, it } from "vitest";
import { BAD_YEAR_BILL, ILLUSTRATIVE_PLANS, breakEvenBill, yearCost } from "./illustration";

const [a, b] = ILLUSTRATIVE_PLANS;

describe("landing illustration", () => {
  it("prices a normal year: premiums plus four doctor visits", () => {
    expect(yearCost(a, 0)).toEqual({ premiums: 3000, care: 600, total: 3600 });
    expect(yearCost(b, 0)).toEqual({ premiums: 6120, care: 120, total: 6240 });
  });

  it("prices the bad year with a $14,000 hospital bill", () => {
    expect(yearCost(a, BAD_YEAR_BILL).total).toBe(10720);
    expect(yearCost(b, BAD_YEAR_BILL).total).toBe(9840);
  });

  it("finds the bill at which the cheap plan stops being cheaper", () => {
    const bill = breakEvenBill(ILLUSTRATIVE_PLANS);
    expect(bill).toBe(4300);
    expect(yearCost(a, 4200).total).toBeLessThan(yearCost(b, 4200).total);
    expect(yearCost(a, 4400).total).toBeGreaterThan(yearCost(b, 4400).total);
  });
});
