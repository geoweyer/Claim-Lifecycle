import { useMemo } from 'react';
import { ClaimCycle } from './components/ClaimCycle';
import { InputsPanel } from './components/InputsPanel';
import { Languages } from './components/Languages';
import { Meters } from './components/Meters';
import { MoneyFlow } from './components/MoneyFlow';
import { PriceLenses } from './components/PriceLenses';
import { StepDetail } from './components/StepDetail';
import { Timeline } from './components/Timeline';
import { TopBar } from './components/TopBar';
import { buildEpisodeView, usd0 } from './episodeView';
import { useInputs } from './state';
import './styles.css';

export default function App() {
  const [inputs, update, reset] = useInputs();
  const view = useMemo(() => buildEpisodeView(inputs), [inputs]);
  const step = inputs.step;
  const setStep = (n: number) => update({ step: Math.min(view.steps.length, Math.max(1, n)) });

  const current = view.steps[step - 1];

  // Running totals through the current step, with the whole-episode figure alongside.
  const soFar = (pick: (s: (typeof view.steps)[number]) => number) =>
    view.steps.slice(0, step).reduce((t, s) => t + pick(s), 0);
  const tiles: [string, number, number][] = [
    ['Billed charges', soFar((s) => s.charge), view.totals.charge],
    ['Allowed amount', soFar((s) => s.allowed), view.totals.allowed],
    ['Plan pays', soFar((s) => s.planPaid), view.totals.planPaid],
    ['Patient pays', soFar((s) => s.patientPaid), view.totals.patientPaid],
  ];

  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <TopBar step={step} stepTitle={current.title} stepCount={view.steps.length} onStep={setStep} />
      <p className="sr-only" role="status">
        Step {step} of {view.steps.length}: {current.title}. Patient pays {usd0(current.patientPaid)}.
      </p>
      <main id="main" tabIndex={-1} className="viz-root">
      <header>
        <h1>Claim Lifecycle Explorer</h1>
        <p>
          One patient, from a preventive visit to bypass surgery and recovery. Step through the episode to see what is
          billed, what is allowed, and who pays.
        </p>
        <p className="notice">
          Prices are illustrative. Medicare amounts are 2026 national rates with no geographic adjustment; commercial
          prices are those rates times the contract percentages below.
        </p>
      </header>

      <Timeline view={view} step={step} onStep={setStep} />
      <Meters view={view} step={step} />
      <StepDetail step={view.steps[step - 1]} inputs={inputs} />
      <ClaimCycle step={view.steps[step - 1]} inputs={inputs} econ={view.econ} />
      <PriceLenses view={view} inputs={inputs} step={step} />

      <section id="totals" tabIndex={-1} aria-labelledby="totals-heading">
        <h2 id="totals-heading">Totals through step {step}</h2>
        <dl className="tiles">
          {tiles.map(([label, value, whole]) => (
            <div className="tile" key={label}>
              <dt>{label}</dt>
              <dd>{usd0(value)}</dd>
              <dd className="hint">Whole episode: {usd0(whole)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <MoneyFlow view={view} inputs={inputs} update={update} />
      <Languages view={view} />
      <InputsPanel inputs={inputs} update={update} reset={reset} />
      </main>
    </>
  );
}
