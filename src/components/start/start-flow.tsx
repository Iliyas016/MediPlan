"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type DragEvent, type SetStateAction } from "react";
import { DocumentArt } from "@/components/ui/art";
import { Button } from "@/components/ui/button";
import { ExtractedPlanSchema, type Plan } from "@/lib/domain/plan";
import { MAX_PDF_BYTES } from "@/lib/extract/limits";
import { SAMPLE_PLANS, type SamplePlan } from "@/lib/samples";
import type { WarningPath } from "@/lib/extract/schema";
import { saveSession, type Session } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import {
  buildPlan,
  draftFromExtraction,
  draftFromPlan,
  emptyPlanDraft,
  type Employer,
  type FieldPath,
  sampleLabel,
  SAMPLE_SOURCE_PREFIX,
  type PlanDraft,
} from "./plan-draft";
import { EMPLOYER_LABELS, PlanForm } from "./plan-form";

const DRAFTS_KEY = "mediplan.start-drafts.v1";

/** A file being read, a file that could not be read, or a plan in the review form. */
type Item =
  | { status: "reading"; id: string; employer: Employer; fileName: string }
  | { status: "failed"; id: string; employer: Employer; fileName: string; message: string }
  | { status: "ready"; draft: PlanDraft };

const itemId = (item: Item) => (item.status === "ready" ? item.draft.id : item.id);
const itemEmployer = (item: Item) => (item.status === "ready" ? item.draft.employer : item.employer);

function loadDrafts(plans: Plan[]): PlanDraft[] {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (raw) return JSON.parse(raw) as PlanDraft[];
  } catch {
    // Fall through to the saved plans.
  }
  return plans.map(draftFromPlan);
}

function saveDrafts(drafts: PlanDraft[]): void {
  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    // The drafts still live in memory for this visit.
  }
}

const READ_FAILED =
  "We could not read this file. Check your connection and try again, or enter the plan by hand.";

/** Sends one PDF to /api/extract and turns the answer into a review draft or an error message. */
async function readFile(id: string, employer: Employer, file: File): Promise<Item> {
  const failed = (message: string): Item => ({ status: "failed", id, employer, fileName: file.name, message });
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return failed("This is not a PDF. Upload the plan's Summary of Benefits and Coverage as a PDF.");
  }
  if (file.size > MAX_PDF_BYTES) {
    return failed("This PDF is larger than 4 MB. Enter the plan by hand instead.");
  }

  const body = new FormData();
  body.append("file", new File([file], file.name, { type: "application/pdf" }));
  try {
    const response = await fetch("/api/extract", { method: "POST", body });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = (data as { message?: unknown } | null)?.message;
      return failed(typeof message === "string" ? message : READ_FAILED);
    }
    const answer = data as { plan: unknown; warnings: WarningPath[]; missing: WarningPath[] };
    const plan = ExtractedPlanSchema.safeParse(answer.plan);
    if (!plan.success) return failed(READ_FAILED);
    return {
      status: "ready",
      draft: draftFromExtraction(id, employer, file.name, {
        plan: plan.data,
        warnings: answer.warnings ?? [],
        missing: answer.missing ?? [],
      }),
    };
  } catch {
    return failed(READ_FAILED);
  }
}

const isSample = (item: Item) => item.status === "ready" && sampleLabel(item.draft.source) !== null;

/**
 * A sample goes through the same /api/extract as an upload. Only the premiums,
 * which no SBC contains, come from the employer's published rate table.
 */
async function readSample(id: string, sample: SamplePlan): Promise<Item> {
  let file: File;
  try {
    const response = await fetch(`/samples/${sample.file}`);
    if (!response.ok) throw new Error(String(response.status));
    file = new File([await response.blob()], sample.file, { type: "application/pdf" });
  } catch {
    return { status: "failed", id, employer: sample.employer, fileName: sample.label, message: READ_FAILED };
  }
  const item = await readFile(id, sample.employer, file);
  if (item.status !== "ready") return { ...item, fileName: sample.label };
  const premiums = Object.fromEntries(
    Object.entries(sample.monthlyPremiums).map(([tier, amount]) => [tier, String(amount)]),
  ) as PlanDraft["premiums"];
  return {
    status: "ready",
    draft: {
      ...item.draft,
      source: `${SAMPLE_SOURCE_PREFIX}${sample.label}`,
      premiums,
      paychecksPerYear: "12",
    },
  };
}

/** Replaces any earlier sample plans with a fresh read of every sample. */
function loadSamples(setItems: Dispatch<SetStateAction<Item[]>>): void {
  const jobs = SAMPLE_PLANS.map((sample) => ({ sample, id: crypto.randomUUID() }));
  setItems((list) => [
    ...list.filter((item) => !isSample(item)),
    ...jobs.map(({ sample, id }): Item => ({ status: "reading", id, employer: sample.employer, fileName: sample.label })),
  ]);
  for (const { sample, id } of jobs) {
    void readSample(id, sample).then((item) =>
      setItems((list) => list.map((existing) => (itemId(existing) === id ? item : existing))),
    );
  }
}

export function StartFlow() {
  const session = useSession();
  if (!session) return <p className="text-ink-faint">Loading…</p>;
  return <StartFlowLoaded session={session} />;
}

function StartFlowLoaded({ session }: { session: Session }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(() =>
    loadDrafts(session.plans).map((draft) => ({ status: "ready", draft })),
  );
  const [errors, setErrors] = useState<Record<string, Partial<Record<FieldPath, string>>> | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveDrafts(items.flatMap((item) => (item.status === "ready" ? [item.draft] : [])));
  }, [items]);

  // The landing page links here with ?sample=1. Dropping the parameter first
  // keeps a remount from loading the samples twice.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("sample") !== "1") return;
    url.searchParams.delete("sample");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
    loadSamples(setItems);
  }, []);

  const replace = (id: string, next: Item | null) =>
    setItems((list) => list.flatMap((item) => (itemId(item) === id ? (next ? [next] : []) : [item])));

  const upload = (employer: Employer, files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID();
      setItems((list) => [...list, { status: "reading", id, employer, fileName: file.name }]);
      void readFile(id, employer, file).then((item) => replace(id, item));
    }
  };

  const addManual = (employer: Employer, replacing?: string) => {
    const draft = emptyPlanDraft(crypto.randomUUID(), employer);
    if (replacing) replace(replacing, { status: "ready", draft });
    else setItems((list) => [...list, { status: "ready", draft }]);
  };

  const reading = items.some((item) => item.status === "reading");
  const drafts = items.flatMap((item) => (item.status === "ready" ? [item.draft] : []));
  const toCheck = drafts.reduce((n, d) => n + d.warnings.length, 0);

  const submit = () => {
    if (drafts.length === 0) {
      setFormMessage("Add at least one plan to continue.");
      return;
    }
    const results = drafts.map((draft) => ({ draft, result: buildPlan(draft) }));
    const failed = results.filter((r) => !r.result.ok);
    if (failed.length > 0) {
      setErrors(Object.fromEntries(failed.map((r) => [r.draft.id, r.result.ok ? {} : r.result.errors])));
      setFormMessage(
        failed.length === 1
          ? `“${failed[0].draft.name.trim() || "New plan"}” still has empty or invalid fields. They are marked in red.`
          : `${failed.length} plans still have empty or invalid fields. They are marked in red.`,
      );
      requestAnimationFrame(() => {
        const first = listRef.current?.querySelector<HTMLElement>("[data-field-error]");
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        first?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
      });
      return;
    }
    const plans = results.flatMap((r) => (r.result.ok ? [r.result.plan] : []));
    saveSession({ ...session, plans });
    router.push("/profile");
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Add your health plans</h1>
        <p className="max-w-prose text-lg text-ink-soft">
          Upload each plan’s summary (the SBC PDF). We read it, you check a few numbers and add your
          premium. Files are not stored.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="button" variant="secondary" onClick={() => loadSamples(setItems)} disabled={reading}>
            Try with sample plans
          </Button>
          <p className="text-sm text-ink-faint">No packet at hand? Real plans from two universities.</p>
        </div>
      </header>

      <div ref={listRef} className="space-y-10">
        {(["A", "B"] as const).map((employer) => (
          <EmployerSection
            key={employer}
            employer={employer}
            items={items.filter((item) => itemEmployer(item) === employer)}
            errors={errors}
            onUpload={(files) => upload(employer, files)}
            onManual={(replacing) => addManual(employer, replacing)}
            onChange={(draft) => replace(draft.id, { status: "ready", draft })}
            onRemove={(id) => replace(id, null)}
          />
        ))}
      </div>

      <div className="space-y-3 border-t border-rule pt-6">
        {formMessage && (
          <p role="alert" className="rounded-lg bg-risk-wash px-4 py-3 text-sm">
            {formMessage}
          </p>
        )}
        {!formMessage && toCheck > 0 && (
          <p className="text-sm text-ink-faint">
            {toCheck} highlighted {toCheck === 1 ? "field" : "fields"} left to check. You can continue,
            but the result is only as good as these numbers.
          </p>
        )}
        <Button type="button" onClick={submit} disabled={reading} className="w-full sm:w-auto">
          {reading ? "Reading your files…" : "Continue to your family"}
        </Button>
      </div>
    </div>
  );
}

function EmployerSection({
  employer,
  items,
  errors,
  onUpload,
  onManual,
  onChange,
  onRemove,
}: {
  employer: Employer;
  items: Item[];
  errors: Record<string, Partial<Record<FieldPath, string>>> | null;
  onUpload: (files: File[]) => void;
  onManual: (replacing?: string) => void;
  onChange: (draft: PlanDraft) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const headingId = `employer-${employer}`;

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  };

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) onUpload(files);
  };

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="space-y-1">
        <h2 id={headingId} className="text-xl font-bold">
          {EMPLOYER_LABELS[employer]}
          {employer === "B" && <span className="ml-2 text-base font-normal text-ink-faint">optional</span>}
        </h2>
        <p className="text-sm text-ink-faint">
          {employer === "A"
            ? "Every plan your employer offers you."
            : "Add these too and we price every way to split the family."}
        </p>
      </div>

      {items.map((item) => {
        switch (item.status) {
          case "reading":
            return (
              <div key={item.id} role="status" className="flex items-center gap-4 rounded-xl border border-rule bg-surface px-4 py-4 sm:px-5">
                <DocumentArt scanning className="w-10" />
                <div>
                  <p className="font-medium break-all">{item.fileName}</p>
                  <p className="text-sm text-ink-faint">Reading the plan… this takes about 20 seconds.</p>
                </div>
              </div>
            );
          case "failed":
            return (
              <div key={item.id} role="alert" className="space-y-3 rounded-xl border border-risk bg-risk-wash px-4 py-4 sm:px-5">
                <p className="font-medium break-all">{item.fileName}</p>
                <p className="text-sm">{item.message}</p>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" onClick={() => onManual(item.id)}>
                    Enter this plan by hand
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => onRemove(item.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          case "ready":
            return (
              <PlanForm
                key={item.draft.id}
                draft={item.draft}
                errors={errors?.[item.draft.id] ?? null}
                onChange={onChange}
                onRemove={() => onRemove(item.draft.id)}
              />
            );
        }
      })}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`flex flex-wrap items-center gap-x-5 gap-y-4 rounded-xl border border-dashed px-4 py-4 transition-colors duration-150 sm:px-5 ${
          dragging ? "border-ink bg-highlight" : "border-rule-strong"
        }`}
      >
        {items.length === 0 && <DocumentArt className="w-12" />}
        <p className="min-w-40 flex-1 text-sm text-ink-soft">
          {dragging ? "Drop to read these plans." : "Drag SBC PDFs here, or choose how to add a plan."}
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={pick}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
          <Button type="button" onClick={() => inputRef.current?.click()} variant={items.length ? "secondary" : "primary"}>
            {items.length ? "Upload another SBC" : "Upload SBC PDFs"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => onManual()}>
            Enter a plan by hand
          </Button>
        </div>
      </div>
    </section>
  );
}
