import { PHASE_LABEL, usd0, type EpisodeView } from '../episodeView';

interface Props {
  view: EpisodeView;
  step: number;
  onStep: (step: number) => void;
}

/** The episode rail: one card per encounter, revealed as the visitor advances. */
export function Timeline({ view, step, onStep }: Props) {
  const last = view.steps.length;
  return (
    <section aria-labelledby="timeline-heading">
      <div className="section-head">
        <h2 id="timeline-heading">The episode</h2>
        <div className="stepper">
          <button type="button" onClick={() => onStep(step - 1)} disabled={step <= 1}>
            Back
          </button>
          <span aria-live="polite">
            Step {step} of {last}
          </span>
          <button type="button" className="primary" onClick={() => onStep(step + 1)} disabled={step >= last}>
            Next step
          </button>
        </div>
      </div>
      <ol className="timeline">
        {view.steps.map((s) => {
          const state = s.id === step ? 'current' : s.id < step ? 'done' : 'future';
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`step-card ${state}`}
                aria-current={s.id === step ? 'step' : undefined}
                onClick={() => onStep(s.id)}
              >
                <span className="step-num">{s.id}</span>
                <span className="step-title">{s.title}</span>
                <span className="step-setting">{s.setting}</span>
                {state === 'future' ? (
                  <span className="step-pay muted">Not yet happened</span>
                ) : (
                  <>
                    <span className="step-pay">Patient pays {usd0(s.patientPaid)}</span>
                    <span className={`badge phase-${s.phase}`}>{PHASE_LABEL[s.phase]}</span>
                  </>
                )}
                {s.fills.length > 0 && (
                  <span className="step-rx">
                    {s.fills.length} prescription{s.fills.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
