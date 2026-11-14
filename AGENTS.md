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
`/profile` family questionnaire -> `/result` verdict. `/pricing` is static.

## Who owns which files

Edit only your own files. The two domain files are shared contracts: do not
change them without telling the team first.

- Ilyas: `src/app/page.tsx`, `src/app/profile/**`, `src/app/result/**`,
  `src/components/profile/**`, `src/components/result/**`, `src/lib/calc/**`
- Abuka: `src/app/api/**`, `src/app/start/**`, `src/components/start/**`,
  `src/lib/extract/**`, `src/lib/domain/reference-prices.ts`
- Borch: `public/samples/**`, `docs/research/**`, `src/app/pricing/**`,
  `src/components/ui/**`, `src/app/globals.css`
- Shared contracts: `src/lib/domain/plan.ts`, `src/lib/domain/profile.ts`,
  `src/lib/store/session.ts`

## Working rules

- Before every push run `npm test`, `npm run typecheck`, `npm run lint`.
  `main` must always build: Vercel deploys it.
- Work on your own branch, merge into `main` in small pieces at least hourly.
- Handle the failure paths: bad file, model error, empty state. Show the user
  what went wrong and what to do next.
- Layout must work at 375px width.
- No commented-out code, no leftover debug output, no unused files.
