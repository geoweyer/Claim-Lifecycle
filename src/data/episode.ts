import type {
  Contract,
  EpisodeEvent,
  FundingTerms,
  MedicareBasis,
  PharmacyTerms,
  PlanDesign,
  ProviderEconomics,
  RxFill,
  ServiceLine,
} from '../engine/types';

// ILLUSTRATIVE DEFAULTS. Medicare amounts are 2026 national figures with no geographic
// adjustment; see BASIS for where each comes from. Procedure codes are intentionally
// omitted: CPT codes and descriptions are copyrighted by the American Medical
// Association, so services are described in plain language only.

/** Where each Medicare benchmark comes from. */
export const BASIS: Record<MedicareBasis, string> = {
  pfs: 'CMS Physician Fee Schedule relative value file, October 2026 release, national, conversion factor $33.4009.',
  anes: 'CMS 2026 national anesthesia conversion factor ($20.49754) times 38 units (18 base units, assumed, plus five hours of time).',
  asc: 'CMS ambulatory surgery center payment rates, October 2026 (Addendum AA).',
  opps: 'CMS hospital outpatient 2026 national rate for the service group, taken from published summaries rather than the CMS rate file.',
  ipps: 'CMS inpatient final rule, fiscal 2026: operating plus capital standardized amount ($7,276.76) times the relative weight for bypass surgery without catheterization or major complications (4.1888). No wage, teaching or outlier adjustments.',
  model: 'Modeled bundle of CMS Physician Fee Schedule amounts: two critical care visits, three hospital visits, four chest x-ray readings and an assistant at surgery at 16% of the surgeon fee.',
  global: 'Included in the 90-day global surgical package; no separate payment.',
};

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
  { id: 'pcp-preventive', stepId: 1, label: 'Annual preventive check-up with the primary care physician', kind: 'professional', medicare: 128.93, basis: 'pfs', costShare: 'preventive' },
  { id: 'cards-new', stepId: 2, label: 'New-patient cardiologist visit, moderately complex', kind: 'professional', medicare: 177.36, basis: 'pfs', costShare: dc },
  { id: 'ekg', stepId: 2, label: 'In-office EKG with interpretation', kind: 'professional', medicare: 15.36, basis: 'pfs', costShare: dc },
  { id: 'echo-facility', stepId: 3, label: 'Stress echo, hospital facility fee', kind: 'facility', medicare: 558.25, basis: 'opps', costShare: dc },
  { id: 'echo-pro', stepId: 3, label: "Stress echo, cardiologist's supervision and reading", kind: 'professional', medicare: 81.16, basis: 'pfs', costShare: dc },
  { id: 'cath-facility', stepId: 4, label: 'Diagnostic heart catheterization, surgery center facility fee', kind: 'facility', medicare: 1707.76, basis: 'asc', costShare: dc },
  { id: 'cath-pro', stepId: 4, label: "Heart catheterization, cardiologist's fee", kind: 'professional', medicare: 287.25, basis: 'pfs', costShare: dc },
  { id: 'cabg-facility', stepId: 5, label: 'Bypass surgery admission, ICU stay included', kind: 'facility', medicare: 30480.89, basis: 'ipps', costShare: dc },
  { id: 'cabg-surgeon', stepId: 5, label: "Surgeon's fee, including 90 days of follow-up", kind: 'professional', medicare: 2131.65, basis: 'pfs', costShare: dc },
  { id: 'cabg-anesthesia', stepId: 5, label: 'Anesthesia, about five hours', kind: 'professional', medicare: 778.91, basis: 'anes', costShare: dc },
  { id: 'cabg-other-pro', stepId: 5, label: 'Other inpatient physicians (ICU, radiology, assistant)', kind: 'professional', medicare: 1093.24, basis: 'model', costShare: dc },
  { id: 'rehab', stepId: 6, label: 'Monitored cardiac rehabilitation, 36 sessions', kind: 'facility', medicare: 4737.6, basis: 'opps', costShare: dc },
  { id: 'cards-followup', stepId: 7, label: 'Cardiology follow-up visit', kind: 'professional', medicare: 135.61, basis: 'pfs', costShare: dc },
  { id: 'surgeon-postop', stepId: 8, label: "Surgeon's post-operative visit (inside the global period)", kind: 'professional', medicare: 0, basis: 'global', costShare: 'globalPackage' },
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
