import { ANNUAL_NISA_LIMIT, LIFETIME_NISA_LIMIT, ScenarioResult } from '../types';

interface Props {
  hold: ScenarioResult;
  sell: ScenarioResult;
  showSell: boolean;
}

export function QuotaBar({ hold, sell, showSell }: Props) {
  return (
    <div className="bg-white rounded-md p-4 shadow-sm space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        NISA quota usage
      </h3>
      <Bar
        label="Scenario A · peak lifetime usage"
        value={hold.peakLifetimeUsage}
        max={LIFETIME_NISA_LIMIT}
        accent="brand"
      />
      {showSell && (
        <Bar
          label="Scenario B · peak lifetime usage"
          value={sell.peakLifetimeUsage}
          max={LIFETIME_NISA_LIMIT}
          accent="amber"
        />
      )}
      <Bar
        label="Annual cap (illustrative)"
        value={Math.min(
          ANNUAL_NISA_LIMIT,
          hold.yearly[hold.yearly.length - 1]?.annualQuotaUsed ?? 0,
        )}
        max={ANNUAL_NISA_LIMIT}
        accent="slate"
        sublabel={`¥${ANNUAL_NISA_LIMIT.toLocaleString()} per year`}
      />
    </div>
  );
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  accent: 'brand' | 'amber' | 'slate';
  sublabel?: string;
}

function Bar({ label, value, max, accent, sublabel }: BarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const fillClass =
    accent === 'brand' ? 'bg-brand-500' : accent === 'amber' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1 text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">
          ¥{Math.round(value).toLocaleString()} / ¥{max.toLocaleString()} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded overflow-hidden">
        <div className={`h-full ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}
