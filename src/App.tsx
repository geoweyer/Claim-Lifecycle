import { useEffect, useMemo, useState } from 'react';
import { ClaimCycle } from './components/ClaimCycle';
import { Home } from './components/Home';
import { InputsPanel } from './components/InputsPanel';
import { Languages } from './components/Languages';
import { Meters } from './components/Meters';
import { MoneyFlow } from './components/MoneyFlow';
import { PriceLenses } from './components/PriceLenses';
import { StepDetail } from './components/StepDetail';
import { Timeline } from './components/Timeline';
import { STEP_TABS, TopBar } from './components/TopBar';
import { buildEpisodeView, usd0 } from './episodeView';
import { SITE_NAME } from './site';
import { TABS, useInputs, type TabId } from './state';
import './styles.css';

const INTRO: Record<Exclude<TabId, 'home'>, string> = {
  episode: 'One patient, from a preventive visit to bypass surgery and recovery. Step through to see what is billed, what is allowed, and who pays.',
  claim: 'Choose a claim from the current step and follow it from the eligibility check to the provider’s margin.',
  price: 'The same care has a different price depending on who is asked.',
  money: 'How the plan is funded for the year, and who absorbs the cost of this episode.',
  languages: 'The code sets and message standards that carry a clinical event through the payment system.',
  assumptions: 'Every number on this site follows from these settings. Change one and the whole episode re-flows.',
};

export default function App() {
  const { inputs, update, reset, tab, setTab } = useInputs();
  const view = useMemo(() => buildEpisodeView(inputs), [inputs]);
  const step = inputs.step;
  const setStep = (n: number) => update({ step: Math.min(view.steps.length, Math.max(1, n)) });
  const current = view.steps[step - 1];

  // Opening a tab starts at its top, with focus on the content for keyboard and screen-reader users.
  const openTab = (next: TabId) => {
    setTab(next);
    window.scrollTo({ top: 0 });
    window.setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }), 0);
  };

  useEffect(() => {
    const label = TABS.find((t) => t.id === tab)?.label;
    document.title = tab === 'home' ? SITE_NAME : `${label} · ${SITE_NAME}`;
  }, [tab]);

  // A button to return to the top appears once the reader has scrolled well down a tab.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Running totals through the current step, with the whole-episode figure alongside.
  const soFar = (pick: (s: (typeof view.steps)[number]) => number) =>
    view.steps.slice(0, step).reduce((t, s) => t + pick(s), 0);
  const tiles: [string, number, number][] = [
    ['Billed charges', soFar((s) => s.charge), view.totals.charge],
    ['Allowed amount', soFar((s) => s.allowed), view.totals.allowed],
    ['Plan pays', soFar((s) => s.planPaid), view.totals.planPaid],
    ['Patient pays', soFar((s) => s.patientPaid), view.totals.patientPaid],
  ];

  const index = TABS.findIndex((t) => t.id === tab);
  const next = TABS[index + 1];
  const tabLabel = TABS[index].label;

  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <TopBar tab={tab} onTab={openTab} step={step} stepTitle={current.title} stepCount={view.steps.length} onStep={setStep} />
      <p className="sr-only" role="status">
        {tabLabel}
        {STEP_TABS.includes(tab) &&
          `. Step ${step} of ${view.steps.length}: ${current.title}. Patient pays ${usd0(current.patientPaid)}.`}
      </p>

      <main id="main" tabIndex={-1} className="viz-root">
        {tab === 'home' ? (
          <Home view={view} onOpen={openTab} />
        ) : (
          <header className="tab-head">
            <h1>{tabLabel}</h1>
            <p>{INTRO[tab]}</p>
          </header>
        )}

        {tab === 'episode' && (
          <>
            <Timeline view={view} step={step} onStep={setStep} />
            <Meters view={view} step={step} />
            <StepDetail step={current} inputs={inputs} />
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
          </>
        )}
        {tab === 'claim' && <ClaimCycle step={current} inputs={inputs} econ={view.econ} />}
        {tab === 'price' && <PriceLenses view={view} inputs={inputs} step={step} />}
        {tab === 'money' && <MoneyFlow view={view} inputs={inputs} update={update} />}
        {tab === 'languages' && <Languages view={view} />}
        {tab === 'assumptions' && <InputsPanel inputs={inputs} update={update} reset={reset} />}

        {tab !== 'home' && (
          <nav className="tab-foot" aria-label="Continue">
            <button type="button" onClick={() => openTab('home')}>
              ← Home
            </button>
            {next && (
              <button type="button" className="primary" onClick={() => openTab(next.id)}>
                Next: {next.label} →
              </button>
            )}
          </nav>
        )}
      </main>

      {scrolled && (
        <button type="button" className="to-top" onClick={() => window.scrollTo({ top: 0 })}>
          ↑ Top
        </button>
      )}
    </>
  );
}
