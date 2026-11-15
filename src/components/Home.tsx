import { SITE_NAME } from '../site';
import { usd0, type EpisodeView } from '../episodeView';
import { TABS, type TabId } from '../state';
import { ExplodedView } from './ExplodedView';

interface Props {
  view: EpisodeView;
  onOpen: (tab: TabId) => void;
}

const GUIDE: Record<Exclude<TabId, 'home'>, string> = {
  episode: 'Eight encounters in order, with the deductible and out-of-pocket maximum filling as you go.',
  claim: 'Pick any claim and follow it stage by stage, from the eligibility check to the provider’s margin.',
  price: 'The same care priced by the patient, the employer, the health plan, the provider and Medicare.',
  money: 'Who funds the plan, where the money goes, and who absorbs a $100,000 year.',
  languages: 'The code sets and message formats that carry a visit through the system.',
  assumptions: 'Change the plan, the contracts, the funding and the provider costs, and watch everything re-flow.',
};

/** The front page: what this is, the system as a drawing, and where to go next. */
export function Home({ view, onOpen }: Props) {
  const claims = view.steps.reduce((t, s) => t + s.lines.length, 0);
  const fills = view.steps.reduce((t, s) => t + s.fills.length, 0);

  return (
    <>
      <header className="home-hero">
        <p className="eyebrow">A commercial health plan, one patient, one year</p>
        <h1>{SITE_NAME}</h1>
        <p className="hero-lede">
          A visit to the doctor lasts twenty minutes. The paperwork it sets off lasts months, passes through a dozen
          organizations, and is written in languages most patients never see. This site follows the money through all
          of it.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={() => onOpen('episode')}>
            Start the walk-through
          </button>
          <button type="button" onClick={() => document.getElementById('anatomy')?.scrollIntoView({ block: 'start' })}>
            See how the system fits together
          </button>
        </div>
      </header>

      <section aria-labelledby="story-heading">
        <h2 id="story-heading">How a visit becomes a payment</h2>
        <div className="story">
          <p>
            It starts before anyone is sick. An employer and its workers put money into a plan, and a contract sets
            out what the plan will pay and what the patient must pay first. That contract is the reason a price exists
            at all.
          </p>
          <p>
            Then someone needs care. What happens in the exam room is spoken and written in ordinary clinical
            language. None of it can be paid for in that form, so it is translated: the reason for the visit into one
            set of codes, the work done into another, the hospital stay into a third.
          </p>
          <p>
            The coded visit is packed into a claim, checked by a middleman, and delivered to the health plan. The plan
            does not pay what was billed. It looks up the rate it negotiated, works out how much of that rate falls to
            the patient, and pays the rest.
          </p>
          <p>
            Each party then hears the result in its own terms. The provider sees a payment and a write-off. The patient
            sees what they owe. The employer sees a premium, or a claim against its own funds. Each of them will tell
            you a different number when asked what the care cost, and each of them will be right.
          </p>
        </div>
      </section>

      <section id="anatomy" tabIndex={-1} aria-labelledby="anatomy-heading">
        <h2 id="anatomy-heading">The system, taken apart</h2>
        <p className="lede">Six parts, in the order money and information pass through them. Each one opens into its layers.</p>
        <ExplodedView onOpen={onOpen} />
      </section>

      <section aria-labelledby="patient-heading">
        <h2 id="patient-heading">The case this site follows</h2>
        <div className="case">
          <p>
            A routine check-up turns up a concern. The patient is sent to a cardiologist, then for a stress test, then
            a heart catheterization, and finally bypass surgery, followed by weeks of cardiac rehabilitation. Along
            the way the patient moves from free preventive care, through the deductible and coinsurance, to the
            out-of-pocket maximum.
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
            Prices are illustrative. Medicare amounts are 2026 national rates; commercial prices are those rates times
            contract percentages you can change in Settings. The patient and organizations are fictional.
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
