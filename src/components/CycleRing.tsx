interface Props {
  labels: string[];
  current: number;
  onSelect: (index: number) => void;
}

const SIZE = 300;
const C = SIZE / 2;
const R = 112;
const NODE = 20;

function point(i: number, n: number, r = R) {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

/** The claim's path drawn as a loop of numbered stops with a token on the current one. */
export function CycleRing({ labels, current, onSelect }: Props) {
  const n = labels.length;
  const here = point(current, n);
  const circumference = 2 * Math.PI * R;
  return (
    <svg className="ring" viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label="Stages of the claim">
      <circle className="ring-path" cx={C} cy={C} r={R} />
      <circle
        className="ring-progress"
        cx={C}
        cy={C}
        r={R}
        transform={`rotate(-90 ${C} ${C})`}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - current / n)}
      />
      <circle className="ring-token" r={NODE + 6} style={{ transform: `translate(${here.x}px, ${here.y}px)` }} />
      {labels.map((label, i) => {
        const p = point(i, n);
        const state = i === current ? 'current' : i < current ? 'done' : 'future';
        return (
          <g
            key={label}
            className={`ring-node ${state}`}
            role="button"
            tabIndex={0}
            aria-label={`Stage ${i + 1}: ${label}`}
            aria-current={i === current ? 'step' : undefined}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(i);
              }
            }}
          >
            <circle cx={p.x} cy={p.y} r={NODE} />
            <text x={p.x} y={p.y} dy="0.35em" textAnchor="middle">
              {i + 1}
            </text>
          </g>
        );
      })}
      <text className="ring-center-small" x={C} y={C - 14} textAnchor="middle">
        Stage {current + 1} of {n}
      </text>
      <foreignObject x={C - 70} y={C - 6} width={140} height={60}>
        <div className="ring-center">{labels[current]}</div>
      </foreignObject>
    </svg>
  );
}
