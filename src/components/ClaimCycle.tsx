import { useEffect, useState, type ReactNode } from 'react';
import { CAST, CLAIM_META } from '../data/claimMeta';
import { BASIS, DEFAULT_PHARMACY } from '../data/episode';
import { providerMargin } from '../engine/economics';
import type { Accumulators, AdjudicatedLine, AdjudicatedRx, ProviderEconomics } from '../engine/types';
import { usd2, type StepView } from '../episodeView';
import type { Inputs } from '../state';
import { CycleRing } from './CycleRing';

const CODE_NOTICE =
  'Procedure code withheld. CPT codes and descriptions are copyrighted by the American Medical Association.';

/** A subtracted amount; zero is shown without a sign. */
const minus = (n: number) => (n > 0 ? `−${usd2(n)}` : usd2(0));

const Masked = () => (
  <span className="masked" title={CODE_NOTICE} aria-label={CODE_NOTICE}>
    #####
  </span>
);

/** A label/value list used for forms, messages and statements. */
function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="rows">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Card({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <div className="card">
      <div className="card-head">
        <h4>{title}</h4>
        {tag && <span className="badge">{tag}</span>}
      </div>
      {children}
    </div>
  );
}

interface Stage {
  label: string;
  who: string;
  standard: string;
  when: string;
  body: ReactNode;
}

function medicalStages(l: AdjudicatedLine, before: Accumulators, inputs: Inputs, econ: ProviderEconomics): Stage[] {
  const meta = CLAIM_META[l.line.id];
  const facility = l.line.kind === 'facility';
  const pct = facility ? inputs.facilityPct : inputs.professionalPct;
  const dedLeft = Math.max(0, inputs.deductible - before.deductibleMet);
  const oopLeft = Math.max(0, inputs.moop - before.oopMet);
  const preventive = l.line.costShare === 'preventive';
  const m = providerMargin(l, econ);
  const cost = m.directCost + m.indirectCost;
  const dxList = (
    <ul className="plain">
      {meta.diagnoses.map((d) => (
        <li key={d.code}>
          <code>{d.code}</code> {d.text}
        </li>
      ))}
    </ul>
  );
  const formName = facility ? 'UB-04 (electronic 837I)' : 'CMS-1500 (electronic 837P)';

  const claimForm = facility ? (
    <Card title="Institutional claim" tag="UB-04 / 837I, stylized">
      <Rows
        rows={[
          ['Billing provider', `${meta.provider} · NPI 0000000000`],
          ['Patient', CAST.patient],
          ['Insured ID and group', `${CAST.memberId} · ${CAST.group}`],
          ['Payer', CAST.payer],
          ['Type of bill', meta.inpatient ? 'Hospital inpatient, admission through discharge' : 'Outpatient facility'],
          ['Statement dates', meta.date],
          ...(meta.inpatient
            ? ([
                ['Admitted / discharged', `${meta.inpatient.admit} / ${meta.inpatient.discharge}, discharged home`],
              ] as [string, ReactNode][])
            : []),
          [meta.inpatient ? 'Principal diagnosis' : 'Diagnoses', dxList],
          ...(meta.inpatient
            ? ([
                [
                  'Procedures (ICD-10-PCS)',
                  <ul className="plain">
                    {meta.inpatient.procedures.map((p) => (
                      <li key={p.code}>
                        <code>{p.code}</code> {p.text}
                      </li>
                    ))}
                  </ul>,
                ],
              ] as [string, ReactNode][])
            : ([['Procedure code', <Masked />]] as [string, ReactNode][])),
          ...(meta.units ? ([['Units', meta.units]] as [string, ReactNode][]) : []),
        ]}
      />
      <table className="mini">
        <thead>
          <tr>
            <th scope="col">Revenue category</th>
            <th scope="col" className="num">Charges</th>
          </tr>
        </thead>
        <tbody>
          {(meta.revenue ?? []).map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className="num">{usd2(l.charge * r.share)}</td>
            </tr>
          ))}
          <tr className="total">
            <td>Total charges</td>
            <td className="num">{usd2(l.charge)}</td>
          </tr>
        </tbody>
      </table>
      {meta.inpatient && (
        <p className="footnote">
          The payment group is not written on the claim. The payer&apos;s grouper software reads the diagnoses and
          procedures and assigns {meta.inpatient.drg}.
        </p>
      )}
      {l.line.id === 'cath-facility' && (
        <p className="footnote">
          Many commercial plans take surgery center claims on the institutional form; Medicare takes them on the
          professional form.
        </p>
      )}
    </Card>
  ) : (
    <Card title="Professional claim" tag="CMS-1500 / 837P, stylized">
      <Rows
        rows={[
          ['Patient (box 2)', CAST.patient],
          ['Insured ID (box 1a)', CAST.memberId],
          ['Group (box 11)', CAST.group],
          ['Payer', CAST.payer],
          ['Diagnoses (box 21)', dxList],
          ['Date of service (box 24A)', meta.date],
          ['Place of service (box 24B)', meta.place],
          ['Procedure code (box 24D)', <Masked />],
          ['Diagnosis pointer (box 24E)', 'A'],
          ['Charges (box 24F)', usd2(l.charge)],
          ['Units (box 24G)', meta.units ?? '1'],
          ['Total charge (box 28)', usd2(l.charge)],
          ['Billing provider (box 33)', `${meta.provider} · NPI 0000000000`],
        ]}
      />
    </Card>
  );

  const pricing: [string, ReactNode][] = [
    ['Billed charge', usd2(l.charge)],
    ['Medicare benchmark', <span title={BASIS[l.line.basis]}>{usd2(l.line.medicare)}</span>],
    [`Contract rate (${pct}% of Medicare)`, usd2(l.allowed)],
    ['Written off by the provider', usd2(l.contractualAdjustment)],
  ];
  const share: [string, ReactNode][] = preventive
    ? [['Cost share', 'None. Preventive services are covered in full under the Affordable Care Act.']]
    : [
        ['Deductible left before this claim', usd2(dedLeft)],
        ['Applied to deductible', usd2(l.deductible)],
        [`Coinsurance (${inputs.coinsurancePct}% of the rest)`, usd2(l.coinsurance)],
        ['Out-of-pocket room before this claim', usd2(oopLeft)],
      ];

  return [
    {
      label: 'Eligibility check',
      who: `${meta.provider} asks ${CAST.payer}`,
      standard: 'X12 270 request, 271 response' + (meta.priorAuth ? ', 278 authorization' : ''),
      when: 'Before or at check-in, answered in seconds',
      body: (
        <div className="cards">
          <Card title="The provider asks" tag="270">
            <Rows
              rows={[
                ['Member', `${CAST.patient}, ${CAST.memberId}`],
                ['Date of service', meta.date],
                ['Question', 'Is this person covered, and what will they owe?'],
              ]}
            />
          </Card>
          <Card title="The plan answers" tag="271">
            <Rows
              rows={[
                ['Coverage', `Active · ${CAST.plan}`],
                ['Deductible remaining', `${usd2(dedLeft)} of ${usd2(inputs.deductible)}`],
                ['Out-of-pocket remaining', `${usd2(oopLeft)} of ${usd2(inputs.moop)}`],
                ['Coinsurance', `${inputs.coinsurancePct}% after the deductible`],
                [
                  'Prior authorization',
                  meta.priorAuth ? 'Required. Requested and approved before the service (278).' : 'Not required',
                ],
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      label: 'Care and charges',
      who: `${meta.provider}: clinicians, coders and the billing office`,
      standard: 'ICD-10-CM diagnoses, procedure codes, the chargemaster',
      when: 'Day of service, coded within days',
      body: (
        <div className="cards">
          <Card title="What was done and why">
            <Rows
              rows={[
                ['Service', l.line.label],
                ['Where', meta.place],
                ['Why (diagnosis)', dxList],
                ['What (procedure code)', <Masked />],
              ]}
            />
          </Card>
          <Card title="Charge and cost">
            <Rows
              rows={[
                ['Charge from the price list', usd2(l.charge)],
                ['Charge as a multiple of Medicare', `${econ.chargeMultiple[l.line.kind]} times`],
                ['Estimated cost to deliver', usd2(cost)],
                ['Direct cost (staff, supplies, implants)', usd2(m.directCost)],
                ['Indirect cost (overhead)', usd2(m.indirectCost)],
              ]}
            />
            <p className="footnote">
              Cost is modeled from a cost-to-charge ratio of {econ.costToCharge[l.line.kind]}. The charge is a list
              price that almost no one pays.
            </p>
          </Card>
        </div>
      ),
    },
    {
      label: 'Claim form',
      who: `${meta.provider}'s billing system`,
      standard: formName,
      when: 'Usually within a few days of service',
      body: claimForm,
    },
    {
      label: 'Clearinghouse',
      who: `A clearinghouse such as ${CAST.clearinghouses}`,
      standard: 'X12 837 in, 999 and 277CA acknowledgments back',
      when: 'Same day',
      body: (
        <div className="cards">
          <Card title="What the clearinghouse does">
            <ul className="checks">
              <li>Translates the claim into the format this payer accepts</li>
              <li>Member ID and group are in a valid format</li>
              <li>Provider identifiers are valid</li>
              <li>Diagnosis and procedure codes are valid for the date of service</li>
              <li>Required fields are present and totals add up</li>
              <li>Routed to {CAST.payer}</li>
            </ul>
          </Card>
          <Card title="Why it matters">
            <p>
              A claim that fails these checks is <strong>rejected</strong>: it never reaches the payer and can be fixed
              and resent. A <strong>denial</strong> comes later, from the payer, after it has judged the claim.
            </p>
            <p>
              One clearinghouse connects a provider to thousands of payers. When Change Healthcare was taken offline by
              a cyberattack in February 2024, claims and payments stalled across the country for weeks.
            </p>
          </Card>
        </div>
      ),
    },
    {
      label: 'Adjudication',
      who: CAST.payer,
      standard: 'Benefit plan, provider contract, accumulators',
      when: 'Most clean claims within 30 days',
      body: (
        <div className="cards">
          <Card title="Checks">
            <ul className="checks">
              <li>Member was covered on the date of service</li>
              <li>{preventive ? 'Service is a covered preventive benefit' : 'Service is a covered benefit'}</li>
              <li>Provider is in the network</li>
              {meta.priorAuth && <li>Authorization is on file</li>}
              <li>Not a duplicate, and not bundled into another service</li>
              {meta.inpatient && <li>Grouper assigns {meta.inpatient.drg}</li>}
            </ul>
          </Card>
          <Card title="Pricing and cost share">
            <Rows rows={[...pricing, ...share]} />
            <Rows
              rows={[
                ['Patient responsibility', <strong>{usd2(l.patientPaid)}</strong>],
                ['Plan pays', <strong>{usd2(l.planPaid)}</strong>],
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      label: 'Remittance and EOB',
      who: `${CAST.payer} tells the provider and the patient`,
      standard: 'X12 835 to the provider, explanation of benefits to the patient',
      when: 'With the payment, typically two to four weeks after the claim',
      body: (
        <div className="cards">
          <Card title="What the provider sees" tag="835 remittance">
            <Rows
              rows={[
                ['Billed', usd2(l.charge)],
                ['CO-45 · charge exceeds contract rate', minus(l.contractualAdjustment)],
                ['PR-1 · deductible', minus(l.deductible)],
                ['PR-2 · coinsurance', minus(l.coinsurance)],
                ['Payment to provider', <strong>{usd2(l.planPaid)}</strong>],
              ]}
            />
            <p className="footnote">
              CO marks an amount the provider must write off. PR marks an amount the provider may bill the patient.
            </p>
          </Card>
          <Card title="What the patient sees" tag="Explanation of benefits">
            <Rows
              rows={[
                ['Provider', meta.provider],
                ['Service', l.line.label],
                ['Amount billed', usd2(l.charge)],
                ['Plan discount', minus(l.contractualAdjustment)],
                ['Plan paid', minus(l.planPaid)],
                ['Applied to your deductible', usd2(l.deductible)],
                ['Your coinsurance', usd2(l.coinsurance)],
                ['What you owe', <strong>{usd2(l.patientPaid)}</strong>],
              ]}
            />
            <p className="footnote">
              This is not a bill. After this claim: deductible {usd2(l.after.deductibleMet)} of{' '}
              {usd2(inputs.deductible)}, out-of-pocket {usd2(l.after.oopMet)} of {usd2(inputs.moop)}.
            </p>
          </Card>
        </div>
      ),
    },
    {
      label: 'Patient bill',
      who: `${meta.provider} bills ${CAST.patient}`,
      standard: 'Patient statement',
      when: 'After the remittance, often 30 to 60 days after care',
      body: (
        <Card title="Statement">
          {l.patientPaid > 0 ? (
            <>
              <Rows
                rows={[
                  ['Amount due from the patient', <strong>{usd2(l.patientPaid)}</strong>],
                  ['Expected never to be collected', usd2(m.badDebt)],
                ]}
              />
              <p className="footnote">
                The provider may bill only the patient responsibility from the remittance. An in-network provider may
                not bill the patient for the {usd2(l.contractualAdjustment)} it wrote off. The uncollected share
                assumes {inputs.badDebtPct}% of patient balances go unpaid.
              </p>
            </>
          ) : (
            <p>No bill is sent. The patient owes nothing for this service.</p>
          )}
        </Card>
      ),
    },
    {
      label: 'Payment and margin',
      who: `${meta.provider}'s finance team`,
      standard: 'Payment posting, cost accounting',
      when: 'When the money arrives',
      body: (
        <Card title="What the provider keeps">
          <Rows
            rows={[
              ['Paid by the plan', usd2(l.planPaid)],
              ['Collected from the patient', usd2(l.patientPaid - m.badDebt)],
              ['Total collected', usd2(m.collected)],
              ['Direct cost', minus(m.directCost)],
              ['Contribution margin', <strong>{usd2(m.contributionMargin)}</strong>],
              ['Indirect cost', minus(m.indirectCost)],
              ['Margin after all costs', <strong>{usd2(m.fullMargin)}</strong>],
            ]}
          />
          <p className="footnote">
            Contribution margin is what the service adds toward overhead. Margin after all costs depends on how
            overhead is allocated, which is a choice, not a fact.
          </p>
        </Card>
      ),
    },
  ];
}

function rxStages(r: AdjudicatedRx, before: Accumulators, inputs: Inputs): Stage[] {
  const copay = [inputs.rx1, inputs.rx2, inputs.rx3, inputs.rx4][r.fill.tier - 1] ?? 0;
  const terms = DEFAULT_PHARMACY;
  const moopMet = before.oopMet >= inputs.moop;
  return [
    {
      label: 'Prescription',
      who: 'The prescriber sends it to the pharmacy',
      standard: 'NCPDP SCRIPT (electronic prescribing)',
      when: 'At the visit or at discharge',
      body: (
        <Card title="Electronic prescription">
          <Rows
            rows={[
              ['Patient', CAST.patient],
              ['Drug', r.fill.label],
              ['Purpose', r.fill.purpose],
              ['Supply', '30 days'],
            ]}
          />
        </Card>
      ),
    },
    {
      label: 'Pharmacy claim',
      who: 'The pharmacy, while the patient waits',
      standard: 'NCPDP Telecommunication claim',
      when: 'At the counter, in real time',
      body: (
        <Card title="Claim sent from the pharmacy computer" tag="Stylized">
          <Rows
            rows={[
              ['Routing numbers (BIN, PCN, group)', 'From the member ID card; they say which benefit manager to send to'],
              ['Cardholder ID', CAST.memberId],
              ['Product (NDC)', '00000-0000-00, the 11-digit code for the exact drug, strength and package'],
              ['Quantity and days supply', '30 tablets, 30 days'],
              ['Drug cost submitted', usd2(r.pharmacyPaid - terms.dispensingFee)],
              ['Dispensing fee', usd2(terms.dispensingFee)],
            ]}
          />
          <p className="footnote">
            There is no claim form and no diagnosis code. The drug is named by its NDC, not by a procedure code.
          </p>
        </Card>
      ),
    },
    {
      label: 'Switch',
      who: 'A pharmacy switch, the pharmacy counterpart of a clearinghouse',
      standard: 'NCPDP routing',
      when: 'Under a second',
      body: (
        <Card title="Routing">
          <p>
            The switch reads the routing numbers, checks the claim format and passes it to {CAST.pbm}. Change
            Healthcare runs one of the largest switches as well as a medical clearinghouse.
          </p>
        </Card>
      ),
    },
    {
      label: 'Benefit manager decides',
      who: 'The plan\u2019s pharmacy benefit manager',
      standard: 'Formulary, pharmacy network contract, accumulators',
      when: 'A few seconds',
      body: (
        <Card title="Adjudication">
          <Rows
            rows={[
              ['Formulary tier', `Tier ${r.fill.tier}${r.fill.brand ? ', brand, prior authorization required' : ', generic'}`],
              ['Price the plan recognizes', usd2(r.planPrice)],
              ['Copay for this tier', usd2(copay)],
              [
                'Rule applied',
                moopMet
                  ? 'Out-of-pocket maximum already met: patient pays nothing'
                  : inputs.hdhp && !r.fill.preventiveList
                    ? 'High-deductible plan: price applies to the deductible'
                    : inputs.hdhp
                      ? 'Preventive drug list: copay applies before the deductible, and never more than the price'
                      : 'Patient pays the lesser of the copay and the price',
              ],
              ['Patient pays', <strong>{usd2(r.patientPaid)}</strong>],
              ['Plan pays', <strong>{usd2(r.planPaid)}</strong>],
            ]}
          />
        </Card>
      ),
    },
    {
      label: 'At the counter',
      who: `The pharmacy and ${CAST.patient}`,
      standard: 'Paid response on the pharmacy screen',
      when: 'Before the patient leaves',
      body: (
        <Card title="What the patient sees">
          <Rows
            rows={[
              ['Due at pickup', <strong>{usd2(r.patientPaid)}</strong>],
              ['Out-of-pocket after this fill', `${usd2(r.after.oopMet)} of ${usd2(inputs.moop)}`],
            ]}
          />
          <p className="footnote">
            The patient gets a receipt, not an explanation of benefits. The fill appears later in the plan&apos;s
            member portal or a periodic statement.
          </p>
        </Card>
      ),
    },
    {
      label: 'Settlement and rebates',
      who: 'The pharmacy benefit manager, the pharmacy, the plan sponsor and the drug maker',
      standard: 'Payment cycles and rebate contracts',
      when: 'Pharmacy paid in weeks; rebates settle months later',
      body: (
        <Card title="Where the money goes">
          <Rows
            rows={[
              ['Pharmacy receives in total', usd2(r.pharmacyPaid)],
              ['Kept by the benefit manager as spread', usd2(r.pbmSpread)],
              ['Manufacturer rebate', usd2(r.rebateTotal)],
              ['Rebate passed to the plan sponsor', usd2(r.rebateToSponsor)],
              ['Rebate kept by the benefit manager', usd2(r.rebateKeptByPbm)],
            ]}
          />
          <p className="footnote">
            {r.fill.brand
              ? 'Rebates are paid on brand drugs and never reach the patient at the counter.'
              : 'Generic drugs carry no manufacturer rebate. The benefit manager earns its margin on spread and fees.'}
          </p>
        </Card>
      ),
    },
  ];
}

type Claim = { id: string; label: string; kind: string } & (
  | { type: 'medical'; result: AdjudicatedLine }
  | { type: 'rx'; result: AdjudicatedRx }
);

interface Props {
  step: StepView;
  inputs: Inputs;
  econ: ProviderEconomics;
}

/** Follows one claim from the selected step around the loop, one stage at a time. */
export function ClaimCycle({ step, inputs, econ }: Props) {
  const claims: Claim[] = [
    ...step.lines.map((l) => ({
      type: 'medical' as const,
      id: l.line.id,
      label: l.line.label,
      kind: l.line.kind === 'facility' ? 'Facility claim' : 'Professional claim',
      result: l,
    })),
    ...step.fills.map((f) => ({
      type: 'rx' as const,
      id: f.fill.id,
      label: f.fill.label,
      kind: f.fill.otc ? 'Over the counter' : 'Pharmacy claim',
      result: f,
    })),
  ];
  const [claimId, setClaimId] = useState(claims[0].id);
  const [stage, setStage] = useState(0);

  // A new episode step starts on its first claim; a new claim starts at stage 1.
  useEffect(() => {
    setClaimId(claims[0].id);
    setStage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  const index = Math.max(0, claims.findIndex((c) => c.id === claimId));
  const claim = claims[index];
  const before = index === 0 ? step.before : claims[index - 1].result.after;

  let stages: Stage[] = [];
  let noCycle: ReactNode = null;
  if (claim.type === 'medical') {
    if (claim.result.line.costShare === 'globalPackage') {
      noCycle = (
        <p>
          No separately payable claim is created. The surgeon&apos;s fee for the operation covers routine follow-up
          visits for 90 days, so this visit is recorded for tracking and paid nothing.
        </p>
      );
    } else stages = medicalStages(claim.result, before, inputs, econ);
  } else if (claim.result.fill.otc) {
    noCycle = (
      <p>
        No claim is created. The patient buys it off the shelf for {usd2(claim.result.patientPaid)}. No insurer sees
        the purchase, and it does not count toward the deductible or the out-of-pocket maximum.
      </p>
    );
  } else stages = rxStages(claim.result, before, inputs);

  const current = Math.min(stage, Math.max(0, stages.length - 1));
  const s = stages[current];

  return (
    <section className="cycle" aria-labelledby="cycle-heading">
      <div className="section-head">
        <h2 id="cycle-heading">Follow one claim</h2>
        <label className="claim-pick">
          <span>Claim</span>
          <select
            value={claim.id}
            onChange={(e) => {
              setClaimId(e.target.value);
              setStage(0);
            }}
          >
            {claims.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind}: {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">{CAST.note}</p>

      {noCycle ? (
        <div className="card">{noCycle}</div>
      ) : (
        <>
          <div className="cycle-top">
            <CycleRing labels={stages.map((x) => x.label)} current={current} onSelect={setStage} />
            <div className="cycle-side">
              <ol className="stage-list">
                {stages.map((x, i) => (
                  <li key={x.label}>
                    <button
                      type="button"
                      className={i === current ? 'current' : i < current ? 'done' : ''}
                      aria-current={i === current ? 'step' : undefined}
                      onClick={() => setStage(i)}
                    >
                      <span className="step-num">{i + 1}</span>
                      {x.label}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="stepper">
                <button type="button" onClick={() => setStage(current - 1)} disabled={current === 0}>
                  Back
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => setStage(current + 1)}
                  disabled={current >= stages.length - 1}
                >
                  Next stage
                </button>
              </div>
            </div>
          </div>

          <div className="stage" aria-live="polite">
            <h3>
              {current + 1}. {s.label}
            </h3>
            <Rows
              rows={[
                ['Who acts', s.who],
                ['Language used', s.standard],
                ['Timing', s.when],
              ]}
            />
            {s.body}
          </div>
        </>
      )}
    </section>
  );
}
