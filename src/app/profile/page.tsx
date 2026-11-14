import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Your family · MediPlan",
  description: "Who needs coverage and how much care you expect next year.",
};

export default function ProfilePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <ProfileForm />
    </main>
  );
}
