import { BASIS } from '../data/episode';
import type { AdjudicatedRx } from '../engine/types';
import { PHASE_LABEL, usd2, type StepView } from '../episodeView';
import type { Inputs } from '../state';

const CODE_NOTICE =
  'Procedure code withheld. CPT codes and descriptions are copyrighted by the American Medical Association.';

function rxNote(r: AdjudicatedRx, before: number, moop: number, copays: number[]): string {
  if (r.fill.otc) return 'Over the counter: no claim is filed and nothing counts toward the deductible or maximum.';
  const notes: string[] = [];
  const copay = copays[r.fill.tier - 1] ?? 0;
  if (r.patientPaid === 0 && before >= moop) notes.push('Out-of-pocket maximum already met, so the plan pays in full.');
  else if (r.deductible > 0) notes.push('Applied to the deductible.');
  else if (r.patientPaid > 0 && r.patientPaid === r.planPrice && r.planPrice < copay)
    notes.push(`The drug costs less than the ${usd2(copay)} copay, so the patient pays the full price.`);
  if (r.fill.brand)
    notes.push(`Brand drug: manufacturer rebate of ${usd2(r.rebateTotal)}, of which ${usd2(r.rebateToSponsor)} goes to the plan sponsor.`);
  return notes.join(' ');
}

interface Props {
  step: StepView;
  inputs: Inputs;
}

/** Line-by-line view of one encounter: what was billed, allowed, written off and paid. */
export function StepDetail({ step, inputs }: Props) {
  const copays = [inputs.rx1, inputs.rx2, inputs.rx3, inputs.rx4];
  return (
    <section id="detail" tabIndex={-1} className="detail" aria-labelledby="detail-heading">
      <div className="section-head">
        <h2 id="detail-heading">
          Step {step.id}: {step.title}
        </h2>
        <span className={`badge phase-${step.phase}`}>{PHASE_LABEL[step.phase]}</span>
      </div>
      <p className="muted">{step.setting}</p>

      <ul className="legend">
        <li>
          <span className="swatch fill-writeoff" /> Contractual adjustment
        </li>
        <li>
          <span className="swatch fill-plan" /> Plan paid
        </li>
        <li>
          <span className="swatch fill-ded" /> Patient responsibility
        </li>
      </ul>

      <div className="table-wrap" tabIndex={0} role="region" aria-label="Services in this step">
        <table>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Code</th>
              <th scope="col" className="num">Billed</th>
              <th scope="col" className="num">Medicare</th>
              <th scope="col" className="num">Allowed</th>
              <th scope="col" className="num">Patient</th>
              <th scope="col" className="num">Plan</th>
              <th scope="col">Share of the bill</th>
            </tr>
          </thead>
          <tbody>
            {step.lines.map((l) => {
              const share = (n: number) => (l.charge > 0 ? (n / l.charge) * 100 : 0);
              return (
                <tr key={l.line.id}>
                  <th scope="row">
                    {l.line.label}
                    <span className="kind">{l.line.kind === 'facility' ? 'Facility fee' : 'Professional fee'}</span>
                  </th>
                  <td>
                    <span className="masked" title={CODE_NOTICE} aria-label={CODE_NOTICE}>
                      #####
                    </span>
                  </td>
                  <td className="num">{usd2(l.charge)}</td>
                  <td className="num" title={BASIS[l.line.basis]}>
                    {usd2(l.line.medicare)}
                  </td>
                  <td className="num">{usd2(l.allowed)}</td>
                  <td className="num">{usd2(l.patientPaid)}</td>
                  <td className="num">{usd2(l.planPaid)}</td>
                  <td>
                    {l.charge > 0 ? (
                      <div className="track split" role="img" aria-label={`Of ${usd2(l.charge)} billed: ${usd2(l.contractualAdjustment)} written off, ${usd2(l.planPaid)} paid by the plan, ${usd2(l.patientPaid)} paid by the patient`}>
                        <div className="fill fill-writeoff" style={{ width: `${share(l.contractualAdjustment)}%` }} title={`Contractual adjustment: ${usd2(l.contractualAdjustment)}`} />
                        <div className="fill fill-plan" style={{ width: `${share(l.planPaid)}%` }} title={`Plan paid: ${usd2(l.planPaid)}`} />
                        <div className="fill fill-ded" style={{ width: `${share(l.patientPaid)}%` }} title={`Patient paid: ${usd2(l.patientPaid)}`} />
                      </div>
                    ) : (
                      <span className="muted">No separate charge</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        <span className="masked">#####</span> {CODE_NOTICE}
      </p>
      <details className="sources">
        <summary>Where the Medicare amounts come from</summary>
        <ul>
          {step.lines.map((l) => (
            <li key={l.line.id}>
              <strong>{l.line.label}:</strong> {BASIS[l.line.basis]}
            </li>
          ))}
        </ul>
      </details>

      {step.fills.length > 0 && (
        <>
          <h3>Prescriptions filled at this step</h3>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Prescriptions in this step">
            <table>
              <thead>
                <tr>
                  <th scope="col">Prescription</th>
                  <th scope="col" className="num">Price at the counter</th>
                  <th scope="col" className="num">Patient</th>
                  <th scope="col" className="num">Plan</th>
                  <th scope="col">What happened</th>
                </tr>
              </thead>
              <tbody>
                {step.fills.map((r, i) => {
                  const before = i === 0 ? (step.lines[step.lines.length - 1]?.after.oopMet ?? step.before.oopMet) : step.fills[i - 1].after.oopMet;
                  return (
                    <tr key={r.fill.id}>
                      <th scope="row">
                        {r.fill.label}
                        <span className="kind">{r.fill.purpose}</span>
                      </th>
                      <td className="num">{usd2(r.fill.otc ? r.patientPaid : r.planPrice)}</td>
                      <td className="num">{usd2(r.patientPaid)}</td>
                      <td className="num">{usd2(r.planPaid)}</td>
                      <td>{rxNote(r, before, inputs.moop, copays)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
