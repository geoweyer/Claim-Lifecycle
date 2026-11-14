import { describe, expect, it } from 'vitest';
import { buildEpisodeView } from '../src/episodeView';
import { decodeInputs, DEFAULT_INPUTS, encodeInputs } from '../src/state';

describe('scenario in the URL', () => {
  it('writes nothing for the default scenario', () => {
    expect(encodeInputs(DEFAULT_INPUTS)).toBe('');
    expect(decodeInputs('')).toEqual(DEFAULT_INPUTS);
  });

  it('round-trips a changed scenario', () => {
    const changed = { ...DEFAULT_INPUTS, deductible: 3500, selfFunded: true, pcsk9: true, step: 6, chargeFacility: 4.5 };
    expect(decodeInputs('#' + encodeInputs(changed))).toEqual(changed);
  });

  it('ignores unknown, negative and non-numeric values', () => {
    expect(decodeInputs('#deductible=-5&moop=abc&nonsense=1')).toEqual(DEFAULT_INPUTS);
  });

  it('clamps out-of-range values', () => {
    const d = decodeInputs('#step=99&coinsurancePct=250&employees=0');
    expect(d.step).toBe(8);
    expect(d.coinsurancePct).toBe(100);
    expect(d.employees).toBe(1);
  });
});

describe('episode view', () => {
  const view = buildEpisodeView(DEFAULT_INPUTS);

  it('has eight steps whose totals add up', () => {
    expect(view.steps).toHaveLength(8);
    const allowed = view.steps.reduce((t, s) => t + s.allowed, 0);
    expect(Math.round(allowed * 100) / 100).toBe(view.totals.allowed);
    expect(Math.round((view.totals.planPaid + view.totals.patientPaid) * 100) / 100).toBe(
      Math.round((view.totals.allowed + 2) * 100) / 100, // plus the $2 over-the-counter aspirin
    );
  });

  it('labels each step with the right phase', () => {
    expect(view.steps.map((s) => s.phase)).toEqual([
      'preventive',
      'deductible',
      'deductible',
      'deductibleMet',
      'moopReached',
      'planPaysAll',
      'planPaysAll',
      'global',
    ]);
  });

  it('survives a deductible above the out-of-pocket maximum', () => {
    const v = buildEpisodeView({ ...DEFAULT_INPUTS, deductible: 9000, moop: 4000 });
    const accumulating = v.steps[7].after.oopMet;
    expect(accumulating).toBe(4000);
  });
});
