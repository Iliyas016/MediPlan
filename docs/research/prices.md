# Reference prices

Typical in-network price per service, used to price a family's expected care
(`src/lib/domain/reference-prices.ts`). Researched 14 November 2026.

Rule: a price gets a source only if a public study of employer or commercial
claims states it. Otherwise it stays an estimate and the result screen labels
it "Estimate".

| Service | Price | What was measured | Source |
| --- | --- | --- | --- |
| Annual check-up | $116 | Average primary care office visit, commercial insurance, 2022. Used as the check-up price | [HCCI, Trends in primary care visits](https://healthcostinstitute.org/all-hcci-reports/trends-in-primary-care-visits/) |
| Doctor visit | $116 | Same | Same |
| Specialist visit | $183 | Median allowed amount, new-patient office visit of 45 to 59 minutes (CPT 99204), 2022 | [FAIR Health, seventh annual report](https://prnewswire.com/news-releases/retail-clinic-utilization-increased-202-percent-nationally-from-2021-to-2022-according-to-seventh-annual-fair-health-report-302094264.html) |
| Lab test or X-ray | $61 | Average price of level 1 imaging in a physician's office, 2022. $227 in a hospital outpatient department | [HCCI imaging brief](https://healthcostinstitute.org/wp-content/uploads/2026/03/Imaging-Brief_Final.pdf) |
| CT or MRI scan | $861 | Average outpatient lower-back MRI, large employer plans, 2018 | [Peterson-KFF, common health services](https://www.healthsystemtracker.org/chart-collection/how-costly-are-common-health-services-in-the-united-states/) |
| Emergency room visit | $2,453 | Average emergency department visit, large employer plans, 2019 | [Peterson-KFF, ED visits and affordability](https://www.healthsystemtracker.org/brief/emergency-department-visits-exceed-affordability-thresholds-for-many-consumers-with-private-insurance/) |
| Ambulance | $758 | Average allowed amount, advanced life support emergency ground transport, 2020 | [FAIR Health, via Healthcare Dive](https://www.healthcaredive.com/news/ground-ambulance-costs-continue-to-soar-study-finds/619195/) |
| Hospital stay | $24,680 | Average inpatient admission, large employer plans, 2018 | [Peterson-KFF, common health services](https://www.healthsystemtracker.org/chart-collection/how-costly-are-common-health-services-in-the-united-states/) |
| Outpatient surgery | $7,595 | Average outpatient knee meniscus repair, large employer plans | Same |
| Having a baby | $20,416 | Average pregnancy, childbirth and postpartum care, employer plans, 2021 to 2023 claims | [Peterson-KFF, pregnancy and childbirth costs](https://www.kff.org/health-costs/health-costs-associated-with-pregnancy-childbirth-and-postpartum-care/) |
| Generic prescription | $20 | Estimate | None found. California SB 17 reports (CDI, DMHC) have the data but blocked download |
| Brand-name prescription | $250 | Estimate | Same |
| Non-preferred brand prescription | $500 | Estimate | Same |
| Specialty prescription | $4,000 | Estimate | Same |
| Urgent care visit | $200 | Estimate | Only an insurer estimate quoted second-hand ($176, Cigna via Solv) |
| Therapy session | $150 | Estimate | Only vendor sites citing price-transparency files ($129 to $181 for CPT 90837) |
| Physical therapy session | $110 | Estimate | Only a hospital evaluation range ($151 to $215, Yale study) |

## Caveats

- Most figures are from 2018 to 2022 and are not adjusted for inflation, so
  they likely understate 2027 prices. Using the same basis for every plan keeps
  the comparison between plans fair, which is what the product needs.
- Large-employer averages hide wide regional variation.
- Open items, in order of impact: specialty drugs, brand-name drugs, therapy.
