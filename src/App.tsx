import { useEffect, useMemo, useState } from 'react';
import { SimulationInputs } from './types';
import { simulate } from './lib/simulator';
import { loadInputs, saveInputs } from './lib/storage';
import { Currency } from './lib/format';
import { InputPanel } from './components/InputPanel';
import { SummaryCards } from './components/SummaryCards';
import { ResultChart } from './components/ResultChart';
import { QuotaBar } from './components/QuotaBar';
import { ResultTable } from './components/ResultTable';

const DEFAULT_INPUTS: SimulationInputs = {
  currentPortfolioValue: 1_000_000,
  currentReturnPct: 10,
  projectedReturnPct: 5,
  monthlyContribution: 50_000,
  currentFxRate: 150,
  projectedFxRate: 150,
  foreignAllocationPct: 100,
  horizonYears: 20,
  yearOfSale: 10,
};

function mergeInputs(saved: Partial<SimulationInputs> | null): SimulationInputs {
  if (!saved) return DEFAULT_INPUTS;
  return { ...DEFAULT_INPUTS, ...saved };
}

export default function App() {
  const [inputs, setInputs] = useState<SimulationInputs>(() => mergeInputs(loadInputs()));
  const [currency, setCurrency] = useState<Currency>('JPY');

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  const hold = useMemo(() => simulate(inputs, 'hold'), [inputs]);
  const sell = useMemo(() => simulate(inputs, 'sellReinvest'), [inputs]);

  const showSell = inputs.yearOfSale > 0 && inputs.yearOfSale <= inputs.horizonYears;

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
              onClick={() => setInputs(DEFAULT_INPUTS)}
              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
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
            yearOfSale={inputs.yearOfSale}
            showSell={showSell}
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
