# Sample SBCs

Real, publicly posted Summary of Benefits and Coverage documents from US
employers. They are sample data for testing the upload pipeline: any screen
that offers them must label them as samples and send them through the same
`POST /api/extract` as a user's own upload.

All files were downloaded on 14 November 2026 from the URLs below and are
unchanged. "Checked" lists the in-network values read by `/api/extract` and
compared by hand with the PDF text.

| File | Employer and plan | Coverage period | Checked (in network) |
| --- | --- | --- | --- |
| `duke-plus-ppo-2026.pdf` | Duke University, Duke Plus PPO (UMR) | 01/01/2026 – 12/31/2026 | Deductible $0 / $0, out-of-pocket limit $0 / $0 as printed; primary care $20 copay, specialist $55 copay |
| `pitt-panther-hdhp-2026-27.pdf` | University of Pittsburgh, Panther HDHP with HSA (UPMC Health Plan) | 07/01/2026 – 06/30/2027 | Deductible $2,000 / $4,000, not embedded; out-of-pocket limit $5,000 / $10,000; primary care 30% coinsurance after deductible |
| `uky-ppo-2026-27.pdf` | University of Kentucky, UK-PPO (Anthem network) | 07/01/2026 – 06/30/2027 | Three network tiers; Tier 2 deductible $1,000 / $2,000, embedded; out-of-pocket limit $4,000 / $8,000; primary care $30 copay |
| `iu-anthem-ppo500-2026.pdf` | Indiana University, Anthem PPO $500 Deductible | 01/01/2026 – 12/31/2026 | Deductible $500 / $1,500, embedded; out-of-pocket limit $2,400 / $7,200; primary care 20% coinsurance after deductible |
| `iu-anthem-ppo-hdhp-2026.pdf` | Indiana University, Anthem PPO HDHP with HSA | 01/01/2026 – 12/31/2026 | Deductible $2,000 / $4,000, not embedded; out-of-pocket limit $4,000 / $8,000; primary care 20% coinsurance after deductible |

Values are "one person / family".

## Sources

- Duke: https://hr.duke.edu/sites/default/files/2026-Summary-of-Benefits-and-Coverage-Duke-Plus.pdf
- Pittsburgh: https://www.hr.pitt.edu/sites/default/files/All_Others%20SPACA_PPO_0726_0627_All%20campuses%20(HDHP).pdf
- Kentucky: https://hr.uky.edu/sites/default/files/sbc-ppo-2026.pdf
- Indiana PPO $500: https://hr.iu.edu/_docs/benefits-pubs/anthem-ppo500-sbc-2026.pdf
- Indiana PPO HDHP: https://hr.iu.edu/_docs/benefits-pubs/anthem-ppo-hdhp-sbc-2026.pdf
