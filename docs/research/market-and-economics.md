# Market and unit economics

Numbers behind the "Market" and "Subscription economics" slides. Every input
has a source opened and checked on 14 November 2026; every derived number
shows its formula. Inputs we chose ourselves are marked **Assumption**.

## Market

| Number | Value | Source |
| --- | --- | --- |
| Americans under 65 on employer coverage | ~157 million | [KFF Employer Health Benefits Survey 2026](https://www.kff.org/other-health/workers-now-pay-7471-on-average-annually-for-family-health-coverage-up-9-or-621-from-2025-benchmark-employer-health-benefits-survey-finds/), 22 Oct 2026 |
| Workers covered by their own employer's plan (each picks a plan every year) | 67.6 million | [KFF EHBS 2025](https://www.kff.org/health-costs/report/2025-employer-health-benefits-survey/) |
| Married couples where both spouses work (two benefit menus) | 30.7 million of 62.6 million (49.1%) | [BLS, Employment Characteristics of Families 2025, table 2](https://www.bls.gov/news.release/famee.t02.htm) |
| Worker's own yearly share of a family premium | $7,471 (total premium $28,303) | KFF EHBS 2026, link above |
| Overspending from choosing a dominated plan | majority of 23,894 employees; excess spending = 24% of the chosen plan's premium | [Bhargava, Loewenstein, Sydnor, QJE 2017](https://www.cmu.edu/dietrich/sds/docs/bhargava/BLS%20QJE%202017_Published.pdf), abstract |

Derived:

- **Money at stake per family:** 24% × $7,471 ≈ **$1,790 a year**. Illustrative:
  applies the study's ratio to today's average family contribution.
- **TAM:** 67.6 M plan choosers × $49 = **$3.3 B a year**.
- **SAM (core segment, two menus):** 30.7 M dual-earner couples × $49 =
  **$1.5 B a year**. Upper bound: not every working spouse is offered coverage.
- **Goal, $100 M ARR:** $100 M ÷ $49 = **2.04 M paying families = 6.6% of
  the core segment.**

## Unit economics

| Input | Value | Source |
| --- | --- | --- |
| Price | $49 a year, billed once | Live on the product (Stripe Checkout) |
| Card fee | 2.9% + $0.30 | [Stripe pricing](https://stripe.com/pricing) |
| Subscription billing fee | 0.7% | Stripe pricing, Billing pay-as-you-go |
| Model cost per SBC read | ≈ $0.08 | Measured: a real SBC is 20.6–22.1 k input tokens (IU PPO $500, Duke Plus PPO, 14 Nov 2026); plus ~2 k for instructions and schema and ≤3 k output, at $2 / $10 per million tokens ([OpenAI models](https://developers.openai.com/api/docs/models), gpt-6.1-sol) |
| SBCs per family | 4 | **Assumption:** two employers × two plans |
| Visitor → paying family | 2.1% | [RevenueCat, State of Subscription Apps 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/): median conversion for freemium apps. Our verdict is free and the rest is paid, which is freemium |
| First-year renewal of annual plans | 28% base, 40% target | RevenueCat SOSA 2026: ~72% of annual subscribers cancelled in year 1 in 2026; best category median first annual renewal (Business, Travel) is 40% ([by category](https://www.revenuecat.com/blog/growth/average-subscription-renewal-rates-by-app-category/)) |
| Paid search click, Finance & Insurance | $3.39 | [LocaliQ / WordStream search benchmarks 2026](https://localiq.com/blog/search-advertising-benchmarks/) |
| Partner revenue share | 30% of the first year | **Assumption** (HSA providers, credit unions, personal-finance creators) |

Derived:

- **Net revenue per paid year:** $49 − $1.72 card − $0.34 billing − $0.31 model
  (the payer's own four reads) = **$46.62**.
- **Free users' model cost per paying family:** $0.31 ÷ 2.1% = **$14.86**. Every
  visitor's reads are paid for, not only the 2.1% who buy; this is counted in
  every channel's CAC below.
- **LTV:** $46.62 ÷ (1 − renewal) = **$65** at 28% renewal, **$78** at 40%.
  Treats every year's renewal rate as the first year's, which is conservative:
  RevenueCat reports later renewals are higher than the first.

| Channel | CAC | LTV / CAC | Verdict |
| --- | --- | --- | --- |
| Organic search and content in open enrollment ("which health plan should I choose") | $14.86 (model cost only) | 4.4–5.2× | Main channel |
| Partners on 30% revenue share | 30% × $49 + $14.86 = $29.56 | 2.2–2.6× | Second channel |
| Paid search | $3.39 ÷ 2.1% + $14.86 = $176 | 0.4× | Do not buy |

Payback: the annual price is collected upfront, so every channel except paid
search pays back on the first purchase.

## Why the subscription renews

Open enrollment comes back every November with new plans and new premiums, so
the decision has to be made again. Between seasons the plan-year tracker keeps
the family's bills and deductible progress and sends the FSA/HSA and
enrollment dates to their calendar. The 40% target is the median of the best
RevenueCat categories; the 28% base case is the 2026 all-app median.
