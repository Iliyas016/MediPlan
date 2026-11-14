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
   - `index.ts` ranks the arrangements and recommends the cheapest expected
     year whose bad-year shock the family's savings can absorb.

There are no accounts. A visitor's plans and profile stay in their browser
(`src/lib/store/session.ts`).

## Status

| Part | State |
| --- | --- |
| Cost engine, arrangements, scenarios | Working, covered by tests |
| SBC extraction (`POST /api/extract`) | Contract and validation only, returns 501 |
| Upload, review, profile and result screens | Not built yet |
| Reference prices (`src/lib/domain/reference-prices.ts`) | Rough estimates, not yet sourced |

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
