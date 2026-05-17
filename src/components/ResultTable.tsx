import { useState } from 'react';
import { ScenarioResult } from '../types';
import { Currency, formatCompactCurrency } from '../lib/format';

interface Props {
  hold: ScenarioResult;
  sell: ScenarioResult;
  currency: Currency;
  fxRate: number;
  showSell: boolean;
}

export function ResultTable({ hold, sell, currency, fxRate, showSell }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
      >
        Year-by-year breakdown
        <span aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="text-left py-1 pr-3">Year</th>
                <th className="text-right py-1 pr-3">A · Portfolio</th>
                {showSell && <th className="text-right py-1 pr-3">B · In NISA</th>}
                {showSell && <th className="text-right py-1 pr-3">B · Cash</th>}
                {showSell && <th className="text-right py-1 pr-3">B · Total</th>}
                <th className="text-right py-1 pr-3">A · Quota used</th>
                <th className="text-right py-1">FX</th>
              </tr>
            </thead>
            <tbody>
              {hold.yearly.map((y, i) => {
                const s = sell.yearly[i];
                return (
                  <tr key={y.year} className="border-t border-slate-100">
                    <td className="py-1 pr-3 text-slate-500">Y{y.year}</td>
                    <td className="text-right py-1 pr-3">
                      {formatCompactCurrency(y.portfolioValue, currency, fxRate)}
                    </td>
                    {showSell && (
                      <td className="text-right py-1 pr-3">
                        {formatCompactCurrency(s.portfolioValue, currency, fxRate)}
                      </td>
                    )}
                    {showSell && (
                      <td className="text-right py-1 pr-3 text-slate-500">
                        {s.cashOutsideNisa > 0
                          ? formatCompactCurrency(s.cashOutsideNisa, currency, fxRate)
                          : '—'}
                      </td>
                    )}
                    {showSell && (
                      <td className="text-right py-1 pr-3">
                        {formatCompactCurrency(
                          s.portfolioValue + s.cashOutsideNisa,
                          currency,
                          fxRate,
                        )}
                      </td>
                    )}
                    <td className="text-right py-1 pr-3 text-slate-500">
                      ¥{Math.round(y.lifetimeQuotaUsed).toLocaleString()}
                    </td>
                    <td className="text-right py-1 text-slate-500">{y.fxRate.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
