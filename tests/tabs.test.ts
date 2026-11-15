import { describe, expect, it } from 'vitest';
import { decodeInputs, decodeTab, DEFAULT_INPUTS, encodeLocation } from '../src/state';

describe('tab in the URL', () => {
  it('opens on home by default and for unknown names', () => {
    expect(decodeTab('')).toBe('home');
    expect(decodeTab('#nonsense')).toBe('home');
  });

  it('uses a bare name when the scenario is the default', () => {
    expect(encodeLocation('home', DEFAULT_INPUTS)).toBe('');
    expect(encodeLocation('money', DEFAULT_INPUTS)).toBe('money');
    expect(decodeTab('#money')).toBe('money');
  });

  it('carries the tab alongside changed settings', () => {
    const changed = { ...DEFAULT_INPUTS, deductible: 3000, step: 4 };
    const hash = '#' + encodeLocation('claim', changed);
    expect(decodeTab(hash)).toBe('claim');
    expect(decodeInputs(hash)).toEqual(changed);
  });
});
