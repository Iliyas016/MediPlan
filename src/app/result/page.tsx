import type { Metadata } from "next";
import { ResultView } from "@/components/result/result-view";

export const metadata: Metadata = {
  title: "Your best option · MediPlan",
  description: "The cheapest way to cover your family, priced for a good, an expected and a bad year.",
};

export default function ResultPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <ResultView />
    </main>
  );
}
