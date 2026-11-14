import { useEffect, useState } from 'react';
import { DEFAULT_CONTRACT, DEFAULT_PLAN, OPTIONAL_RX_DEFAULT_ON } from './data/episode';

/** Everything the visitor can change. Kept flat so it serializes to the URL. */
export interface Inputs {
  deductible: number;
  /** Patient coinsurance as a whole percent. */
  coinsurancePct: number;
  moop: number;
  rx1: number;
  rx2: number;
  rx3: number;
  rx4: number;
  /** High-deductible plan: prescriptions apply to the deductible. */
  hdhp: boolean;
  /** Contract rates as a whole percent of Medicare. */
  facilityPct: number;
  professionalPct: number;
  antiplatelet: boolean;
  pcsk9: boolean;
  /** Step the visitor has advanced to (1-8). */
  step: number;
}

export const DEFAULT_INPUTS: Inputs = {
  deductible: DEFAULT_PLAN.deductible,
  coinsurancePct: DEFAULT_PLAN.coinsurance * 100,
  moop: DEFAULT_PLAN.moop,
  rx1: DEFAULT_PLAN.rxTierCopays[0],
  rx2: DEFAULT_PLAN.rxTierCopays[1],
  rx3: DEFAULT_PLAN.rxTierCopays[2],
  rx4: DEFAULT_PLAN.rxTierCopays[3],
  hdhp: DEFAULT_PLAN.rxSubjectToDeductible,
  facilityPct: DEFAULT_CONTRACT.facility.value * 100,
  professionalPct: DEFAULT_CONTRACT.professional.value * 100,
  antiplatelet: OPTIONAL_RX_DEFAULT_ON.includes('antiplatelet'),
  pcsk9: OPTIONAL_RX_DEFAULT_ON.includes('pcsk9'),
  step: 1,
};

const KEYS = Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[];

/** Only values that differ from the defaults go in the URL. */
export function encodeInputs(inputs: Inputs): string {
  const params = new URLSearchParams();
  for (const k of KEYS) {
    if (inputs[k] !== DEFAULT_INPUTS[k]) params.set(k, String(Number(inputs[k])));
  }
  return params.toString();
}

export function decodeInputs(hash: string): Inputs {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const out: Record<string, number | boolean> = { ...DEFAULT_INPUTS };
  for (const k of KEYS) {
    const raw = params.get(k);
    if (raw === null) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) continue;
    out[k] = typeof DEFAULT_INPUTS[k] === 'boolean' ? n !== 0 : n;
  }
  const inputs = out as unknown as Inputs;
  inputs.step = Math.min(8, Math.max(1, Math.round(inputs.step)));
  inputs.coinsurancePct = Math.min(100, inputs.coinsurancePct);
  return inputs;
}

/** Inputs held in React state and mirrored to the URL hash so a scenario can be shared. */
export function useInputs(): [Inputs, (patch: Partial<Inputs>) => void, () => void] {
  const [inputs, setInputs] = useState<Inputs>(() => decodeInputs(window.location.hash));

  useEffect(() => {
    const encoded = encodeInputs(inputs);
    const url = window.location.pathname + window.location.search + (encoded ? `#${encoded}` : '');
    window.history.replaceState(null, '', url);
  }, [inputs]);

  const update = (patch: Partial<Inputs>) => setInputs((prev) => ({ ...prev, ...patch }));
  const reset = () => setInputs(DEFAULT_INPUTS);
  return [inputs, update, reset];
}
