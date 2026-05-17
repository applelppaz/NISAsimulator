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

interface Props {
  hold: ScenarioResult;
  sell: ScenarioResult;
  currency: Currency;
  fxRate: number;
  yearOfSale: number;
  showSell: boolean;
}

interface ChartRow {
  year: number;
  hold: number;
  sellTotal: number;
  sellInNisa: number;
  sellCash: number;
}

export function ResultChart({ hold, sell, currency, fxRate, yearOfSale, showSell }: Props) {
  const data: ChartRow[] = hold.yearly.map((y, i) => {
    const s = sell.yearly[i];
    return {
      year: y.year,
      hold: toDisplay(y.portfolioValue, currency, fxRate),
      sellTotal: toDisplay(s.portfolioValue + s.cashOutsideNisa, currency, fxRate),
      sellInNisa: toDisplay(s.portfolioValue, currency, fxRate),
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

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Portfolio value over time
      </h3>
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
            <Line
              type="monotone"
              dataKey="hold"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
            />
            {showSell && (
              <Line
                type="monotone"
                dataKey="sellTotal"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={false}
              />
            )}
            {showSell && (
              <Line
                type="monotone"
                dataKey="sellCash"
                stroke="#a3a3a3"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            )}
            {showSell && yearOfSale > 0 && (
              <ReferenceLine
                x={yearOfSale}
                stroke="#d97706"
                strokeDasharray="2 4"
                label={{ value: 'Sale', fontSize: 11, fill: '#d97706', position: 'top' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function labelFor(key: string): string {
  switch (key) {
    case 'hold':
      return 'A: Hold & Continue';
    case 'sellTotal':
      return 'B: Sell & Reinvest (total)';
    case 'sellInNisa':
      return 'B: In NISA';
    case 'sellCash':
      return 'B: Cash awaiting reinvestment';
    default:
      return key;
  }
}

function toDisplay(amountJpy: number, currency: Currency, fxRate: number): number {
  return currency === 'JPY' ? amountJpy : amountJpy / Math.max(fxRate, 0.0001);
}
