import { SITE_NAME } from '../site';
import { TABS, type TabId } from '../state';

interface Props {
  tab: TabId;
  onTab: (tab: TabId) => void;
  step: number;
  stepTitle: string;
  stepCount: number;
  onStep: (step: number) => void;
}

/** Tabs that show one step of the episode at a time. */
export const STEP_TABS: TabId[] = ['episode', 'claim', 'price'];

/** Sticky bar: the site name leads home from anywhere, tabs switch views, and the step control stays in reach. */
export function TopBar({ tab, onTab, step, stepTitle, stepCount, onStep }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button type="button" className="brand" onClick={() => onTab('home')} aria-label={`${SITE_NAME}, home`}>
          {SITE_NAME}
        </button>
        <nav aria-label="Main">
          <ul>
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="navlink"
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={() => onTab(t.id)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {STEP_TABS.includes(tab) && (
        <div className="topbar-inner stepbar">
          <div className="stepper">
            <button type="button" onClick={() => onStep(step - 1)} disabled={step <= 1} aria-label="Previous step">
              Back
            </button>
            <span className="topbar-step">
              <strong>
                Step {step} of {stepCount}
              </strong>
              <span className="topbar-title"> · {stepTitle}</span>
            </span>
            <button type="button" className="primary" onClick={() => onStep(step + 1)} disabled={step >= stepCount}>
              Next step
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
