import { round2 } from '../engine/adjudicate';
import { allocateRisk, fundingSummary, providerMargin, type RiskAllocation } from '../engine/economics';
import { fundingFrom, usd0, type EpisodeView } from '../episodeView';
import type { Inputs } from '../state';
import { Sankey, type FlowNode } from './Sankey';

interface Props {
  view: EpisodeView;
  inputs: Inputs;
  update: (patch: Partial<Inputs>) => void;
}

const BEARERS: { key: keyof RiskAllocation; label: string; cls: string }[] = [
  { key: 'patient', label: 'Patient', cls: 'fill-ded' },
  { key: 'employer', label: 'Employer', cls: 'fill-employer' },
  { key: 'stopLossCarrier', label: 'Stop-loss insurer', cls: 'fill-stoploss' },
  { key: 'carrier', label: 'Health insurer', cls: 'fill-plan' },
];

const pctText = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Who funds the plan, who bears the cost of this episode, and what the providers keep. */
export function MoneyFlow({ view, inputs, update }: Props) {
  const { patientPaid, planPaid } = view.totals;
  const episode = patientPaid + planPaid;
  const models = [
    { selfFunded: false, name: 'Fully insured' },
    { selfFunded: true, name: 'Self-funded' },
  ].map((m) => {
    const terms = fundingFrom(inputs, m.selfFunded);
    return {
      ...m,
      risk: allocateRisk(patientPaid, planPaid, terms),
      withEpisode: fundingSummary(planPaid, terms),
      without: fundingSummary(0, terms),
    };
  });
  const active = models[inputs.selfFunded ? 1 : 0];
  const f = active.withEpisode;
  const employerDelta = round2(f.employerNetCost - active.without.employerNetCost);
  const otherClaims = round2(f.claims - planPaid);

  // Sources and uses of the plan's money for the year.
  let sources: FlowNode[];
  let uses: FlowNode[];
  if (!inputs.selfFunded) {
    sources = [
      { label: 'Employer premium', short: 'Employer', value: f.employerContribution },
      { label: 'Employee premium', short: 'Employees', value: f.employeeContribution },
      { label: 'Insurer covers loss', short: 'Insurer loss', value: Math.max(0, -f.margin) },
    ];
    uses = [
      { label: 'Other members’ claims', short: 'Other claims', value: otherClaims },
      { label: 'This episode', value: planPaid, highlight: true },
      { label: 'Administration', value: f.admin },
      { label: 'Loss-ratio rebate', short: 'Rebate', value: f.mlrRebate },
      { label: 'Insurer margin', value: Math.max(0, f.margin) },
    ];
  } else {
    const employerPays = Math.max(0, f.employerContribution);
    sources = [
      { label: 'Employer funding', short: 'Employer', value: employerPays },
      { label: 'Employee contributions', short: 'Employees', value: f.employeeContribution },
      { label: 'Stop-loss payout', value: f.stopLossRecovery },
    ];
    uses = [
      { label: 'Other members’ claims', short: 'Other claims', value: otherClaims },
      { label: 'This episode', value: planPaid, highlight: true },
      { label: 'Administrator fees', short: 'Admin fees', value: f.admin },
      { label: 'Stop-loss premium', short: 'Stop-loss cost', value: f.stopLossPremium },
      { label: 'Left with employer', short: 'Employer keeps', value: Math.max(0, -f.employerContribution) },
    ];
  }

  const tiles: [string, string, string][] = inputs.selfFunded
    ? [
        ['Employer cost this year', usd0(f.employerNetCost), 'Claims, fees and stop-loss premium, less employee contributions'],
        ['Added by this episode', usd0(employerDelta), 'The employer pays claims up to the stop-loss attachment point'],
        ['Paid by stop-loss', usd0(f.stopLossRecovery), `Claims for one member above ${usd0(inputs.attachment)}`],
        ['Against budget', usd0(f.margin), f.margin >= 0 ? 'Under budget: the employer keeps the difference' : 'Over budget: the employer covers the difference'],
      ]
    : [
        ['Employer cost this year', usd0(f.employerNetCost), 'Its share of the premium, fixed for the year'],
        ['Added by this episode', usd0(employerDelta), 'Nothing this year; it may raise next year’s renewal'],
        ['Medical loss ratio', pctText(f.medicalLossRatio ?? 0), `Claims as a share of premium. Minimum ${pctText(fundingFrom(inputs, false).mlrFloor)}; any shortfall is refunded`],
        ['Insurer margin', usd0(f.margin), 'Premium less claims, administration and rebate'],
      ];

  // Provider side of the episode, by claim type.
  const lines = view.steps.flatMap((s) => s.lines);
  const providerRows = (['facility', 'professional'] as const).map((kind) => {
    const ms = lines.filter((l) => l.line.kind === kind).map((l) => providerMargin(l, view.econ));
    const sum = (pick: (m: (typeof ms)[number]) => number) => round2(ms.reduce((t, m) => t + pick(m), 0));
    const collected = sum((m) => m.collected);
    return {
      kind: kind === 'facility' ? 'Facilities' : 'Physicians and other professionals',
      charge: sum((m) => m.charge),
      collected,
      direct: sum((m) => m.directCost),
      indirect: sum((m) => m.indirectCost),
      contribution: sum((m) => m.contributionMargin),
      full: sum((m) => m.fullMargin),
      pct: collected > 0 ? sum((m) => m.fullMargin) / collected : 0,
    };
  });
  const fills = view.steps.flatMap((s) => s.fills);
  const rebate = round2(fills.reduce((t, r) => t + r.rebateTotal, 0));
  const rebateSponsor = round2(fills.reduce((t, r) => t + r.rebateToSponsor, 0));

  return (
    <section className="money" aria-labelledby="money-heading">
      <div className="section-head">
        <h2 id="money-heading">Who pays for the plan, and who is at risk</h2>
        <div className="segmented" role="group" aria-label="Funding model">
          {models.map((m) => (
            <button
              key={m.name}
              type="button"
              aria-pressed={inputs.selfFunded === m.selfFunded}
              onClick={() => update({ selfFunded: m.selfFunded })}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <p className="lede">
        {inputs.selfFunded
          ? 'Self-funded: the employer pays claims from its own money and hires an administrator to process them. It buys stop-loss insurance to cap what one very sick member can cost.'
          : 'Fully insured: the employer and employees pay a fixed premium. The insurer pays the claims and keeps or loses the difference.'}
      </p>

      <h3>Who absorbs the {usd0(episode)} this episode cost</h3>
      <ul className="legend">
        {BEARERS.map((b) => (
          <li key={b.key}>
            <span className={`swatch ${b.cls}`} /> {b.label}
          </li>
        ))}
      </ul>
      <div className="risk">
        {models.map((m) => (
          <div key={m.name} className={`risk-row${m === active ? ' active' : ''}`}>
            <div className="risk-name">{m.name}</div>
            <div
              className="track tall"
              role="img"
              aria-label={`${m.name}: ${BEARERS.filter((b) => m.risk[b.key] > 0)
                .map((b) => `${b.label} ${usd0(m.risk[b.key])}`)
                .join(', ')}`}
            >
              {BEARERS.map((b) => (
                <div
                  key={b.key}
                  className={`fill ${b.cls}`}
                  style={{ width: `${episode > 0 ? (m.risk[b.key] / episode) * 100 : 0}%` }}
                  title={`${b.label}: ${usd0(m.risk[b.key])}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Funding model</th>
              {BEARERS.map((b) => (
                <th key={b.key} scope="col" className="num">
                  {b.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.name}>
                <th scope="row">{m.name}</th>
                {BEARERS.map((b) => (
                  <td key={b.key} className="num">
                    {usd0(m.risk[b.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>
        The plan&apos;s year, {inputs.selfFunded ? 'self-funded' : 'fully insured'}, {inputs.employees.toLocaleString('en-US')} employees
      </h3>
      <dl className="tiles">
        {tiles.map(([label, value, hint]) => (
          <div className="tile" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
            <p>{hint}</p>
          </div>
        ))}
      </dl>
      <Sankey
        sources={sources}
        hub={inputs.selfFunded ? 'Plan funding' : 'Premium'}
        uses={uses}
        ariaLabel={`Money flow for the year. In: ${sources.filter((n) => n.value > 0).map((n) => `${n.label} ${usd0(n.value)}`).join(', ')}. Out: ${uses.filter((n) => n.value > 0).map((n) => `${n.label} ${usd0(n.value)}`).join(', ')}.`}
      />
      <p className="footnote">
        This episode is one member&apos;s care in a group of {inputs.employees.toLocaleString('en-US')}. Other
        members&apos; claims are an assumed average. The loss ratio here is claims divided by premium; the legal
        formula also adjusts for taxes and quality spending.
      </p>

      <h3>What the providers keep from this episode</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Provider type</th>
              <th scope="col" className="num">Billed</th>
              <th scope="col" className="num">Collected</th>
              <th scope="col" className="num">Direct cost</th>
              <th scope="col" className="num">Contribution margin</th>
              <th scope="col" className="num">Indirect cost</th>
              <th scope="col" className="num">Margin after all costs</th>
              <th scope="col" className="num">As a share of collected</th>
            </tr>
          </thead>
          <tbody>
            {providerRows.map((r) => (
              <tr key={r.kind}>
                <th scope="row">{r.kind}</th>
                <td className="num">{usd0(r.charge)}</td>
                <td className="num">{usd0(r.collected)}</td>
                <td className="num">{usd0(r.direct)}</td>
                <td className="num">{usd0(r.contribution)}</td>
                <td className="num">{usd0(r.indirect)}</td>
                <td className="num">{usd0(r.full)}</td>
                <td className="num">{pctText(r.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        Provider cost is modeled from the cost-to-charge ratios in the settings below, so these margins are
        illustrations, not findings.
        {rebate > 0 &&
          ` Drug maker rebates on this episode: ${usd0(rebate)}, of which ${usd0(rebateSponsor)} goes to the plan sponsor and the rest stays with the pharmacy benefit manager.`}
      </p>
    </section>
  );
}
