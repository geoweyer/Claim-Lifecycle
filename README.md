# Claim Lifecycle Explorer

An interactive walk through the life of a commercial medical claim, following one patient
from a preventive visit to bypass surgery and cardiac rehabilitation.

## Status

All six planned phases are built, plus a home page and tabbed navigation. The home
page gives a narrative introduction and a drawing of the system in six parts; each part
pulls apart into its layers and links to the tab with the full detail. The site name
leads home from any tab.

1. The calculation engine, with tests.
2. The episode timeline with deductible and out-of-pocket meters, line-by-line step
   detail, the prescription track and editable plan, contract and copay inputs.
   Scenario settings are stored in the URL so a view can be shared.
3. The claim cycle: pick any claim in a step and follow it stage by stage, from the
   eligibility check through the claim form, clearinghouse, adjudication, remittance
   and explanation of benefits, to the patient bill and the provider's margin.
   Pharmacy claims follow their own six-stage path.
4. Money and risk: who absorbs the episode's cost under fully insured and self-funded
   plans, the plan's year as a flow from premium to claims, administration, stop-loss
   and margin, and what the providers keep.
5. Price lenses and languages: the same care priced from five viewpoints, and a field
   guide to the code sets and message standards, with the bypass surgery told in each.
6. Navigation and accessibility: a sticky bar with the step control and section links,
   a skip link, screen-reader status messages, keyboard-scrollable tables, and a
   visible list of sources for each Medicare amount.

## Run

    npm install
    npm test
    npm run dev

## Layout

- `src/engine/` benefit adjudication, contract pricing, pharmacy, provider margin, funding and risk
- `src/data/` the episode, its default prices and default plan, contract and funding terms
- `tests/` engine tests

## Sources and caveats

- Medicare amounts are 2026 national rates with no geographic adjustment. Physician,
  anesthesia, surgery center and inpatient amounts come from CMS rate files. The two
  hospital outpatient amounts (stress echo and cardiac rehabilitation) come from
  published summaries, because the CMS outpatient rate file sits behind a licence
  click-through. The source of each amount is recorded in `src/data/episode.ts`.
- Commercial prices are those Medicare amounts times the contract percentages, so they
  are illustrative, not observed market prices. Drug prices are rough estimates.
- Group-level figures (premium, other members' claims, administration, stop-loss) and
  provider cost ratios are assumptions the visitor can change, not observed data.
- People, organizations and identifiers on the claims are fictional. Diagnosis codes,
  inpatient procedure codes and the payment group shown on claims are illustrative.
- Procedure codes are omitted. CPT codes and descriptions are copyrighted by the
  American Medical Association; services are described in plain language.

## Third-party notices

- This material contains content from LOINC (http://loinc.org). LOINC is copyright © 1995-2026, Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.
- CPT is a registered trademark of the American Medical Association. No CPT codes or
  descriptions are included.
- Adjustment reason codes and the sample claim message lines follow standards
  published by X12.
- Medicare rates, ICD-10-CM, ICD-10-PCS, MS-DRG and place-of-service codes are works
  of the US government.
