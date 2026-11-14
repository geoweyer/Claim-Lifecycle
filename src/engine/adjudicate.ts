import type {
  Accumulators,
  AdjudicatedEvent,
  AdjudicatedLine,
  AdjudicatedRx,
  Contract,
  EpisodeEvent,
  PharmacyTerms,
  PlanDesign,
  ProviderEconomics,
  RxFill,
  ServiceLine,
} from './types';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Billed charge from the chargemaster, modeled as a multiple of Medicare. */
export function billedCharge(line: ServiceLine, econ: ProviderEconomics): number {
  return round2(line.medicare * econ.chargeMultiple[line.kind]);
}

/** Allowed amount under the contract for one service line. */
export function allowedAmount(line: ServiceLine, contract: Contract, charge: number): number {
  if (line.costShare === 'globalPackage') return 0;
  const term = contract[line.kind];
  let rate: number;
  switch (term.method) {
    case 'pctMedicare':
      rate = line.medicare * term.value;
      break;
    case 'pctCharge':
      rate = charge * term.value;
      break;
    case 'caseRate':
      rate = term.value;
      break;
  }
  if (contract.lesserOfCharge) rate = Math.min(rate, charge);
  return round2(rate);
}

/** Apply plan benefits to one medical line, given accumulators so far. */
export function adjudicateLine(
  line: ServiceLine,
  plan: PlanDesign,
  contract: Contract,
  econ: ProviderEconomics,
  acc: Accumulators,
): AdjudicatedLine {
  const charge = line.costShare === 'globalPackage' ? 0 : billedCharge(line, econ);
  const allowed = allowedAmount(line, contract, charge);
  const oopRoom = Math.max(0, plan.moop - acc.oopMet);

  let deductible = 0;
  let coinsurance = 0;
  let copay = 0;

  if (line.costShare === 'deductibleCoinsurance') {
    const dedRoom = Math.max(0, plan.deductible - acc.deductibleMet);
    deductible = Math.min(allowed, dedRoom, oopRoom);
    coinsurance = Math.min((allowed - deductible) * plan.coinsurance, oopRoom - deductible);
  } else if (line.costShare === 'copay') {
    copay = Math.min(line.copay ?? 0, allowed, oopRoom);
  }

  deductible = round2(deductible);
  coinsurance = round2(Math.max(0, coinsurance));
  copay = round2(copay);
  const patientPaid = round2(deductible + coinsurance + copay);

  return {
    line,
    charge,
    allowed,
    contractualAdjustment: round2(charge - allowed),
    deductible,
    coinsurance,
    copay,
    patientPaid,
    planPaid: round2(allowed - patientPaid),
    after: {
      deductibleMet: round2(acc.deductibleMet + deductible),
      oopMet: round2(acc.oopMet + patientPaid),
    },
  };
}

/** Apply pharmacy benefits to one prescription fill. */
export function adjudicateRx(
  fill: RxFill,
  plan: PlanDesign,
  terms: PharmacyTerms,
  acc: Accumulators,
): AdjudicatedRx {
  if (fill.otc) {
    // No claim: the patient pays the shelf price and nothing accumulates.
    return {
      fill,
      planPrice: 0,
      pharmacyPaid: fill.ingredientCost,
      pbmSpread: 0,
      patientPaid: round2(fill.ingredientCost),
      planPaid: 0,
      rebateTotal: 0,
      rebateToSponsor: 0,
      rebateKeptByPbm: 0,
      countsTowardAccumulators: false,
      after: { ...acc },
    };
  }

  const ingredient = fill.brand ? fill.ingredientCost * (1 - terms.brandDiscount) : fill.ingredientCost;
  const pharmacyPaid = round2(ingredient + terms.dispensingFee);
  const planPrice = round2(pharmacyPaid * (1 + terms.spreadRate));
  const oopRoom = Math.max(0, plan.moop - acc.oopMet);

  let deductible = 0;
  let patient: number;
  if (plan.rxSubjectToDeductible && !fill.preventiveList) {
    const dedRoom = Math.max(0, plan.deductible - acc.deductibleMet);
    deductible = Math.min(planPrice, dedRoom);
    patient = deductible + (planPrice - deductible) * plan.coinsurance;
  } else {
    const copay = plan.rxTierCopays[fill.tier - 1] ?? 0;
    // Lesser-of logic: never charge a copay above the price of the drug.
    patient = Math.min(copay, planPrice);
  }
  patient = round2(Math.min(patient, oopRoom));
  deductible = round2(Math.min(deductible, patient));

  const rebateTotal = fill.brand ? round2(fill.ingredientCost * terms.rebateRate) : 0;
  const rebateToSponsor = round2(rebateTotal * terms.rebatePassThrough);

  return {
    fill,
    planPrice,
    pharmacyPaid,
    pbmSpread: round2(planPrice - pharmacyPaid),
    patientPaid: patient,
    planPaid: round2(planPrice - patient),
    rebateTotal,
    rebateToSponsor,
    rebateKeptByPbm: round2(rebateTotal - rebateToSponsor),
    countsTowardAccumulators: true,
    after: {
      deductibleMet: round2(acc.deductibleMet + deductible),
      oopMet: round2(acc.oopMet + patient),
    },
  };
}

export interface EpisodeInputs {
  plan: PlanDesign;
  contract: Contract;
  econ: ProviderEconomics;
  pharmacy: PharmacyTerms;
  /** Ids of optional prescription fills that are switched on. */
  enabledOptionalRx?: string[];
}

/** Run every event in order, carrying the accumulators forward. */
export function adjudicateEpisode(events: EpisodeEvent[], inputs: EpisodeInputs): AdjudicatedEvent[] {
  let acc: Accumulators = { deductibleMet: 0, oopMet: 0 };
  const out: AdjudicatedEvent[] = [];
  for (const ev of events) {
    if (ev.type === 'medical') {
      const result = adjudicateLine(ev.line, inputs.plan, inputs.contract, inputs.econ, acc);
      acc = result.after;
      out.push({ type: 'medical', result });
    } else {
      if (ev.fill.optional && !inputs.enabledOptionalRx?.includes(ev.fill.id)) continue;
      const result = adjudicateRx(ev.fill, inputs.plan, inputs.pharmacy, acc);
      acc = result.after;
      out.push({ type: 'rx', result });
    }
  }
  return out;
}

export interface StepSummary {
  stepId: number;
  charge: number;
  allowed: number;
  patientPaid: number;
  planPaid: number;
  after: Accumulators;
}

/** Roll adjudicated events up to one row per episode step. */
export function summarizeByStep(results: AdjudicatedEvent[]): StepSummary[] {
  const map = new Map<number, StepSummary>();
  for (const ev of results) {
    const r = ev.result;
    const stepId = ev.type === 'medical' ? ev.result.line.stepId : ev.result.fill.stepId;
    const charge = ev.type === 'medical' ? ev.result.charge : 0;
    const allowed = ev.type === 'medical' ? ev.result.allowed : ev.result.planPrice;
    const s = map.get(stepId) ?? {
      stepId,
      charge: 0,
      allowed: 0,
      patientPaid: 0,
      planPaid: 0,
      after: r.after,
    };
    s.charge = round2(s.charge + charge);
    s.allowed = round2(s.allowed + allowed);
    s.patientPaid = round2(s.patientPaid + r.patientPaid);
    s.planPaid = round2(s.planPaid + r.planPaid);
    s.after = r.after;
    map.set(stepId, s);
  }
  return [...map.values()].sort((a, b) => a.stepId - b.stepId);
}
