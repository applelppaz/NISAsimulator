import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ScenarioResult } from '../types';
import { Currency, formatCurrency } from '../lib/format';

export type ChartMetric = 'value' | 'gain';

interface Props {
  hold: ScenarioResult;
  sell: ScenarioResult;
  currency: Currency;
  fxRate: number;
  sellSeries: number[];
  showSell: boolean;
  metrics: ChartMetric[];
  onMetricsChange: (next: ChartMetric[]) => void;
}

interface ChartRow {
  year: number;
  holdValue: number;
  holdGain: number;
  sellValue: number;
  sellGain: number;
  sellCash: number;
}

export function ResultChart({
  hold,
  sell,
  currency,
  fxRate,
  sellSeries,
  showSell,
  metrics,
  onMetricsChange,
}: Props) {
  const showValue = metrics.includes('value');
  const showGain = metrics.includes('gain');

  const saleYears = sellSeries
    .map((v, i) => (v > 0 ? { year: i + 1, pct: v } : null))
    .filter((x): x is { year: number; pct: number } => x !== null);

  const data: ChartRow[] = hold.yearly.map((y, i) => {
    const s = sell.yearly[i];
    const holdTotal = y.portfolioValue;
    const sellTotal = s.portfolioValue + s.cashOutsideNisa;
    return {
      year: y.year,
      holdValue: toDisplay(holdTotal, currency, fxRate),
      holdGain: toDisplay(holdTotal - y.totalContributed, currency, fxRate),
      sellValue: toDisplay(sellTotal, currency, fxRate),
      sellGain: toDisplay(sellTotal - s.totalContributed, currency, fxRate),
      sellCash: toDisplay(s.cashOutsideNisa, currency, fxRate),
    };
  });

  const yTickFormatter = (n: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
    return `${currency === 'JPY' ? '¥' : '$'}${formatted}`;
  };

  function toggle(metric: ChartMetric) {
    const has = metrics.includes(metric);
    if (has && metrics.length > 1) onMetricsChange(metrics.filter((m) => m !== metric));
    else if (!has) onMetricsChange([...metrics, metric]);
  }

  const titleParts: string[] = [];
  if (showValue) titleParts.push('value');
  if (showGain) titleParts.push('gain');

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Portfolio {titleParts.join(' & ')} over time
        </h3>
        <div className="inline-flex rounded border border-slate-300 overflow-hidden text-xs">
          {(['value', 'gain'] as const).map((m) => {
            const active = metrics.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggle(m)}
                className={`px-2 py-1 ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m === 'value' ? 'Value' : 'Gain'}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tickFormatter={(y) => `Y${y}`}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis tickFormatter={yTickFormatter} stroke="#94a3b8" fontSize={12} width={70} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(
                  currency === 'JPY' ? value : value * fxRate,
                  currency,
                  fxRate,
                ),
                labelFor(name),
              ]}
              labelFormatter={(y) => `Year ${y}`}
              contentStyle={{ borderRadius: 6, fontSize: 12 }}
            />
            <Legend
              formatter={(name) => labelFor(name as string)}
              wrapperStyle={{ fontSize: 12 }}
            />
            {showValue && (
              <Line
                type="monotone"
                dataKey="holdValue"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
              />
            )}
            {showGain && (
              <Line
                type="monotone"
                dataKey="holdGain"
                stroke="#2563eb"
                strokeWidth={1.8}
                strokeDasharray="6 3"
                dot={false}
              />
            )}
            {showSell && showValue && (
              <Line
                type="monotone"
                dataKey="sellValue"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={false}
              />
            )}
            {showSell && showGain && (
              <Line
                type="monotone"
                dataKey="sellGain"
                stroke="#d97706"
                strokeWidth={1.8}
                strokeDasharray="6 3"
                dot={false}
              />
            )}
            {showSell && showValue && (
              <Line
                type="monotone"
                dataKey="sellCash"
                stroke="#a3a3a3"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            )}
            {showSell &&
              saleYears.map((s) => (
                <ReferenceLine
                  key={s.year}
                  x={s.year}
                  stroke="#d97706"
                  strokeDasharray="2 4"
                  label={{
                    value: `${Math.round(s.pct)}%`,
                    fontSize: 10,
                    fill: '#d97706',
                    position: 'top',
                  }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function labelFor(key: string): string {
  switch (key) {
    case 'holdValue':
      return 'A: Value';
    case 'holdGain':
      return 'A: Gain';
    case 'sellValue':
      return 'B: Value (total)';
    case 'sellGain':
      return 'B: Gain';
    case 'sellCash':
      return 'B: Cash awaiting reinvestment';
    default:
      return key;
  }
}

function toDisplay(amountJpy: number, currency: Currency, fxRate: number): number {
  return currency === 'JPY' ? amountJpy : amountJpy / Math.max(fxRate, 0.0001);
}
