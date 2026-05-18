import { useEffect, useMemo, useState } from 'react';
import { SimulationInputs } from './types';
import { simulate } from './lib/simulator';
import { loadInputs, saveInputs } from './lib/storage';
import { Currency } from './lib/format';
import { InputPanel } from './components/InputPanel';
import { SummaryCards } from './components/SummaryCards';
import { ChartMetric, ResultChart } from './components/ResultChart';
import { QuotaBar } from './components/QuotaBar';
import { ResultTable } from './components/ResultTable';

const DEFAULT_HORIZON = 20;
const DEFAULT_RETURN = 5;
const DEFAULT_FOREIGN = 100;
const DEFAULT_FX = 150;

function makeDefaultInputs(): SimulationInputs {
  return {
    currentPortfolioValue: 1_000_000,
    currentReturnPct: 10,
    monthlyContribution: 50_000,
    currentFxRate: DEFAULT_FX,
    horizonYears: DEFAULT_HORIZON,
    returnSeries: filled(DEFAULT_HORIZON, DEFAULT_RETURN),
    foreignSeries: filled(DEFAULT_HORIZON, DEFAULT_FOREIGN),
    fxSeries: filled(DEFAULT_HORIZON, DEFAULT_FX),
    sellSeries: filled(DEFAULT_HORIZON, 0),
  };
}

function filled(n: number, v: number): number[] {
  return Array.from({ length: n }, () => v);
}

function resize(arr: number[] | undefined, length: number, fallback: number): number[] {
  const src = arr ?? [];
  if (src.length === length) return src;
  if (src.length > length) return src.slice(0, length);
  const last = src.length > 0 ? src[src.length - 1] : fallback;
  return [...src, ...filled(length - src.length, last)];
}

function mergeInputs(saved: Partial<SimulationInputs> | null): SimulationInputs {
  const defaults = makeDefaultInputs();
  if (!saved) return defaults;
  const horizon =
    typeof saved.horizonYears === 'number' && saved.horizonYears > 0
      ? Math.min(50, Math.max(1, Math.floor(saved.horizonYears)))
      : defaults.horizonYears;
  const currentFx =
    typeof saved.currentFxRate === 'number' && saved.currentFxRate > 0
      ? saved.currentFxRate
      : defaults.currentFxRate;
  return {
    currentPortfolioValue: numOrDefault(saved.currentPortfolioValue, defaults.currentPortfolioValue),
    currentReturnPct: numOrDefault(saved.currentReturnPct, defaults.currentReturnPct),
    monthlyContribution: numOrDefault(saved.monthlyContribution, defaults.monthlyContribution),
    currentFxRate: currentFx,
    horizonYears: horizon,
    returnSeries: resize(saved.returnSeries, horizon, DEFAULT_RETURN),
    foreignSeries: resize(saved.foreignSeries, horizon, DEFAULT_FOREIGN),
    fxSeries: resize(saved.fxSeries, horizon, currentFx),
    sellSeries: resize(saved.sellSeries, horizon, 0),
  };
}

function numOrDefault(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export default function App() {
  const [inputs, setInputsRaw] = useState<SimulationInputs>(() => mergeInputs(loadInputs()));
  const [currency, setCurrency] = useState<Currency>('JPY');
  const [chartMetrics, setChartMetrics] = useState<ChartMetric[]>(['value']);

  const setInputs = (next: SimulationInputs) => {
    if (next.horizonYears !== inputs.horizonYears) {
      next = {
        ...next,
        returnSeries: resize(next.returnSeries, next.horizonYears, DEFAULT_RETURN),
        foreignSeries: resize(next.foreignSeries, next.horizonYears, DEFAULT_FOREIGN),
        fxSeries: resize(next.fxSeries, next.horizonYears, next.currentFxRate),
        sellSeries: resize(next.sellSeries, next.horizonYears, 0),
      };
    }
    setInputsRaw(next);
  };

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  const hold = useMemo(() => simulate(inputs, 'hold'), [inputs]);
  const sell = useMemo(() => simulate(inputs, 'sellReinvest'), [inputs]);

  const showSell = inputs.sellSeries.some((v) => v > 0);

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              NISA Profit Simulator
            </h1>
            <p className="text-xs text-slate-500">
              Project your new NISA portfolio under different scenarios.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
            <button
              type="button"
              onClick={() => setInputsRaw(makeDefaultInputs())}
              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <aside className="bg-white rounded-md p-4 shadow-sm lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <InputPanel inputs={inputs} onChange={setInputs} />
        </aside>
        <section className="space-y-4 min-w-0">
          <SummaryCards
            hold={hold}
            sell={sell}
            currency={currency}
            fxRate={inputs.currentFxRate}
            showSell={showSell}
          />
          <ResultChart
            hold={hold}
            sell={sell}
            currency={currency}
            fxRate={inputs.currentFxRate}
            sellSeries={inputs.sellSeries}
            showSell={showSell}
            metrics={chartMetrics}
            onMetricsChange={setChartMetrics}
          />
          <QuotaBar hold={hold} sell={sell} showSell={showSell} />
          <ResultTable
            hold={hold}
            sell={sell}
            currency={currency}
            fxRate={inputs.currentFxRate}
            showSell={showSell}
          />
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-slate-400">
        Estimates only — actual returns will vary. Not investment advice.
      </footer>
    </div>
  );
}

function CurrencyToggle({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-xs">
      {(['JPY', 'USD'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`px-2 py-1 ${
            currency === c
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
