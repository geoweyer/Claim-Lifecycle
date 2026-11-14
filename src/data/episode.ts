import type {
  Contract,
  EpisodeEvent,
  FundingTerms,
  PharmacyTerms,
  PlanDesign,
  ProviderEconomics,
  RxFill,
  ServiceLine,
} from '../engine/types';

// ILLUSTRATIVE DEFAULTS. Medicare amounts are approximate national figures that have
// not yet been checked against the current CMS fee schedule files. Procedure codes are
// intentionally omitted: CPT codes and descriptions are copyrighted by the American
// Medical Association, so services are described in plain language only.

export const STEPS: { id: number; title: string; setting: string }[] = [
  { id: 1, title: 'Annual preventive visit', setting: 'Primary care office' },
  { id: 2, title: 'Cardiologist visit and EKG', setting: 'Cardiology office' },
  { id: 3, title: 'Stress echocardiogram', setting: 'Hospital outpatient department' },
  { id: 4, title: 'Diagnostic heart catheterization', setting: 'Ambulatory surgery center' },
  { id: 5, title: 'Bypass surgery and ICU stay', setting: 'Hospital inpatient' },
  { id: 6, title: 'Cardiac rehabilitation', setting: 'Hospital outpatient department' },
  { id: 7, title: 'Cardiology follow-up', setting: 'Cardiology office' },
  { id: 8, title: 'Surgical follow-up', setting: 'Cardiac surgery office' },
];

const dc = 'deductibleCoinsurance' as const;

export const SERVICE_LINES: ServiceLine[] = [
  { id: 'pcp-preventive', stepId: 1, label: 'Annual preventive check-up with the primary care physician', kind: 'professional', medicare: 130, costShare: 'preventive' },
  { id: 'cards-new', stepId: 2, label: 'New-patient cardiologist visit, moderately complex', kind: 'professional', medicare: 165, costShare: dc },
  { id: 'ekg', stepId: 2, label: 'In-office EKG with interpretation', kind: 'professional', medicare: 15, costShare: dc },
  { id: 'echo-facility', stepId: 3, label: 'Stress echo, hospital facility fee', kind: 'facility', medicare: 520, costShare: dc },
  { id: 'echo-pro', stepId: 3, label: "Stress echo, cardiologist's supervision and reading", kind: 'professional', medicare: 80, costShare: dc },
  { id: 'cath-facility', stepId: 4, label: 'Diagnostic heart catheterization, surgery center facility fee', kind: 'facility', medicare: 1700, costShare: dc },
  { id: 'cath-pro', stepId: 4, label: "Heart catheterization, cardiologist's fee", kind: 'professional', medicare: 265, costShare: dc },
  { id: 'cabg-facility', stepId: 5, label: 'Bypass surgery admission, ICU stay included', kind: 'facility', medicare: 30000, costShare: dc },
  { id: 'cabg-surgeon', stepId: 5, label: "Surgeon's fee, including 90 days of follow-up", kind: 'professional', medicare: 2300, costShare: dc },
  { id: 'cabg-anesthesia', stepId: 5, label: 'Anesthesia, about five hours', kind: 'professional', medicare: 780, costShare: dc },
  { id: 'cabg-other-pro', stepId: 5, label: 'Other inpatient physicians (ICU, radiology, assistant)', kind: 'professional', medicare: 1200, costShare: dc },
  { id: 'rehab', stepId: 6, label: 'Monitored cardiac rehabilitation, 36 sessions', kind: 'facility', medicare: 4500, costShare: dc },
  { id: 'cards-followup', stepId: 7, label: 'Cardiology follow-up visit', kind: 'professional', medicare: 125, costShare: dc },
  { id: 'surgeon-postop', stepId: 8, label: "Surgeon's post-operative visit (inside the global period)", kind: 'professional', medicare: 0, costShare: 'globalPackage' },
];

const generic = { tier: 1, brand: false, otc: false } as const;

export const RX_FILLS: RxFill[] = [
  { id: 'aspirin', stepId: 2, label: 'Low-dose aspirin', purpose: 'Prevents clots', tier: 1, brand: false, otc: true, preventiveList: false, ingredientCost: 2 },
  { id: 'statin', stepId: 2, label: 'High-intensity statin', purpose: 'Lowers cholesterol', ...generic, preventiveList: true, ingredientCost: 3 },
  { id: 'beta-blocker', stepId: 2, label: 'Beta-blocker', purpose: 'Slows the heart and reduces angina', ...generic, preventiveList: true, ingredientCost: 5 },
  { id: 'nitro', stepId: 2, label: 'Under-the-tongue nitroglycerin', purpose: 'Relieves chest pain', ...generic, preventiveList: false, ingredientCost: 15 },
  { id: 'statin-dc', stepId: 5, label: 'High-intensity statin (continued)', purpose: 'Lowers cholesterol', ...generic, preventiveList: true, ingredientCost: 3 },
  { id: 'beta-blocker-dc', stepId: 5, label: 'Beta-blocker (continued)', purpose: 'Slows the heart', ...generic, preventiveList: true, ingredientCost: 5 },
  { id: 'antiplatelet', stepId: 5, label: 'Second antiplatelet', purpose: 'Protects vein grafts', ...generic, preventiveList: false, ingredientCost: 3, optional: true },
  { id: 'ace', stepId: 5, label: 'ACE inhibitor', purpose: 'Blood pressure and heart protection', ...generic, preventiveList: true, ingredientCost: 2 },
  { id: 'pain', stepId: 5, label: 'Short course of pain medication', purpose: 'Recovery from the chest incision', ...generic, preventiveList: false, ingredientCost: 8 },
  { id: 'pcsk9', stepId: 7, label: 'Injectable cholesterol drug (brand)', purpose: 'Further cholesterol lowering', tier: 4, brand: true, otc: false, preventiveList: false, ingredientCost: 550, optional: true },
];

/** Events in the order they hit the accumulators: medical lines first within a step, then fills. */
export function buildEvents(lines = SERVICE_LINES, fills = RX_FILLS): EpisodeEvent[] {
  const events: EpisodeEvent[] = [];
  for (const step of STEPS) {
    for (const line of lines.filter((l) => l.stepId === step.id)) events.push({ type: 'medical', line });
    for (const fill of fills.filter((f) => f.stepId === step.id)) events.push({ type: 'rx', fill });
  }
  return events;
}

export const DEFAULT_PLAN: PlanDesign = {
  deductible: 2000,
  coinsurance: 0.2,
  moop: 6000,
  rxTierCopays: [10, 35, 70, 150],
  rxSubjectToDeductible: false,
};

export const DEFAULT_CONTRACT: Contract = {
  facility: { method: 'pctMedicare', value: 2.5 },
  professional: { method: 'pctMedicare', value: 1.5 },
  lesserOfCharge: true,
};

export const DEFAULT_ECONOMICS: ProviderEconomics = {
  chargeMultiple: { facility: 6, professional: 3 },
  costToCharge: { facility: 0.25, professional: 0.4 },
  directShare: 0.6,
  badDebtRate: 0.1,
};

export const DEFAULT_PHARMACY: PharmacyTerms = {
  dispensingFee: 1,
  brandDiscount: 0.18,
  rebateRate: 0.3,
  rebatePassThrough: 0.9,
  spreadRate: 0,
};

export const DEFAULT_FUNDING: FundingTerms = {
  model: 'fullyInsured',
  coveredEmployees: 500,
  annualPremiumPerEmployee: 9300,
  employerShare: 0.83,
  expectedClaimsPerEmployee: 7950,
  adminPerEmployee: 900,
  mlrFloor: 0.85,
  specificAttachment: 75000,
  stopLossPremiumPerEmployee: 600,
};

export const OPTIONAL_RX_DEFAULT_ON = ['antiplatelet'];
