# Claim Lifecycle Explorer

An interactive walk through the life of a commercial medical claim, following one patient
from a preventive visit to bypass surgery and cardiac rehabilitation.

## Status

Phases 1 to 3 of 6 are built:

1. The calculation engine, with tests.
2. The episode timeline with deductible and out-of-pocket meters, line-by-line step
   detail, the prescription track and editable plan, contract and copay inputs.
   Scenario settings are stored in the URL so a view can be shared.
3. The claim cycle: pick any claim in a step and follow it stage by stage, from the
   eligibility check through the claim form, clearinghouse, adjudication, remittance
   and explanation of benefits, to the patient bill and the provider's margin.
   Pharmacy claims follow their own six-stage path.

The money flow, risk view, price lenses and code-set views come in later phases.

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
- People, organizations and identifiers on the claims are fictional. Diagnosis codes,
  inpatient procedure codes and the payment group shown on claims are illustrative.
- Procedure codes are omitted. CPT codes and descriptions are copyrighted by the
  American Medical Association; services are described in plain language.
