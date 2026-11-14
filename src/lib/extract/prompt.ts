/**
 * Instructions for reading one Summary of Benefits and Coverage. The model is a
 * transcriber: it copies numbers and wording, it does not compute or advise.
 */
export const EXTRACTION_INSTRUCTIONS = `You read a US health plan's Summary of Benefits and Coverage (SBC) and copy its terms into the given JSON schema.

Rules:
- Copy only what the document says. Never estimate, compute, or fill a value from general knowledge. If a value is not in the document, use null (or kind "not_found" for a service).
- Use the IN-NETWORK column only. Ignore out-of-network values.
- Dollar amounts are plain numbers: "$1,500" -> 1500.
- Set isSbc to false if the document is not a health plan's benefits summary; fill the rest with nulls and empty lists.

Plan level:
- name: the plan name as printed (e.g. "Gold PPO 500"), without the insurer's marketing slogan.
- planType: the plan type stated in the document. Use "HDHP" when the document calls the plan a high deductible health plan or says it is HSA-qualified. Use "OTHER" if the type is stated but is none of the options; null if not stated.
- hsaEligible: true only if the document says the plan can be paired with a Health Savings Account (HSA); false if it says it cannot or mentions no HSA and is clearly not an HDHP; null if unclear.
- deductibleIndividual / deductibleFamily: the overall in-network deductible for one person and for a family.
- deductibleEmbedded: true if the document says each family member only has to meet their own individual deductible (an "embedded" deductible); false if the whole family deductible must be met before the plan pays for anyone; null if the document does not say.
- oopMaxIndividual / oopMaxFamily: the in-network out-of-pocket limit for one person and for a family.
- exclusions: the items listed under "Services Your Plan Generally Does NOT Cover" (excluded services), one string per item, as written.
- uncertainFields: list any plan-level field whose value you are not confident about (unclear table, conflicting numbers, value read from a footnote).

Services (one entry per key, in-network cost for the member):
- preventive: preventive care / screening / immunization
- primaryCare: primary care visit to treat an injury or illness
- specialist: specialist visit
- diagnosticTest: diagnostic test (x-ray, blood work)
- imaging: imaging (CT/PET scans, MRIs)
- genericDrug: generic drugs (retail, 30-day supply)
- preferredBrandDrug: preferred brand drugs (retail, 30-day supply)
- nonPreferredDrug: non-preferred brand drugs (retail, 30-day supply)
- specialtyDrug: specialty drugs
- urgentCare: urgent care
- emergencyRoom: emergency room care (facility fee)
- ambulance: emergency medical transportation
- hospitalStay: hospital stay, facility fee (e.g. hospital room)
- outpatientSurgery: outpatient surgery, facility fee (e.g. ambulatory surgery center)
- mentalHealthVisit: outpatient mental health / behavioral health services
- delivery: childbirth/delivery facility services
- physicalTherapy: rehabilitation services (physical therapy)

For each service:
- asWritten: copy the in-network cell text exactly as printed.
- kind: "free" for "No charge" / "$0"; "copay" for a flat dollar amount; "coinsurance" for a percentage; "not_covered" if the document says it is not covered; "not_found" if the row is missing.
- copayAmount: the dollar amount for kind "copay", otherwise null.
- coinsurancePercent: the percentage as printed for kind "coinsurance" (20 for "20%"), otherwise null.
- afterDeductible: false if the deductible does not apply to this service, true if the member pays in full until the deductible is met and then the copay or coinsurance applies. Decide from, in order: the cell or its "Limitations" note ("deductible does not apply", "after deductible"); the answer to "Are there services covered before you meet your deductible?"; the chart's general sentence (e.g. "All coinsurance costs shown in this chart are after your deductible has been met"). Use null only for "free", "not_covered", "not_found", or when none of these settle it.
- If the plan has several in-network tiers (e.g. a preferred tier and a standard network), use the plan's standard in-network tier for every value, and list "deductible.individual" etc. in uncertainFields.
- uncertain: true if the cell is ambiguous, combines several charges (e.g. "$250 copay then 20% coinsurance"), differs between tiers or settings, or you had to choose between rows. When a cell combines charges, record the first charge the member pays and set uncertain to true.

Do not add advice, explanations, or totals.`;
