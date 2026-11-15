import { SITE_NAME } from '../site';
import { usd0, type EpisodeView } from '../episodeView';
import { TABS, type TabId } from '../state';
import { HISTORY } from '../data/anatomy';
import { ExplodedView } from './ExplodedView';

interface Props {
  view: EpisodeView;
  onOpen: (tab: TabId) => void;
}

const GUIDE: Record<Exclude<TabId, 'home'>, string> = {
  episode: 'Eight encounters in sequence. Billed, allowed and paid amounts for every line, with the accumulators running.',
  claim: 'One claim at a time: 270/271, the claim form, the clearinghouse, adjudication, the 835 and the EOB.',
  price: 'Charge, allowed amount, plan paid, patient responsibility, cost and the Medicare rate, side by side.',
  money: 'Fully insured against self-funded. Where premium goes, and who absorbs a $100,000 claimant.',
  languages: 'ICD-10, CPT, HCPCS, DRGs, APCs, X12, NCPDP, NDC and LOINC: who keeps each one and what it is for.',
  assumptions: 'Benefit design, contract rates, funding terms and provider cost ratios. Every figure on the site follows from these.',
};

/** The front page: what this is, the system as a drawing, and where to go next. */
export function Home({ view, onOpen }: Props) {
  const claims = view.steps.reduce((t, s) => t + s.lines.length, 0);
  const fills = view.steps.reduce((t, s) => t + s.fills.length, 0);

  return (
    <>
      <header className="home-hero">
        <p className="eyebrow">Commercial coverage · one patient · one plan year</p>
        <h1>{SITE_NAME}</h1>
        <p className="hero-lede">
          One cardiac patient generates {claims} medical claims and {usd0(view.totals.charge)} in billed charges in a
          single plan year. The contracts allow {usd0(view.totals.allowed)} of it. This site follows each claim from
          the eligibility check to the remittance, and shows why the patient, the employer, the payer and the hospital
          each report a different price for the same care.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={() => onOpen('episode')}>
            Start with the episode
          </button>
          <button type="button" onClick={() => document.getElementById('anatomy')?.scrollIntoView({ block: 'start' })}>
            See the system taken apart
          </button>
        </div>
      </header>

      <section aria-labelledby="story-heading">
        <h2 id="story-heading">How we got here</h2>
        <div className="story">
          <p>
            Nobody designed the way Americans pay for medical care. The arrangement was assembled over a century from
            answers to narrower questions: how a Dallas hospital could collect from schoolteachers, how wartime
            employers could hire under wage controls, what it would take to get physicians to accept Medicare. Each
            answer outlived its question. A claim filed today still passes through all of them.
          </p>
        </div>
        <ol className="history">
          {HISTORY.map((h) => (
            <li key={h.year}>
              <span className="history-year">{h.year}</span>
              <div>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="story">
          <p>
            The result has a recognizable logic once the layers are separated. Providers bill charges that few payers
            pay. Payers reprice each claim to a contract that is usually pegged to Medicare. The benefit design then
            splits the allowed amount between the plan and the member, and the funding arrangement decides whose money
            the plan&apos;s share really is. The rest of this site works through one case in that order.
          </p>
        </div>
      </section>

      <section id="anatomy" tabIndex={-1} aria-labelledby="anatomy-heading">
        <h2 id="anatomy-heading">The system, taken apart</h2>
        <p className="lede">Six parts, in the order a claim meets them. Select one to separate it into its steps.</p>
        <ExplodedView onOpen={onOpen} />
      </section>

      <section aria-labelledby="patient-heading">
        <h2 id="patient-heading">The case this site follows</h2>
        <div className="case">
          <p>
            An annual preventive visit ends in a cardiology referral. The cardiologist orders a stress echo at the
            hospital. A diagnostic cath at a surgery center follows, then a three-vessel CABG with an ICU stay, and
            36 sessions of cardiac rehab. The member starts the year with a $0 preventive visit, works through the
            deductible, pays coinsurance, and reaches the out-of-pocket maximum during the surgical admission.
          </p>
          <dl className="tiles">
            <div className="tile">
              <dt>Encounters</dt>
              <dd>{view.steps.length}</dd>
              <dd className="hint">
                {claims} medical claims and {fills} prescriptions
              </dd>
            </div>
            <div className="tile">
              <dt>Billed</dt>
              <dd>{usd0(view.totals.charge)}</dd>
              <dd className="hint">At list price</dd>
            </div>
            <div className="tile">
              <dt>Allowed</dt>
              <dd>{usd0(view.totals.allowed)}</dd>
              <dd className="hint">Under the contracts</dd>
            </div>
            <div className="tile">
              <dt>Patient pays</dt>
              <dd>{usd0(view.totals.patientPaid)}</dd>
              <dd className="hint">The plan pays {usd0(view.totals.planPaid)}</dd>
            </div>
          </dl>
          <p className="notice">
            Prices are illustrative. Medicare amounts are 2026 national rates with no geographic adjustment.
            Commercial allowed amounts are those rates times contract percentages that can be changed in Settings. The
            patient and organizations are fictional.
          </p>
        </div>
      </section>

      <section aria-labelledby="guide-heading">
        <h2 id="guide-heading">Where to go</h2>
        <ul className="guide">
          {TABS.filter((t) => t.id !== 'home').map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => onOpen(t.id)}>
                <strong>{t.label}</strong>
                <span>{GUIDE[t.id as Exclude<TabId, 'home'>]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
