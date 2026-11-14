import { adjudicateEpisode, round2 } from './engine/adjudicate';
import type { Accumulators, AdjudicatedLine, AdjudicatedRx, FundingTerms, ProviderEconomics } from './engine/types';
import {
  buildEvents,
  DEFAULT_CONTRACT,
  DEFAULT_PHARMACY,
  DEFAULT_PLAN,
  STEPS,
} from './data/episode';
import type { Inputs } from './state';

export type StepPhase =
  | 'preventive'
  | 'deductible'
  | 'deductibleMet'
  | 'coinsurance'
  | 'moopReached'
  | 'planPaysAll'
  | 'global';

export const PHASE_LABEL: Record<StepPhase, string> = {
  preventive: 'Preventive: no cost share',
  deductible: 'Applied to deductible',
  deductibleMet: 'Deductible met, coinsurance begins',
  coinsurance: 'Coinsurance',
  moopReached: 'Out-of-pocket maximum reached',
  planPaysAll: 'Plan pays 100%',
  global: 'Included in the surgery fee',
};

export interface StepView {
  id: number;
  title: string;
  setting: string;
  lines: AdjudicatedLine[];
  fills: AdjudicatedRx[];
  before: Accumulators;
  after: Accumulators;
  /** Medical lines only. */
  charge: number;
  /** Medical allowed plus the plan-recognized price of prescription claims. */
  allowed: number;
  /** Includes over-the-counter purchases. */
  patientPaid: number;
  planPaid: number;
  phase: StepPhase;
}

export interface EpisodeView {
  steps: StepView[];
  deductible: number;
  moop: number;
  totals: { charge: number; allowed: number; patientPaid: number; planPaid: number };
  econ: ProviderEconomics;
}

function phaseOf(s: Omit<StepView, 'phase'>, deductible: number, moop: number): StepPhase {
  if (s.lines.length > 0 && s.lines.every((l) => l.line.costShare === 'preventive')) return 'preventive';
  if (s.lines.length > 0 && s.lines.every((l) => l.line.costShare === 'globalPackage')) return 'global';
  if (s.before.oopMet >= moop) return 'planPaysAll';
  if (s.after.oopMet >= moop) return 'moopReached';
  if (s.before.deductibleMet < deductible) {
    return s.after.deductibleMet >= deductible ? 'deductibleMet' : 'deductible';
  }
  return 'coinsurance';
}

/** Run the engine for the visitor's inputs and shape the result for the timeline. */
export function buildEpisodeView(inputs: Inputs): EpisodeView {
  const plan = {
    ...DEFAULT_PLAN,
    deductible: inputs.deductible,
    coinsurance: inputs.coinsurancePct / 100,
    moop: inputs.moop,
    rxTierCopays: [inputs.rx1, inputs.rx2, inputs.rx3, inputs.rx4],
    rxSubjectToDeductible: inputs.hdhp,
  };
  const contract = {
    ...DEFAULT_CONTRACT,
    facility: { method: 'pctMedicare' as const, value: inputs.facilityPct / 100 },
    professional: { method: 'pctMedicare' as const, value: inputs.professionalPct / 100 },
  };
  const enabledOptionalRx = [inputs.antiplatelet && 'antiplatelet', inputs.pcsk9 && 'pcsk9'].filter(
    (x): x is string => Boolean(x),
  );
  const econ = economicsFrom(inputs);
  const results = adjudicateEpisode(buildEvents(), {
    plan,
    contract,
    econ,
    pharmacy: DEFAULT_PHARMACY,
    enabledOptionalRx,
  });

  let acc: Accumulators = { deductibleMet: 0, oopMet: 0 };
  const steps: StepView[] = STEPS.map((step) => {
    const lines = results.flatMap((e) => (e.type === 'medical' && e.result.line.stepId === step.id ? [e.result] : []));
    const fills = results.flatMap((e) => (e.type === 'rx' && e.result.fill.stepId === step.id ? [e.result] : []));
    const all = [...lines, ...fills];
    const before = acc;
    const after = all.length ? all[all.length - 1].after : acc;
    acc = after;
    const sum = (ns: number[]) => round2(ns.reduce((t, n) => t + n, 0));
    const base = {
      id: step.id,
      title: step.title,
      setting: step.setting,
      lines,
      fills,
      before,
      after,
      charge: sum(lines.map((l) => l.charge)),
      allowed: sum([...lines.map((l) => l.allowed), ...fills.map((f) => f.planPrice)]),
      patientPaid: sum(all.map((x) => x.patientPaid)),
      planPaid: sum(all.map((x) => x.planPaid)),
    };
    return { ...base, phase: phaseOf(base, plan.deductible, plan.moop) };
  });

  const total = (pick: (s: StepView) => number) => round2(steps.reduce((t, s) => t + pick(s), 0));
  return {
    steps,
    deductible: plan.deductible,
    moop: plan.moop,
    econ,
    totals: {
      charge: total((s) => s.charge),
      allowed: total((s) => s.allowed),
      patientPaid: total((s) => s.patientPaid),
      planPaid: total((s) => s.planPaid),
    },
  };
}

export function economicsFrom(inputs: Inputs): ProviderEconomics {
  return {
    chargeMultiple: { facility: inputs.chargeFacility, professional: inputs.chargeProfessional },
    costToCharge: { facility: inputs.ccrFacilityPct / 100, professional: inputs.ccrProfessionalPct / 100 },
    directShare: inputs.directPct / 100,
    badDebtRate: inputs.badDebtPct / 100,
  };
}

/** Funding terms for either model. The loss-ratio floor follows group size: 85% large group, 80% small. */
export function fundingFrom(inputs: Inputs, selfFunded: boolean): FundingTerms {
  return {
    model: selfFunded ? 'selfFunded' : 'fullyInsured',
    coveredEmployees: inputs.employees,
    annualPremiumPerEmployee: inputs.premium,
    employerShare: inputs.employerSharePct / 100,
    expectedClaimsPerEmployee: inputs.expectedClaims,
    adminPerEmployee: inputs.admin,
    mlrFloor: inputs.employees > 50 ? 0.85 : 0.8,
    specificAttachment: inputs.attachment,
    stopLossPremiumPerEmployee: inputs.stopLossPremium,
  };
}

export const usd0 = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const usd2 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
