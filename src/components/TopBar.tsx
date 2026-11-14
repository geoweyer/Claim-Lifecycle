import { useEffect, useState } from 'react';

export const SECTIONS: { id: string; label: string }[] = [
  { id: 'episode', label: 'Episode' },
  { id: 'standing', label: 'Deductible' },
  { id: 'detail', label: 'Step detail' },
  { id: 'claim', label: 'Follow a claim' },
  { id: 'price', label: 'Price' },
  { id: 'totals', label: 'Totals' },
  { id: 'money', label: 'Money and risk' },
  { id: 'languages', label: 'Languages' },
  { id: 'settings', label: 'Settings' },
];

interface Props {
  step: number;
  stepTitle: string;
  stepCount: number;
  onStep: (step: number) => void;
}

/** Sticky bar: the step control stays in reach, and links jump between sections. */
export function TopBar({ step, stepTitle, stepCount, onStep }: Props) {
  const [active, setActive] = useState(SECTIONS[0].id);

  // Highlight the section nearest the top of the viewport.
  useEffect(() => {
    const onScroll = () => {
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The URL hash holds the scenario, so sections are reached by scrolling, not by anchor links.
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
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
        <nav aria-label="Sections of this page">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="navlink"
                  aria-current={active === s.id ? 'true' : undefined}
                  onClick={() => go(s.id)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
