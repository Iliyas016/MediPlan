import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="space-y-5">
        <h1 className="text-3xl font-extrabold sm:text-4xl">There is no page here</h1>
        <p className="max-w-prose text-lg text-ink-soft">
          The link may be old or mistyped. Start from your plan documents, or try MediPlan with
          the sample plans.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ButtonLink href="/start">Upload plan documents</ButtonLink>
          <ButtonLink href="/start?sample=1" variant="secondary">
            Try with sample plans
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
