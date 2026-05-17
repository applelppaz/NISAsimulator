import { ScenarioResult } from '../types';
import { Currency, formatCompactCurrency, formatPercent } from '../lib/format';

interface Props {
  hold: ScenarioResult;
  sell: ScenarioResult;
  currency: Currency;
  fxRate: number;
  showSell: boolean;
}

export function SummaryCards({ hold, sell, currency, fxRate, showSell }: Props) {
  return (
    <div className={`grid gap-4 ${showSell ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
      <ScenarioCard
        title="Scenario A · Hold & Continue"
        accent="brand"
        result={hold}
        currency={currency}
        fxRate={fxRate}
      />
      {showSell && (
        <ScenarioCard
          title="Scenario B · Sell & Reinvest"
          accent="amber"
          result={sell}
          currency={currency}
          fxRate={fxRate}
          delta={sell.finalTotalValue - hold.finalTotalValue}
        />
      )}
    </div>
  );
}

interface CardProps {
  title: string;
  accent: 'brand' | 'amber';
  result: ScenarioResult;
  currency: Currency;
  fxRate: number;
  delta?: number;
}

function ScenarioCard({ title, accent, result, currency, fxRate, delta }: CardProps) {
  const borderClass = accent === 'brand' ? 'border-brand-500' : 'border-amber-500';
  const gainPct =
    result.totalContributed > 0
      ? (result.totalGain / result.totalContributed) * 100
      : 0;

  return (
    <div className={`bg-white border-l-4 ${borderClass} rounded-md p-4 shadow-sm`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        <Stat
          label="Final total value"
          value={formatCompactCurrency(result.finalTotalValue, currency, fxRate)}
          emphasis
        />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat
            label="Total contributed"
            value={formatCompactCurrency(result.totalContributed, currency, fxRate)}
          />
          <Stat
            label="Total gain"
            value={formatCompactCurrency(result.totalGain, currency, fxRate)}
            sub={formatPercent(gainPct)}
            positive={result.totalGain >= 0}
          />
        </div>
        {delta !== undefined && (
          <div
            className={`text-xs px-2 py-1 rounded ${
              delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {delta >= 0 ? '+' : ''}
            {formatCompactCurrency(delta, currency, fxRate)} vs Scenario A
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  emphasis,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`tabular-nums ${
          emphasis ? 'text-2xl font-semibold' : 'text-base font-medium'
        } ${positive === false ? 'text-rose-600' : 'text-slate-900'}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
