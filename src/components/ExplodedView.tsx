import { useEffect, useState } from 'react';
import { ANATOMY } from '../data/anatomy';
import type { TabId } from '../state';

interface Props {
  onOpen: (tab: TabId) => void;
}

/**
 * The system as a flat drawing of six parts. Selecting a part lifts it out and
 * separates it into its layers, like an exploded architectural drawing.
 */
export function ExplodedView({ onOpen }: Props) {
  const [partId, setPartId] = useState<string | null>(null);
  const [apart, setApart] = useState(false);
  const [active, setActive] = useState(0);
  const part = ANATOMY.find((p) => p.id === partId) ?? null;

  // Start collapsed, then separate on the next frame so the layers visibly pull apart.
  useEffect(() => {
    setApart(false);
    setActive(0);
    if (!partId) return;
    const t = window.setTimeout(() => setApart(true), 60);
    return () => window.clearTimeout(t);
  }, [partId]);

  return (
    <div className="anatomy">
      <ol className="plan" aria-label="The six parts of the payment system">
        {ANATOMY.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className="plan-part"
              aria-expanded={p.id === partId}
              aria-controls="exploded"
              onClick={() => setPartId(p.id === partId ? null : p.id)}
            >
              <span className="step-num">{i + 1}</span>
              <span className="plan-name">{p.name}</span>
              <span className="plan-who">{p.who}</span>
            </button>
          </li>
        ))}
      </ol>

      <div id="exploded">
        {!part ? (
          <p className="plan-hint">Select a part to pull it apart.</p>
        ) : (
          <div className="exploded">
            <div className="scene" aria-hidden="true" style={{ ['--n' as string]: part.layers.length }}>
              <div className={`stack${apart ? ' apart' : ''}`}>
                {part.layers.map((l, i) => (
                  <div
                    key={l.title}
                    className={`plate${i === active ? ' active' : ''}`}
                    style={{ ['--z' as string]: part.layers.length - 1 - i }}
                    onMouseEnter={() => setActive(i)}
                  >
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="layers">
              <h3>{part.name}</h3>
              <p className="lede">{part.summary}</p>
              <ol>
                {part.layers.map((l, i) => (
                  <li key={l.title}>
                    <button
                      type="button"
                      className={i === active ? 'active' : ''}
                      aria-pressed={i === active}
                      onClick={() => setActive(i)}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                    >
                      <span className="step-num">{i + 1}</span>
                      <span className="layer-text">
                        <strong>{l.title}</strong>
                        <span>{l.text}</span>
                        {l.language && <span className="badge">{l.language}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="layer-actions">
                <button type="button" className="primary" onClick={() => onOpen(part.tab)}>
                  {part.link}
                </button>
                <button type="button" onClick={() => setPartId(null)}>
                  Put it back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
