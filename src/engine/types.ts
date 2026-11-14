// Shared types for the claim lifecycle engine. All money is in US dollars.

export type ServiceKind = 'facility' | 'professional';

export type ContractMethod = 'pctMedicare' | 'pctCharge' | 'caseRate';

export interface ContractTerm {
  method: ContractMethod;
  /** Multiplier for pctMedicare / pctCharge (1.5 = 150%), or a dollar amount for caseRate. */
  value: number;
}

export interface Contract {
  facility: ContractTerm;
  professional: ContractTerm;
  /** Pay the lesser of the contract rate and the billed charge. */
  lesserOfCharge: boolean;
}

export type CostShareRule =
  | 'deductibleCoinsurance'
  | 'preventive' // ACA preventive service: plan pays 100%
  | 'globalPackage' // inside a surgical global period: no separate payment
  | 'copay';

export type MedicareBasis = 'pfs' | 'anes' | 'asc' | 'opps' | 'ipps' | 'model' | 'global';

export interface ServiceLine {
  id: string;
  stepId: number;
  /** Plain-language description. CPT codes are deliberately not stored. */
  label: string;
  kind: ServiceKind;
  /** National Medicare payment for the line (all units). */
  medicare: number;
  /** Source of the Medicare amount. */
  basis: MedicareBasis;
  costShare: CostShareRule;
  /** Flat copay when costShare is 'copay'. */
  copay?: number;
}

export interface PlanDesign {
  deductible: number;
  /** Patient coinsurance after the deductible (0.2 = 20%). */
  coinsurance: number;
  /** In-network out-of-pocket maximum; includes prescriptions. */
  moop: number;
  /** Copay by drug tier, index 0 = tier 1. */
  rxTierCopays: number[];
  /** HDHP style: prescriptions are subject to the deductible unless on the preventive drug list. */
  rxSubjectToDeductible: boolean;
}

export interface ProviderEconomics {
  /** Billed charge as a multiple of Medicare, by service kind. */
  chargeMultiple: Record<ServiceKind, number>;
  /** Cost-to-charge ratio, by service kind. */
  costToCharge: Record<ServiceKind, number>;
  /** Share of cost that is direct (labor, supplies, implants). */
  directShare: number;
  /** Share of patient responsibility that is never collected. */
  badDebtRate: number;
}

export interface Accumulators {
  deductibleMet: number;
  oopMet: number;
}

export interface AdjudicatedLine {
  line: ServiceLine;
  charge: number;
  allowed: number;
  /** Charge minus allowed: the provider's contractual write-off. */
  contractualAdjustment: number;
  deductible: number;
  coinsurance: number;
  copay: number;
  patientPaid: number;
  planPaid: number;
  after: Accumulators;
}

export interface RxFill {
  id: string;
  stepId: number;
  label: string;
  purpose: string;
  /** 1-based formulary tier. */
  tier: number;
  brand: boolean;
  /** Over the counter: paid in cash, no claim, no accumulator credit. */
  otc: boolean;
  /** On the HDHP preventive drug list: covered before the deductible. */
  preventiveList: boolean;
  /** Pharmacy acquisition cost for a 30-day supply (generic) or list price (brand). */
  ingredientCost: number;
  /** Optional toggle: fill is excluded unless enabled. */
  optional?: boolean;
}

export interface PharmacyTerms {
  dispensingFee: number;
  /** PBM discount off list price for brand drugs. */
  brandDiscount: number;
  /** Manufacturer rebate as a share of brand list price. */
  rebateRate: number;
  /** Share of the rebate passed through to the plan sponsor. */
  rebatePassThrough: number;
  /** Markup the PBM keeps between what the plan pays and what the pharmacy receives. */
  spreadRate: number;
}

export interface AdjudicatedRx {
  fill: RxFill;
  /** Price the plan recognizes at the counter (0 for OTC). */
  planPrice: number;
  /** What the pharmacy is reimbursed (plan price less PBM spread). */
  pharmacyPaid: number;
  pbmSpread: number;
  /** Portion of the patient's payment applied to the deductible. */
  deductible: number;
  patientPaid: number;
  planPaid: number;
  rebateTotal: number;
  rebateToSponsor: number;
  rebateKeptByPbm: number;
  /** False for OTC or cash purchases. */
  countsTowardAccumulators: boolean;
  after: Accumulators;
}

export type EpisodeEvent =
  | { type: 'medical'; line: ServiceLine }
  | { type: 'rx'; fill: RxFill };

export type AdjudicatedEvent =
  | { type: 'medical'; result: AdjudicatedLine }
  | { type: 'rx'; result: AdjudicatedRx };

export type FundingModel = 'fullyInsured' | 'selfFunded';

export interface FundingTerms {
  model: FundingModel;
  coveredEmployees: number;
  /** Fully insured: total annual premium per employee. */
  annualPremiumPerEmployee: number;
  /** Share of premium (or premium-equivalent) paid by the employer. */
  employerShare: number;
  /** Expected annual claims per employee, excluding this episode. */
  expectedClaimsPerEmployee: number;
  /** Carrier or TPA administrative cost per employee per year. */
  adminPerEmployee: number;
  /** Minimum medical loss ratio (0.85 large group, 0.80 small group). */
  mlrFloor: number;
  /** Self-funded: specific stop-loss attachment point per member. */
  specificAttachment: number;
  /** Self-funded: stop-loss premium per employee per year. */
  stopLossPremiumPerEmployee: number;
}
