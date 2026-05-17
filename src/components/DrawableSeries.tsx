import { useRef, useState } from 'react';

interface Props {
  label: string;
  values: number[];
  min: number;
  max: number;
  step?: number;
  color?: string;
  unitSuffix?: string;
  formatValue?: (v: number) => string;
  formatTick?: (v: number) => string;
  onChange: (next: number[]) => void;
  height?: number;
  hint?: string;
}

const PAD_LEFT = 36;
const PAD_RIGHT = 8;
const PAD_TOP = 6;
const PAD_BOTTOM = 18;

export function DrawableSeries({
  label,
  values,
  min,
  max,
  step = 0.1,
  color = '#2563eb',
  unitSuffix = '',
  formatValue,
  formatTick,
  onChange,
  height = 110,
  hint,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);
  const lastIndexRef = useRef<number | null>(null);
  const lastValueRef = useRef<number | null>(null);
  const [hover, setHover] = useState<{ index: number; value: number } | null>(null);
  const [flatInput, setFlatInput] = useState('');

  const n = values.length;
  const fmt = formatValue ?? ((v: number) => `${v.toFixed(step < 1 ? 1 : 0)}${unitSuffix}`);
  const tickFmt = formatTick ?? ((v: number) => `${v.toFixed(0)}`);

  const width = 320;
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;
  const stepX = n > 1 ? chartW / (n - 1) : chartW;

  const valueToY = (v: number) => PAD_TOP + chartH - ((v - min) / (max - min)) * chartH;
  const xToIndex = (x: number) => {
    const rel = (x - PAD_LEFT) / Math.max(stepX, 1);
    return clamp(Math.round(rel), 0, n - 1);
  };
  const yToValue = (y: number) => {
    const rel = (PAD_TOP + chartH - y) / chartH;
    const raw = min + rel * (max - min);
    return clamp(round(raw, step), min, max);
  };

  function applyDraw(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    const y = ((clientY - rect.top) / rect.height) * height;

    const index = xToIndex(x);
    const value = yToValue(y);

    const next = [...values];
    next[index] = value;

    const lastIdx = lastIndexRef.current;
    const lastVal = lastValueRef.current;
    if (lastIdx !== null && lastVal !== null && Math.abs(index - lastIdx) > 1) {
      const lo = Math.min(lastIdx, index);
      const hi = Math.max(lastIdx, index);
      for (let i = lo; i <= hi; i++) {
        const t = (i - lastIdx) / (index - lastIdx);
        next[i] = clamp(round(lastVal + t * (value - lastVal), step), min, max);
      }
    }

    lastIndexRef.current = index;
    lastValueRef.current = value;
    setHover({ index, value });
    onChange(next);
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    lastIndexRef.current = null;
    lastValueRef.current = null;
    applyDraw(e.clientX, e.clientY);
    e.preventDefault();
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (draggingRef.current) {
      applyDraw(e.clientX, e.clientY);
      e.preventDefault();
    }
  }
  function onPointerUp() {
    draggingRef.current = false;
    lastIndexRef.current = null;
    lastValueRef.current = null;
  }

  function applyFlat() {
    const v = Number(flatInput);
    if (!Number.isFinite(v)) return;
    onChange(values.map(() => clamp(round(v, step), min, max)));
  }

  const polylinePoints = values
    .map((v, i) => `${(PAD_LEFT + i * stepX).toFixed(2)},${valueToY(v).toFixed(2)}`)
    .join(' ');
  const areaPoints = `${PAD_LEFT},${PAD_TOP + chartH} ${polylinePoints} ${(
    PAD_LEFT +
    (n - 1) * stepX
  ).toFixed(2)},${PAD_TOP + chartH}`;

  const xTickStride = Math.max(1, Math.ceil(n / 6));
  const yTicks = [min, (min + max) / 2, max];

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hover ? (
          <span className="text-xs text-slate-600 tabular-nums">
            Y{hover.index + 1}: {fmt(hover.value)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">drag to draw →</span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full block bg-slate-50 rounded border border-slate-200 select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {yTicks.map((tv) => (
          <g key={`y${tv}`}>
            <line
              x1={PAD_LEFT}
              x2={PAD_LEFT + chartW}
              y1={valueToY(tv)}
              y2={valueToY(tv)}
              stroke="#e2e8f0"
              strokeDasharray="2 3"
            />
            <text
              x={PAD_LEFT - 4}
              y={valueToY(tv) + 3}
              textAnchor="end"
              fontSize="9"
              fill="#94a3b8"
            >
              {tickFmt(tv)}
            </text>
          </g>
        ))}
        {Array.from({ length: n }, (_, i) =>
          i % xTickStride === 0 || i === n - 1 ? (
            <text
              key={`x${i}`}
              x={PAD_LEFT + i * stepX}
              y={height - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              Y{i + 1}
            </text>
          ) : null,
        )}
        <polygon points={areaPoints} fill={color} fillOpacity="0.12" />
        <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth="1.8" />
        {values.map((v, i) => (
          <circle
            key={`p${i}`}
            cx={PAD_LEFT + i * stepX}
            cy={valueToY(v)}
            r={hover?.index === i ? 3.2 : 2}
            fill={color}
          />
        ))}
        {hover && (
          <line
            x1={PAD_LEFT + hover.index * stepX}
            x2={PAD_LEFT + hover.index * stepX}
            y1={PAD_TOP}
            y2={PAD_TOP + chartH}
            stroke={color}
            strokeOpacity="0.3"
          />
        )}
      </svg>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">Flat:</span>
        <input
          type="text"
          inputMode="decimal"
          value={flatInput}
          placeholder={fmt(values[0] ?? 0)}
          onChange={(e) => setFlatInput(e.target.value)}
          className="w-20 px-2 py-1 border border-slate-300 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={applyFlat}
          className="px-2 py-1 border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
        >
          Apply to all
        </button>
        {hint && <span className="text-slate-400 ml-auto">{hint}</span>}
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round(n: number, step: number): number {
  if (step <= 0) return n;
  return Math.round(n / step) * step;
}
