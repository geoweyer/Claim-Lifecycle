import { useEffect, useRef, useState } from 'react';
import { usd0 } from '../episodeView';

export interface FlowNode {
  label: string;
  /** Used when the diagram is narrow. */
  short?: string;
  value: number;
  /** Draws the node and its ribbon in the accent color. */
  highlight?: boolean;
}

interface Props {
  sources: FlowNode[];
  hub: string;
  uses: FlowNode[];
  ariaLabel: string;
}

const SLOT = 36; // minimum vertical room per label (two lines of text)
const GAP = 8;
const NODE_W = 10;
const HUB_H = 240;
const TOP = 8;

interface Placed extends FlowNode {
  /** Node rectangle. */
  y: number;
  h: number;
  /** Where the ribbon meets the hub. */
  hubY: number;
}

function place(nodes: FlowNode[], total: number): { placed: Placed[]; height: number } {
  let y = TOP;
  let hubY = TOP;
  const placed = nodes.map((n) => {
    const h = Math.max(2, (n.value / total) * HUB_H);
    const slot = Math.max(h, SLOT);
    const node = { ...n, y: y + (slot - h) / 2, h, hubY };
    y += slot + GAP;
    hubY += (n.value / total) * HUB_H;
    return node;
  });
  return { placed, height: y - GAP };
}

function ribbon(x0: number, top0: number, h0: number, x1: number, top1: number, h1: number): string {
  const mid = (x0 + x1) / 2;
  return [
    `M${x0},${top0}`,
    `C${mid},${top0} ${mid},${top1} ${x1},${top1}`,
    `L${x1},${top1 + h1}`,
    `C${mid},${top1 + h1} ${mid},${top0 + h0} ${x0},${top0 + h0}`,
    'Z',
  ].join(' ');
}

/** A three-column flow: sources into one hub, the hub out to uses. Sized to its container. */
export function Sankey({ sources, hub, uses, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(300, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ins = sources.filter((n) => n.value > 0);
  const outs = uses.filter((n) => n.value > 0);
  const total = ins.reduce((t, n) => t + n.value, 0);
  if (total <= 0) return <div ref={ref} />;

  const left = place(ins, total);
  const right = place(outs, total);
  const height = Math.max(left.height, right.height, TOP + HUB_H) + 8;
  const hubTop = TOP + (height - 8 - TOP - HUB_H) / 2;

  const narrow = width < 520;
  const labelW = narrow ? 112 : 150;
  const xLeft = labelW;
  const xRight = width - labelW - NODE_W;
  const xHub = (xLeft + xRight) / 2;

  const label = (n: Placed, x: number, anchor: 'start' | 'end') => (
    <text x={x} y={n.y + n.h / 2} textAnchor={anchor} className="flow-label">
      <tspan x={x} dy="-0.2em">
        {narrow ? (n.short ?? n.label) : n.label}
      </tspan>
      <tspan x={x} dy="1.25em" className="flow-value">
        {usd0(n.value)}
      </tspan>
    </text>
  );

  return (
    <div ref={ref} className="sankey">
      <p className="flow-hub">
        {hub}: <strong>{usd0(total)}</strong> for the year
      </p>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {left.placed.map((n) => (
          <path
            key={n.label}
            className={`flow-link${n.highlight ? ' highlight' : ''}`}
            d={ribbon(xLeft + NODE_W, n.y, n.h, xHub, hubTop + (n.hubY - TOP), (n.value / total) * HUB_H)}
          >
            <title>
              {n.label}: {usd0(n.value)}
            </title>
          </path>
        ))}
        {right.placed.map((n) => (
          <path
            key={n.label}
            className={`flow-link${n.highlight ? ' highlight' : ''}`}
            d={ribbon(xHub + NODE_W, hubTop + (n.hubY - TOP), (n.value / total) * HUB_H, xRight, n.y, n.h)}
          >
            <title>
              {n.label}: {usd0(n.value)}
            </title>
          </path>
        ))}
        {left.placed.map((n) => (
          <g key={n.label}>
            <rect className={`flow-node${n.highlight ? ' highlight' : ''}`} x={xLeft} y={n.y} width={NODE_W} height={n.h} />
            {label(n, xLeft - 8, 'end')}
          </g>
        ))}
        {right.placed.map((n) => (
          <g key={n.label}>
            <rect className={`flow-node${n.highlight ? ' highlight' : ''}`} x={xRight} y={n.y} width={NODE_W} height={n.h} />
            {label(n, xRight + NODE_W + 8, 'start')}
          </g>
        ))}
        <rect className="flow-node" x={xHub} y={hubTop} width={NODE_W} height={HUB_H} />
      </svg>
    </div>
  );
}
