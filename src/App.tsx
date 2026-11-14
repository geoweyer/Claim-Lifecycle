import { useMemo } from 'react';
import { InputsPanel } from './components/InputsPanel';
import { Meters } from './components/Meters';
import { StepDetail } from './components/StepDetail';
import { Timeline } from './components/Timeline';
import { buildEpisodeView, usd0 } from './episodeView';
import { useInputs } from './state';
import './styles.css';

export default function App() {
  const [inputs, update, reset] = useInputs();
  const view = useMemo(() => buildEpisodeView(inputs), [inputs]);
  const step = inputs.step;
  const setStep = (n: number) => update({ step: Math.min(view.steps.length, Math.max(1, n)) });

  const tiles: [string, number, string][] = [
    ['Billed charges', view.totals.charge, 'What providers list on the claims'],
    ['Allowed amount', view.totals.allowed, 'What the contracts say the care is worth'],
    ['Plan pays', view.totals.planPaid, 'Paid by the insurer or the employer'],
    ['Patient pays', view.totals.patientPaid, 'Including over-the-counter purchases'],
  ];

  return (
    <main className="viz-root">
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

      <section aria-labelledby="totals-heading">
        <h2 id="totals-heading">The whole episode</h2>
        <dl className="tiles">
          {tiles.map(([label, value, hint]) => (
            <div className="tile" key={label}>
              <dt>{label}</dt>
              <dd>{usd0(value)}</dd>
              <p>{hint}</p>
            </div>
          ))}
        </dl>
      </section>

      <InputsPanel inputs={inputs} update={update} reset={reset} />
    </main>
  );
}
