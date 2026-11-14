<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MediPlan: project context for AI agents

Read this file fully before changing anything. Then read your role brief in
`docs/roles/` (`ilyas.md`, `abuka.md` or `borch.md`) and work only on the
tasks and files listed there.

## What we are building

MediPlan is a web app for US families (adults 25-45) choosing employer health
insurance during open enrollment. The user uploads the plan summaries (SBC
PDFs) from one or both spouses' employers, describes the family, and gets the
cheapest way to cover everyone, priced for a good, an expected and a bad year.
Paid as an annual subscription of about $49. Domain terms are explained in
`docs/DOMAIN.md`.

It is a hackathon entry (BUSINESS CUP 2.0, Money track). Submission deadline:
15 November 2026, 12:00. Judges open the live site and read this repository.

## Hard rules (breaking one disqualifies or costs the most points)

1. The live product must open and work with no registration or login.
2. No hardcoded results. Every number on screen comes from the uploaded
   documents, the user's answers, or a sourced reference table. No fake data
   on production screens. Test fixtures live only in `*.test.ts` files.
3. Web only, B2C only. All UI text is in English.
4. The model only extracts numbers from documents. All cost math is plain
   TypeScript in `src/lib/calc` and must stay deterministic and tested.
5. Secrets live only in `.env.local` and in Vercel settings. Never commit or
   print a key.
6. The LLM provider is the OpenAI API (`OPENAI_API_KEY`). There is no Claude
   API key. Check the current OpenAI documentation before writing API code.
7. A working paywall with a clear price ($49 per year) is required; a pricing
   page alone is not enough. Stripe runs in test mode with the test card shown
   on screen. The main flow up to the verdict stays free, so judges never have
   to pay or sign up.
8. At least one return mechanic must be built and working: the `/year`
   tracker (progress toward the deductible, logged bills, key dates).
9. Health is a sensitive topic. Ask how much care the family expects (visits,
   prescriptions), never for diagnoses. Give no medical advice. Health details
   stay in the visitor's browser.
10. Built-in sample plans are allowed only if they go through the same live
    pipeline as an upload, and they must be labelled as sample data.
11. No dead buttons or links. Hide what does not work yet.

## Architecture

- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel.
- `src/lib/domain/plan.ts`: plan schema (zod). `ExtractedPlan` is what comes
  out of an SBC; `Plan` adds the employer (A or B) and the premiums.
- `src/lib/domain/profile.ts`: `Household` and `Person`. Every value is a
  `Field<T>` with a status: answered, assumed or unknown.
- `src/lib/domain/reference-prices.ts`: allowed amount per service. Must be
  sourced before submission.
- `src/lib/calc`: `recommend(household, plans, prices)` ranks every way to
  cover the family. Covered by `engine.test.ts`.
- `src/lib/store/session.ts`: `loadSession` / `saveSession`. State lives in
  the visitor's browser (`{ plans, household }`).
- `src/app/api/extract/route.ts`: `POST` an SBC PDF, get
  `{ plan: ExtractedPlan, warnings: string[] }`.

User flow and routes: `/` landing -> `/start` upload, review, premiums ->
`/profile` family questionnaire -> `/result` verdict -> `/year` plan-year
tracker (paid). `/pricing` explains the subscription and starts the checkout.

Free: the whole flow up to the verdict (best option, yearly saving, expected
cost). Paid: the full comparison of every option, the bad-year stress test and
the `/year` tracker.

## Who owns which files

Edit only your own files. The two domain files are shared contracts: do not
change them without telling the team first.

- Ilyas: `src/app/page.tsx`, `src/app/profile/**`, `src/app/result/**`,
  `src/app/year/**`, `src/components/profile/**`, `src/components/result/**`,
  `src/components/year/**`, `src/lib/calc/**`, `src/components/ui/**`,
  `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/format.ts`
- Abuka: `src/app/api/**`, `src/app/start/**`, `src/components/start/**`,
  `src/components/paywall/**`, `src/lib/extract/**`,
  `src/lib/domain/reference-prices.ts`
- Borch: `public/samples/**`, `docs/research/**`, `src/app/pricing/**`
- Shared contracts: `src/lib/domain/plan.ts`, `src/lib/domain/profile.ts`,
  `src/lib/store/session.ts`, `src/lib/store/use-session.ts`

## Design system

Every screen uses one visual world: open-enrollment paperwork made calm. Ink on
paper, figures set like a ledger, one highlighter mark per screen on the number
that matters. Before building UI, read `src/app/globals.css` and copy the
patterns of `/profile` and `/result`.

- Colors only through tokens: `bg-paper`, `bg-surface`, `text-ink`,
  `text-ink-soft`, `text-ink-faint`, `border-rule`, `border-rule-strong`,
  `text-save` / `bg-save-wash` (savings, done), `text-risk` /
  `bg-risk-wash` (warnings, errors), `bg-ink text-paper` (selected). Never
  raw Tailwind palette colors (`zinc`, `blue`...) or hex in components.
  Dark mode comes from the tokens for free.
- Buttons: `Button` and `ButtonLink` from `src/components/ui/button.tsx`.
- Type: Public Sans from the layout. Page title `text-3xl font-extrabold
  sm:text-4xl`, section title `text-xl font-bold`, money `tabular-nums`
  via `formatUsd` from `src/lib/format.ts`.
- Pages: `<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10
  sm:py-14">`. The header with the 1-2-3 steps comes from the layout.
- Do not: put a small label or eyebrow above a heading, use emoji as icons,
  make a colored left border on cards, or use gradients. Lists of figures
  are ledger rows with dividers, not grids of identical cards.
- The `.marker` class is the highlighter. At most one per screen.
- Motion: only the top of a screen enters, through the `.enter`, `.draw`
  and `.grow` classes in `globals.css`, ordered with `stagger(i)` from
  `src/components/ui/motion.ts`. The headline figure may use `CountUp`.
  Animate only transform, opacity and filter; reduced motion turns it off.
  No animation libraries, no motion on lists further down the page.

## Working rules

- Before every push run `npm test`, `npm run typecheck`, `npm run lint`.
  `main` must always build: Vercel deploys it.
- Work on your own branch, merge into `main` in small pieces at least hourly.
- Handle the failure paths: bad file, model error, empty state. Show the user
  what went wrong and what to do next.
- Layout must work at 375px width.
- No commented-out code, no leftover debug output, no unused files.
