import { round2 } from './adjudicate';
import type { AdjudicatedLine, FundingTerms, ProviderEconomics } from './types';

export interface ProviderMargin {
  charge: number;
  allowed: number;
  collected: number;
  badDebt: number;
  directCost: number;
  indirectCost: number;
  /** Collected minus direct cost. */
  contributionMargin: number;
  /** Collected minus direct and indirect cost. */
  fullMargin: number;
}

/** Provider-side economics for one adjudicated line. */
export function providerMargin(r: AdjudicatedLine, econ: ProviderEconomics): ProviderMargin {
  const cost = r.charge * econ.costToCharge[r.line.kind];
  const directCost = round2(cost * econ.directShare);
  const indirectCost = round2(cost - directCost);
  const badDebt = round2(r.patientPaid * econ.badDebtRate);
  const collected = round2(r.allowed - badDebt);
  return {
    charge: r.charge,
    allowed: r.allowed,
    collected,
    badDebt,
    directCost,
    indirectCost,
    contributionMargin: round2(collected - directCost),
    fullMargin: round2(collected - directCost - indirectCost),
  };
}

/** The same service line described from each viewpoint's meaning of "price". */
export interface PriceLenses {
  chargemaster: number;
  medicareBenchmark: number;
  allowed: number;
  planPaid: number;
  patientPaid: number;
  providerCost: number;
}

export function priceLenses(r: AdjudicatedLine, econ: ProviderEconomics): PriceLenses {
  return {
    chargemaster: r.charge,
    medicareBenchmark: r.line.medicare,
    allowed: r.allowed,
    planPaid: r.planPaid,
    patientPaid: r.patientPaid,
    providerCost: round2(r.charge * econ.costToCharge[r.line.kind]),
  };
}

export interface RiskAllocation {
  patient: number;
  employer: number;
  carrier: number;
  stopLossCarrier: number;
}

/**
 * Who absorbs the cost of the episode.
 * Fully insured: the carrier pays every plan dollar; the employer's cost is fixed at the premium.
 * Self-funded: the employer pays plan dollars up to the specific attachment point, then stop-loss pays.
 */
export function allocateRisk(
  patientPaid: number,
  planPaid: number,
  funding: FundingTerms,
): RiskAllocation {
  if (funding.model === 'fullyInsured') {
    return { patient: round2(patientPaid), employer: 0, carrier: round2(planPaid), stopLossCarrier: 0 };
  }
  const employer = Math.min(planPaid, funding.specificAttachment);
  return {
    patient: round2(patientPaid),
    employer: round2(employer),
    carrier: 0,
    stopLossCarrier: round2(planPaid - employer),
  };
}

export interface FundingSummary {
  /** Money collected to fund the plan for the year. */
  totalFunding: number;
  employerContribution: number;
  employeeContribution: number;
  /** Plan-paid claims for the whole group, including this episode. */
  claims: number;
  admin: number;
  stopLossPremium: number;
  stopLossRecovery: number;
  /** Fully insured only. */
  medicalLossRatio: number | null;
  /** Fully insured only: premium refunded when the MLR falls below the floor. */
  mlrRebate: number;
  /** Carrier underwriting margin (fully insured) or employer surplus against budget (self-funded). */
  margin: number;
  /** Employer's total annual cost of the plan. */
  employerNetCost: number;
}

/** Annual funding picture for the group, with this episode's plan-paid amount added to expected claims. */
export function fundingSummary(episodePlanPaid: number, f: FundingTerms): FundingSummary {
  const n = f.coveredEmployees;
  const claims = round2(f.expectedClaimsPerEmployee * n + episodePlanPaid);
  const admin = round2(f.adminPerEmployee * n);

  if (f.model === 'fullyInsured') {
    const premium = round2(f.annualPremiumPerEmployee * n);
    const mlr = premium > 0 ? claims / premium : 0;
    const mlrRebate = mlr < f.mlrFloor ? round2((f.mlrFloor - mlr) * premium) : 0;
    const employerContribution = round2(premium * f.employerShare);
    return {
      totalFunding: premium,
      employerContribution,
      employeeContribution: round2(premium - employerContribution),
      claims,
      admin,
      stopLossPremium: 0,
      stopLossRecovery: 0,
      medicalLossRatio: mlr,
      mlrRebate,
      margin: round2(premium - claims - admin - mlrRebate),
      employerNetCost: employerContribution,
    };
  }

  // Self-funded: budget is set at the premium-equivalent rate; the employer keeps or covers the difference.
  const budget = round2(f.annualPremiumPerEmployee * n);
  const employeeContribution = round2(budget * (1 - f.employerShare));
  const stopLossPremium = round2(f.stopLossPremiumPerEmployee * n);
  const stopLossRecovery = round2(Math.max(0, episodePlanPaid - f.specificAttachment));
  const outlay = round2(claims + admin + stopLossPremium - stopLossRecovery);
  return {
    totalFunding: budget,
    employerContribution: round2(outlay - employeeContribution),
    employeeContribution,
    claims,
    admin,
    stopLossPremium,
    stopLossRecovery,
    medicalLossRatio: null,
    mlrRebate: 0,
    margin: round2(budget - outlay),
    employerNetCost: round2(outlay - employeeContribution),
  };
}
