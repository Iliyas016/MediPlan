# Extraction accuracy

Measured 14 November 2026 on production (`POST /api/extract`), one request
per document, against the values checked by hand in
`public/samples/SOURCES.md`.

| Document | Read in | Checked values correct | Fields flagged for the user |
| --- | --- | --- | --- |
| IU Anthem PPO $500 (2026) | 15.3 s | 6 of 6 | 4 (prescription tiers) |
| IU Anthem PPO HDHP (2026) | 16.1 s | 6 of 6 | 0 |
| Pittsburgh Panther HDHP (2026–27) | 16.8 s | 6 of 6 | 5 |
| Kentucky UK-PPO (2026–27), three network tiers | 22.3 s | 6 of 6 | 20 |
| Duke Plus PPO (2026) | 22.8 s | 6 of 6 | 8 |
| **Total** | 15–23 s | **30 of 30** | |

Checked values per plan: individual and family deductible, whether the
deductible is embedded (where the document states it), individual and family
out-of-pocket limit, and the primary care visit (plus the specialist visit for
Duke, whose deductible is $0).

## Limits of this check

- Five documents and six key values each, not every service row.
- Values the model is unsure of are not trusted silently: they are flagged on
  the review screen and the user confirms them before any calculation.
- The Kentucky plan has three in-network tiers, so most rows were flagged.
  The prompt was then changed to flag the tier choice once instead of every
  row (`src/lib/extract/prompt.ts`).

## After the tier change (same day, same documents)

| Document | Read in | Checked values correct | Fields flagged |
| --- | --- | --- | --- |
| IU Anthem PPO $500 | 15.8 s | 6 of 6 | 4 (prescription tiers) |
| IU Anthem PPO HDHP | 13.2 s | 6 of 6 | 0 |
| Pittsburgh Panther HDHP | 14.4 s | 6 of 6 | 4 |
| Kentucky UK-PPO | 15.9 s | 6 of 6 | 6, down from 20 |
| Duke Plus PPO | 16.9 s | 6 of 6 | 4, down from 8 |
| **Total** | 13–17 s | **30 of 30** | 18, down from 37 |
