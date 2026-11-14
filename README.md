<img src="public/brand/mediplan-logo.png" alt="MediPlan" width="320">

**Which health plan should cover each person in your family?**

MediPlan is a web app for US families choosing employer health insurance
during open enrollment. Upload the plan summaries (SBC PDFs) from one or both
spouses' employers, describe your family, and get the cheapest way to cover
everyone, priced for a good, an expected and a bad year. After enrolling, the
family logs each medical bill and MediPlan checks it against the plan.

Live: **https://medi-plan-iota.vercel.app** · Built in 24 hours for BUSINESS
CUP 2.0, Money track.

## Try it in two minutes

1. Open https://medi-plan-iota.vercel.app and press **Try with sample plans**.
   Three real 2026 plan documents from Indiana University and the University
   of Kentucky are read live by the same pipeline as an upload (about 20 s).
2. Press **Continue to your family**. Skip any question you like: every gap
   becomes a listed assumption.
3. Press **See my best option**. To open the full comparison and the
   plan-year tracker, pay with Stripe's test card `4242 4242 4242 4242`, any
   future date and any CVC. No real money moves.

No account is needed. Everything a visitor enters stays in their browser.

## Why it exists

- Employer comparison tools (ALEX, Nayya, Healthee) are sold to employers and
  only see that employer's plans. A two-income couple has two menus and
  several ways to split the family across them.
- The monthly premium is the visible price. The real yearly cost depends on
  the deductible, copays, coinsurance and out-of-pocket limit, and on how much
  care the family uses. In a study of 23,894 employees, most chose a plan that
  another option beat in every scenario (Bhargava, Loewenstein and Sydnor,
  QJE 2017).

## How it works

The model only reads documents. Every decision is plain, tested TypeScript.

1. **Read** (`src/lib/extract`). `POST /api/extract` sends the PDF to the
   OpenAI Responses API with a strict schema, validates the answer with zod
   and flags anything the model was unsure of. The user confirms flagged
   fields and adds premiums, which no SBC contains.
2. **Profile** (`src/components/profile`). Branching questions build the
   household. Each value records whether it was answered or assumed, and the
   result lists every assumption.
3. **Decide** (`src/lib/calc`).
   - `cost.ts`: one event-by-event tracker applies deductibles (embedded or
     aggregate), copays, coinsurance, out-of-pocket limits and exclusions,
     plus premiums, employer HSA money and spousal surcharges.
   - `combinations.ts`: every way to cover the family across both employers.
   - `scenarios.ts`: a good, an expected and a bad year; the bad year adds an
     ambulance, ER visit and hospital stay to whoever it costs most.
   - `index.ts`: never recommends an option another one beats in every
     scenario, then picks the cheapest expected year whose bad-year shock the
     family's savings can absorb.
   - `year.ts`: replays logged bills through the same tracker to show what the
     family owes, flag overcharges and price the next visit.
4. **Pay** (`src/app/api/checkout`). A $49/year Stripe Checkout in test mode;
   the server verifies the session before unlocking.

## Evidence

- **Extraction**: 30 of 30 hand-checked key values correct across five real
  SBCs, 13 to 17 s per document. Details: `docs/research/extraction.md`.
- **Prices**: 10 of 17 service prices cite Peterson-KFF, HCCI or FAIR Health
  claims research; the rest are labelled "Estimate" in the product. Details:
  `docs/research/prices.md`.
- **Samples**: sources and premiums for every sample document:
  `public/samples/SOURCES.md`.
- **Tests**: 57 unit tests on the engine, tracker, questionnaire, calendar,
  extraction normalizer and checkout (`npm test`).

## Screens

| Route | What it does |
| --- | --- |
| `/` | Landing page |
| `/start` | Upload plan summaries or try samples, review the numbers, add premiums |
| `/profile` | Family questionnaire with branching questions |
| `/result` | The recommendation, every option, scenarios, assumptions, prices used |
| `/year` | Plan-year tracker: bills, deductible progress, visit estimate, key dates |

## Key dependencies

- Next.js, React, TypeScript, Tailwind CSS, deployed on Vercel
- OpenAI API: reads the numbers out of uploaded SBC PDFs, nothing else
- zod: validates everything the model returns before it is used
- Stripe (test mode): checkout for the annual subscription
- Vitest: unit tests

## Run it locally

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY; STRIPE_SECRET_KEY is optional
npm run dev
```

```bash
npm test
npm run typecheck
npm run lint
```

Without `STRIPE_SECRET_KEY` the paywall offers a labelled demo unlock instead
of checkout.

## Not insurance or medical advice

MediPlan compares costs from the documents and answers it is given. It does
not yet check provider networks or drug lists, and it is not a licensed
insurance broker.
