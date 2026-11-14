import { describe, expect, it } from 'vitest';
import {
  adjudicateEpisode,
  adjudicateRx,
  allowedAmount,
  summarizeByStep,
  type EpisodeInputs,
} from '../src/engine/adjudicate';
import { allocateRisk, fundingSummary, providerMargin } from '../src/engine/economics';
import {
  buildEvents,
  DEFAULT_CONTRACT,
  DEFAULT_ECONOMICS,
  DEFAULT_FUNDING,
  DEFAULT_PHARMACY,
  DEFAULT_PLAN,
  RX_FILLS,
  SERVICE_LINES,
} from '../src/data/episode';

const inputs: EpisodeInputs = {
  plan: DEFAULT_PLAN,
  contract: DEFAULT_CONTRACT,
  econ: DEFAULT_ECONOMICS,
  pharmacy: DEFAULT_PHARMACY,
  enabledOptionalRx: ['antiplatelet'],
};

const medicalOnly = () => summarizeByStep(adjudicateEpisode(buildEvents(SERVICE_LINES, []), inputs));

describe('medical accumulator walk', () => {
  const steps = medicalOnly();
  const paid = (id: number) => steps.find((s) => s.stepId === id)!.patientPaid;

  it('preventive visit costs the patient nothing', () => {
    expect(paid(1)).toBe(0);
    expect(steps[0].planPaid).toBe(195);
  });

  it('reproduces the deductible, coinsurance and MOOP progression', () => {
    expect(paid(2)).toBe(270);
    expect(paid(3)).toBe(1420);
    expect(paid(4)).toBe(1177.5);
    expect(paid(5)).toBe(3132.5);
    expect(paid(6)).toBe(0);
    expect(paid(7)).toBe(0);
    expect(paid(8)).toBe(0);
  });

  it('meets the deductible in step 4 and the MOOP in step 5', () => {
    expect(steps[2].after.deductibleMet).toBe(1690);
    expect(steps[3].after.deductibleMet).toBe(2000);
    expect(steps[4].after.oopMet).toBe(6000);
  });

  it('never lets the patient exceed the MOOP', () => {
    const total = steps.reduce((t, s) => t + s.patientPaid, 0);
    expect(total).toBe(DEFAULT_PLAN.moop);
  });

  it('pays nothing separately inside the surgical global period', () => {
    expect(steps[7].allowed).toBe(0);
  });
});

describe('contract pricing', () => {
  const facility = SERVICE_LINES.find((l) => l.id === 'cabg-facility')!;
  const charge = 180000;

  it('prices as a percent of Medicare', () => {
    expect(allowedAmount(facility, DEFAULT_CONTRACT, charge)).toBe(75000);
  });

  it('prices as a percent of charge', () => {
    const c = { ...DEFAULT_CONTRACT, facility: { method: 'pctCharge' as const, value: 0.5 } };
    expect(allowedAmount(facility, c, charge)).toBe(90000);
  });

  it('applies the lesser-of-charge clause', () => {
    const c = { ...DEFAULT_CONTRACT, facility: { method: 'caseRate' as const, value: 200000 } };
    expect(allowedAmount(facility, c, charge)).toBe(180000);
    expect(allowedAmount(facility, { ...c, lesserOfCharge: false }, charge)).toBe(200000);
  });
});

describe('pharmacy', () => {
  const fill = (id: string) => RX_FILLS.find((f) => f.id === id)!;
  const fresh = { deductibleMet: 0, oopMet: 0 };

  it('charges the lesser of the copay and the drug price', () => {
    const r = adjudicateRx(fill('statin'), DEFAULT_PLAN, DEFAULT_PHARMACY, fresh);
    expect(r.planPrice).toBe(4);
    expect(r.patientPaid).toBe(4);
    expect(r.planPaid).toBe(0);
  });

  it('treats over-the-counter aspirin as a cash purchase with no claim', () => {
    const r = adjudicateRx(fill('aspirin'), DEFAULT_PLAN, DEFAULT_PHARMACY, fresh);
    expect(r.countsTowardAccumulators).toBe(false);
    expect(r.after.oopMet).toBe(0);
    expect(r.patientPaid).toBe(2);
  });

  it('costs the patient nothing once the MOOP is met', () => {
    const r = adjudicateRx(fill('pcsk9'), DEFAULT_PLAN, DEFAULT_PHARMACY, { deductibleMet: 2000, oopMet: 6000 });
    expect(r.patientPaid).toBe(0);
    expect(r.planPaid).toBe(452);
    expect(r.rebateTotal).toBe(165);
    expect(r.rebateToSponsor).toBe(148.5);
  });

  it('exempts preventive-list drugs from an HDHP deductible', () => {
    const hdhp = { ...DEFAULT_PLAN, rxSubjectToDeductible: true };
    expect(adjudicateRx(fill('statin'), hdhp, DEFAULT_PHARMACY, fresh).patientPaid).toBe(4);
    const nitro = adjudicateRx(fill('nitro'), hdhp, DEFAULT_PHARMACY, fresh);
    expect(nitro.patientPaid).toBe(16);
    expect(nitro.after.deductibleMet).toBe(16);
  });

  it('keeps the whole episode at the MOOP when fills are included', () => {
    const results = adjudicateEpisode(buildEvents(), inputs);
    const accumulating = results
      .filter((e) => e.type === 'medical' || e.result.countsTowardAccumulators)
      .reduce((t, e) => t + e.result.patientPaid, 0);
    expect(Math.round(accumulating * 100) / 100).toBe(DEFAULT_PLAN.moop);
  });
});

describe('risk and funding', () => {
  it('puts plan dollars on the carrier when fully insured', () => {
    expect(allocateRisk(6000, 93000, DEFAULT_FUNDING)).toEqual({
      patient: 6000,
      employer: 0,
      carrier: 93000,
      stopLossCarrier: 0,
    });
  });

  it('puts plan dollars on the employer up to the stop-loss attachment when self-funded', () => {
    const r = allocateRisk(6000, 93000, { ...DEFAULT_FUNDING, model: 'selfFunded' });
    expect(r.employer).toBe(75000);
    expect(r.stopLossCarrier).toBe(18000);
    expect(r.carrier).toBe(0);
  });

  it('leaves the fully insured employer cost unchanged by the episode', () => {
    const without = fundingSummary(0, DEFAULT_FUNDING);
    const withEpisode = fundingSummary(93000, DEFAULT_FUNDING);
    expect(withEpisode.employerNetCost).toBe(without.employerNetCost);
    expect(withEpisode.margin).toBe(without.margin - 93000);
  });

  it('raises the self-funded employer cost by the episode net of stop-loss', () => {
    const f = { ...DEFAULT_FUNDING, model: 'selfFunded' as const };
    const delta = fundingSummary(93000, f).employerNetCost - fundingSummary(0, f).employerNetCost;
    expect(delta).toBe(75000);
  });

  it('owes an MLR rebate when claims fall below the floor', () => {
    const f = { ...DEFAULT_FUNDING, expectedClaimsPerEmployee: 7000 };
    const s = fundingSummary(0, f);
    expect(s.medicalLossRatio).toBeLessThan(0.85);
    expect(s.mlrRebate).toBe(452500);
  });
});

describe('provider margin', () => {
  it('separates contribution margin from fully allocated margin', () => {
    const results = adjudicateEpisode(buildEvents(SERVICE_LINES, []), inputs);
    const cabg = results.find((e) => e.type === 'medical' && e.result.line.id === 'cabg-facility')!;
    if (cabg.type !== 'medical') throw new Error('expected medical');
    const m = providerMargin(cabg.result, DEFAULT_ECONOMICS);
    expect(m.charge).toBe(180000);
    expect(m.directCost).toBe(27000);
    expect(m.indirectCost).toBe(18000);
    expect(m.contributionMargin).toBeGreaterThan(m.fullMargin);
    expect(m.fullMargin).toBe(Math.round((m.collected - 45000) * 100) / 100);
  });
});
