# Claim Lifecycle Explorer

An interactive walk through the life of a commercial medical claim, following one patient
from a preventive visit to bypass surgery and cardiac rehabilitation.

## Status

Phase 1 of 6: the calculation engine and its tests. The page currently shows a plain
table that exercises the engine; the visual timeline, claim cycle, money flow and
code-set views come in later phases.

## Run

    npm install
    npm test
    npm run dev

## Layout

- `src/engine/` benefit adjudication, contract pricing, pharmacy, provider margin, funding and risk
- `src/data/` the episode, its default prices and default plan, contract and funding terms
- `tests/` engine tests

## Caveats

- Prices are illustrative. Medicare amounts are approximate and have not yet been
  checked against the current CMS fee schedule files.
- Procedure codes are omitted. CPT codes and descriptions are copyrighted by the
  American Medical Association; services are described in plain language.
