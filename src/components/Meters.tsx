import { usd0, type EpisodeView } from '../episodeView';

interface Props {
  view: EpisodeView;
  step: number;
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, (part / whole) * 100) : 0);

/** Running accumulators through the current step: deductible, then out-of-pocket maximum. */
export function Meters({ view, step }: Props) {
  const acc = view.steps[step - 1].after;
  const dedPaid = acc.deductibleMet;
  const otherPaid = Math.max(0, acc.oopMet - acc.deductibleMet);
  const dedDone = view.deductible > 0 && dedPaid >= view.deductible;
  const moopDone = view.moop > 0 && acc.oopMet >= view.moop;

  return (
    <section id="standing" tabIndex={-1} className="meters" aria-labelledby="meters-heading">
      <h2 id="meters-heading">Where the patient stands after step {step}</h2>

      <div className="meter">
        <div className="meter-head">
          <span className="meter-name">Deductible</span>
          <span className="meter-value">
            {usd0(dedPaid)} of {usd0(view.deductible)}
            {dedDone && <span className="badge phase-deductibleMet">Met</span>}
          </span>
        </div>
        <div
          className="track"
          role="img"
          aria-label={`Deductible: ${usd0(dedPaid)} paid of ${usd0(view.deductible)}`}
        >
          <div className="fill fill-ded" style={{ width: `${pct(dedPaid, view.deductible)}%` }} title={`Deductible paid: ${usd0(dedPaid)}`} />
        </div>
      </div>

      <div className="meter">
        <div className="meter-head">
          <span className="meter-name">Out-of-pocket maximum</span>
          <span className="meter-value">
            {usd0(acc.oopMet)} of {usd0(view.moop)}
            {moopDone && <span className="badge phase-moopReached">Reached</span>}
          </span>
        </div>
        <div
          className="track"
          role="img"
          aria-label={`Out-of-pocket: ${usd0(dedPaid)} deductible plus ${usd0(otherPaid)} coinsurance and copays, of ${usd0(view.moop)}`}
        >
          <div className="fill fill-ded" style={{ width: `${pct(dedPaid, view.moop)}%` }} title={`Deductible: ${usd0(dedPaid)}`} />
          <div className="fill fill-coins" style={{ width: `${pct(otherPaid, view.moop)}%` }} title={`Coinsurance and copays: ${usd0(otherPaid)}`} />
        </div>
        <ul className="legend">
          <li>
            <span className="swatch fill-ded" /> Deductible {usd0(dedPaid)}
          </li>
          <li>
            <span className="swatch fill-coins" /> Coinsurance and copays {usd0(otherPaid)}
          </li>
        </ul>
      </div>
    </section>
  );
}
