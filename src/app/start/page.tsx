import type { Metadata } from "next";
import { StartFlow } from "@/components/start/start-flow";

export const metadata: Metadata = {
  title: "Your plans · MediPlan",
  description: "Upload your employer's plan summaries or enter the numbers by hand.",
};

export default function StartPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <StartFlow />
    </main>
  );
}
