# MediPlan

A web app for US families choosing employer health insurance during open
enrollment. Upload the plan summaries (SBC PDFs) from one or both spouses'
employers, describe your family, and get the cheapest way to cover everyone,
priced for a good year, an expected year and a bad year.

Built in 24 hours for BUSINESS CUP 2.0 (Money track).

## Why it exists

- Employer comparison tools only show that employer's plans. A two-income
  couple has two menus and several ways to split the family across them.
- The monthly premium is the visible price. The real yearly cost depends on
  the deductible, copays, coinsurance and out-of-pocket maximum, and on how
  much care the family actually uses.

## How it works

1. **Extract.** The model reads the numbers out of each SBC PDF into a fixed
   schema (`src/lib/domain/plan.ts`). The user reviews and corrects them.
2. **Profile.** The family describes who needs covering and what care they
   expect (`src/lib/domain/profile.ts`). Every field records whether it was
   answered or assumed, and assumptions are listed next to the result.
3. **Calculate.** Plain TypeScript, no model involved (`src/lib/calc`):
   - `cost.ts` prices one plan for one year: deductible (embedded or
     aggregate), copays, coinsurance, out-of-pocket maximum, exclusions,
     premiums, employer HSA money, spousal surcharge.
   - `combinations.ts` lists every way to cover the family: everyone on one
     plan, or each adult on their own employer's plan with the children on
     either side.
   - `scenarios.ts` builds a good, an expected and a bad year. The bad year
     adds an emergency (ambulance, ER, hospital admission) to whichever
     family member makes it most expensive.
   - `index.ts` ranks the arrangements. It never recommends one that another
     beats in every scenario, then picks the cheapest expected year whose
     bad-year shock the family's savings can absorb.
   - `year.ts` replays the bills a family logs during the year through the
     same cost-sharing code, in date order, to show what they owe for each
     bill, flag overcharges and track progress to each deductible.
4. **Track the year.** After enrolling, the family logs each bill on `/year`,
   sees what the plan says they owe, prices the next visit, and saves the
   year's key dates, including next open enrollment, to their calendar.

## Screens

| Route | What it does |
| --- | --- |
| `/` | Landing page |
| `/start` | Upload plan summaries, review the extracted numbers, add premiums |
| `/profile` | Family questionnaire with branching questions |
| `/result` | The recommendation, every option, scenarios, assumptions, prices used |
| `/year` | Plan-year tracker: bills, deductible progress, visit estimate, key dates |

There are no accounts. A visitor's plans and profile stay in their browser
(`src/lib/store/session.ts`).

## Status

| Part | State |
| --- | --- |
| Cost engine, scenarios, plan-year tracker | Working, covered by tests |
| Landing, family questionnaire, result and plan-year screens | Working |
| SBC extraction (`POST /api/extract`) and the `/start` screen | In progress |
| Paywall and test-mode checkout | In progress |
| Reference prices (`src/lib/domain/reference-prices.ts`) | Estimates, sources being added |

## Key dependencies

- Next.js, React, TypeScript, Tailwind CSS
- OpenAI API: reads the numbers out of uploaded SBC PDFs, nothing else
- zod: validates everything the model returns before it is used
- Stripe (test mode): checkout for the annual subscription
- Vitest: tests for the cost engine, the plan-year tracker and the questionnaire

## Run it

```bash
npm install
cp .env.example .env.local   # then add OPENAI_API_KEY
npm run dev
```

```bash
npm test          # engine tests
npm run typecheck
npm run lint
```

## Not insurance advice

The app compares costs from the documents and answers it is given. It does
not check provider networks or drug formularies yet, and it is not a licensed
insurance broker.
