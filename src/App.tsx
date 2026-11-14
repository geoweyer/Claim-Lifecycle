import { useMemo, useState } from 'react';
import { adjudicateEpisode, summarizeByStep } from './engine/adjudicate';
import {
  buildEvents,
  DEFAULT_CONTRACT,
  DEFAULT_ECONOMICS,
  DEFAULT_PHARMACY,
  DEFAULT_PLAN,
  OPTIONAL_RX_DEFAULT_ON,
  STEPS,
} from './data/episode';

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Phase 1 placeholder: proves the engine end to end. The timeline, claim cycle and
// money-flow views replace this table in later phases.
export default function App() {
  const [deductible, setDeductible] = useState(DEFAULT_PLAN.deductible);
  const [coinsurance, setCoinsurance] = useState(DEFAULT_PLAN.coinsurance);
  const [moop, setMoop] = useState(DEFAULT_PLAN.moop);

  const steps = useMemo(() => {
    const results = adjudicateEpisode(buildEvents(), {
      plan: { ...DEFAULT_PLAN, deductible, coinsurance, moop },
      contract: DEFAULT_CONTRACT,
      econ: DEFAULT_ECONOMICS,
      pharmacy: DEFAULT_PHARMACY,
      enabledOptionalRx: OPTIONAL_RX_DEFAULT_ON,
    });
    return summarizeByStep(results);
  }, [deductible, coinsurance, moop]);

  const cell = { padding: '6px 12px', textAlign: 'right' as const, borderBottom: '1px solid #ddd' };
  const field = (label: string, value: number, set: (n: number) => void, step: number) => (
    <label style={{ marginRight: 16 }}>
      {label}{' '}
      <input type="number" value={value} step={step} min={0} onChange={(e) => set(Number(e.target.value))} style={{ width: 90 }} />
    </label>
  );

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1>Claim Lifecycle Explorer</h1>
      <p>Engine preview. Prices are illustrative and have not been checked against current Medicare fee schedules.</p>
      <p>
        {field('Deductible', deductible, setDeductible, 250)}
        {field('Coinsurance', coinsurance, setCoinsurance, 0.05)}
        {field('Out-of-pocket maximum', moop, setMoop, 500)}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...cell, textAlign: 'left' }}>Step</th>
              <th style={cell}>Billed</th>
              <th style={cell}>Allowed</th>
              <th style={cell}>Patient pays</th>
              <th style={cell}>Plan pays</th>
              <th style={cell}>Out-of-pocket so far</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.stepId}>
                <td style={{ ...cell, textAlign: 'left' }}>
                  {s.stepId}. {STEPS.find((x) => x.id === s.stepId)?.title}
                </td>
                <td style={cell}>{usd(s.charge)}</td>
                <td style={cell}>{usd(s.allowed)}</td>
                <td style={cell}>{usd(s.patientPaid)}</td>
                <td style={cell}>{usd(s.planPaid)}</td>
                <td style={cell}>{usd(s.after.oopMet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
