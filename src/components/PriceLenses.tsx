import { useState, type ReactNode } from 'react';
import { round2 } from '../engine/adjudicate';
import { providerMargin } from '../engine/economics';
import { usd0, type EpisodeView } from '../episodeView';
import type { Inputs } from '../state';

type LensId = 'patient' | 'employer' | 'plan' | 'provider' | 'medicare';
type BarId = 'charge' | 'allowed' | 'medicare' | 'cost' | 'planPaid' | 'patientPaid';

const LENSES: { id: LensId; label: string }[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'employer', label: 'Employer' },
  { id: 'plan', label: 'Health plan' },
  { id: 'provider', label: 'Provider' },
  { id: 'medicare', label: 'Medicare' },
];

const BARS: { id: BarId; label: string }[] = [
  { id: 'charge', label: 'Billed charge' },
  { id: 'allowed', label: 'Allowed amount' },
  { id: 'planPaid', label: 'Plan paid' },
  { id: 'patientPaid', label: 'Patient paid' },
  { id: 'cost', label: 'Provider cost' },
  { id: 'medicare', label: 'Medicare would pay' },
];

interface Props {
  view: EpisodeView;
  inputs: Inputs;
  step: number;
}

/** The same care, priced from five viewpoints. */
export function PriceLenses({ view, inputs, step }: Props) {
  const [lens, setLens] = useState<LensId>('patient');
  const [whole, setWhole] = useState(false);

  const steps = whole ? view.steps : [view.steps[step - 1]];
  const lines = steps.flatMap((s) => s.lines);
  const sum = (ns: number[]) => round2(ns.reduce((t, n) => t + n, 0));
  const margins = lines.map((l) => providerMargin(l, view.econ));
  const v: Record<BarId, number> = {
    charge: sum(lines.map((l) => l.charge)),
    allowed: sum(lines.map((l) => l.allowed)),
    medicare: sum(lines.map((l) => l.line.medicare)),
    cost: sum(margins.map((m) => m.directCost + m.indirectCost)),
    planPaid: sum(lines.map((l) => l.planPaid)),
    patientPaid: sum(lines.map((l) => l.patientPaid)),
  };
  const collected = sum(margins.map((m) => m.collected));

  // Employer's share of plan dollars when self-funded: claims up to the stop-loss attachment point.
  const planPaidThrough = (n: number) =>
    sum(view.steps.slice(0, n).flatMap((s) => [...s.lines, ...s.fills].map((x) => x.planPaid)));
  const cap = (n: number) => Math.min(n, inputs.attachment);
  const employerSelfFunded = whole
    ? cap(planPaidThrough(view.steps.length))
    : round2(cap(planPaidThrough(step)) - cap(planPaidThrough(step - 1)));

  const premiumEmployee = round2(inputs.premium * (1 - inputs.employerSharePct / 100));
  const premiumEmployer = round2(inputs.premium * (inputs.employerSharePct / 100));
  const scope = whole ? 'the whole episode' : `step ${step}`;
  const ratio = v.medicare > 0 ? `${Math.round((v.allowed / v.medicare) * 100)}%` : 'not applicable';

  const content: Record<LensId, { headline: string; value: number; text: string; rows: [string, ReactNode][]; bars: BarId[] }> = {
    patient: {
      headline: 'The price is what I owe',
      value: v.patientPaid,
      text: 'The patient never sees most of the numbers. Their price is the deductible, coinsurance and copays on the explanation of benefits, on top of the premium already taken from each paycheck.',
      rows: [
        [`Owed for ${scope}`, usd0(v.patientPaid)],
        ['Premium share for the year, paid regardless of care', usd0(premiumEmployee)],
        ['Most the patient can owe for covered care in a year', usd0(inputs.moop)],
      ],
      bars: ['patientPaid'],
    },
    employer: {
      headline: inputs.selfFunded ? 'The price is the claims we fund' : 'The price is the premium',
      value: inputs.selfFunded ? employerSelfFunded : 0,
      text: inputs.selfFunded
        ? 'A self-funded employer pays each claim from its own money, so its price is the plan-paid amount until stop-loss takes over.'
        : 'A fully insured employer pays the same premium whether or not this care happens. This care costs it nothing extra this year, though heavy claims can raise the renewal.',
      rows: [
        [`Added employer cost for ${scope}`, usd0(inputs.selfFunded ? employerSelfFunded : 0)],
        [inputs.selfFunded ? 'Budgeted cost per employee, per year' : 'Employer premium per employee, per year', usd0(premiumEmployer)],
        ...(inputs.selfFunded ? ([['Stop-loss takes over above', usd0(inputs.attachment)]] as [string, ReactNode][]) : []),
      ],
      bars: ['planPaid'],
    },
    plan: {
      headline: 'The price is the allowed amount',
      value: v.allowed,
      text: inputs.selfFunded
        ? 'To the health plan, price means the contract rate it negotiated. In a self-funded plan it pays claims with the employer’s money and earns a fee.'
        : 'To the health plan, price means the contract rate it negotiated. It pays that amount less the patient’s share, out of premium it has already collected.',
      rows: [
        ['Allowed under the contracts', usd0(v.allowed)],
        ['Discount off billed charges', usd0(v.charge - v.allowed)],
        ['Paid by the plan', usd0(v.planPaid)],
        ['Left to the patient', usd0(v.patientPaid)],
      ],
      bars: ['allowed', 'planPaid'],
    },
    provider: {
      headline: 'The price is the charge; the revenue is not',
      value: v.charge,
      text: 'The provider posts a list price, expects to collect the contract rate, and judges the result against what the care cost to deliver.',
      rows: [
        ['Billed at list price', usd0(v.charge)],
        ['Expected to collect', usd0(collected)],
        ['Estimated cost to deliver', usd0(v.cost)],
        ['Margin after all costs', usd0(collected - v.cost)],
      ],
      bars: ['charge', 'allowed', 'cost'],
    },
    medicare: {
      headline: 'The price is the fee schedule',
      value: v.medicare,
      text: 'Medicare does not negotiate these prices; it sets them by formula. Commercial contracts are often written as a percentage of this amount.',
      rows: [
        ['Medicare would pay', usd0(v.medicare)],
        ['Commercial allowed amount as a share of Medicare', ratio],
        ['Billed charge as a multiple of Medicare', v.medicare > 0 ? `${(v.charge / v.medicare).toFixed(1)} times` : 'not applicable'],
      ],
      bars: ['medicare'],
    },
  };
  const c = content[lens];
  const max = Math.max(...BARS.map((b) => v[b.id]), 1);

  return (
    <section id="price" tabIndex={-1} className="lenses" aria-labelledby="lenses-heading">
      <div className="section-head">
        <h2 id="lenses-heading">What does &ldquo;price&rdquo; mean?</h2>
        <div className="segmented" role="group" aria-label="Scope">
          <button type="button" aria-pressed={!whole} onClick={() => setWhole(false)}>
            Step {step}
          </button>
          <button type="button" aria-pressed={whole} onClick={() => setWhole(true)}>
            Whole episode
          </button>
        </div>
      </div>
      <p className="lede">The same care has a different price depending on who is asked. Choose a viewpoint.</p>

      <div className="segmented wrap" role="group" aria-label="Viewpoint">
        {LENSES.map((l) => (
          <button key={l.id} type="button" aria-pressed={lens === l.id} onClick={() => setLens(l.id)}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="lens-grid">
        <div className="card">
          <p className="sr-only" role="status">
            {c.headline}: {usd0(c.value)}
          </p>
          <h3>{c.headline}</h3>
          <p className="hero">{usd0(c.value)}</p>
          <p>{c.text}</p>
          <dl className="rows">
            {c.rows.map(([k, val]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bars" role="img" aria-label={`Six prices for ${scope}: ${BARS.map((b) => `${b.label} ${usd0(v[b.id])}`).join(', ')}`}>
          {BARS.map((b) => (
            <div key={b.id} className={`bar-row${c.bars.includes(b.id) ? ' on' : ''}`} title={`${b.label}: ${usd0(v[b.id])}`}>
              <span className="bar-label">{b.label}</span>
              <span className="bar-track">
                <span className="bar" style={{ width: `${(v[b.id] / max) * 100}%` }} />
              </span>
              <span className="bar-value">{usd0(v[b.id])}</span>
            </div>
          ))}
          <p className="footnote">
            Medical claims for {scope}; prescriptions are not included. Highlighted bars are the numbers this viewpoint
            calls the price.
          </p>
        </div>
      </div>
    </section>
  );
}
