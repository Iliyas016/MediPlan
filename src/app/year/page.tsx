import type { Metadata } from "next";
import { YearView } from "@/components/year/year-view";

export const metadata: Metadata = {
  title: "Your plan year · MediPlan",
  description: "Track your deductible, check each medical bill against your plan and price your next visit.",
};

export default function YearPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <YearView />
    </main>
  );
}
