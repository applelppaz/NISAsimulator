import { useEffect, useState } from 'react';
import { ANNUAL_NISA_LIMIT, LIFETIME_NISA_LIMIT, SimulationInputs } from '../types';
import { DrawableSeries } from './DrawableSeries';

interface Props {
  inputs: SimulationInputs;
  onChange: (next: SimulationInputs) => void;
}

export function InputPanel({ inputs, onChange }: Props) {
  const set = <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) =>
    onChange({ ...inputs, [key]: value });

  const monthlyCap = Math.floor(ANNUAL_NISA_LIMIT / 12);
  const monthlyOverCap = inputs.monthlyContribution > monthlyCap;

  return (
    <div className="space-y-5">
      <Section title="Your current position">
        <NumberField
          label="Current portfolio value"
          unit="JPY"
          value={inputs.currentPortfolioValue}
          onChange={(v) => set('currentPortfolioValue', v)}
        />
        <NumberField
          label="Current unrealized return"
          unit="%"
          value={inputs.currentReturnPct}
          onChange={(v) => set('currentReturnPct', v)}
          hint="Used to back out your cost basis (簿価)."
        />
      </Section>

      <Section title="Contribution">
        <NumberField
          label="Monthly contribution"
          unit="JPY"
          value={inputs.monthlyContribution}
          onChange={(v) => set('monthlyContribution', v)}
          hint={`Annual cap is ¥${ANNUAL_NISA_LIMIT.toLocaleString()} (¥${monthlyCap.toLocaleString()} / month).`}
          warning={
            monthlyOverCap
              ? `Above the ¥${monthlyCap.toLocaleString()} monthly equivalent — extra will be ignored.`
              : undefined
          }
        />
      </Section>

      <Section title="Time horizon">
        <SliderField
          label="Investment horizon"
          unit="years"
          value={inputs.horizonYears}
          min={1}
          max={50}
          step={1}
          onChange={(v) => set('horizonYears', v)}
        />
      </Section>

      <Section title="Projected annual return (per year)">
        <DrawableSeries
          label="Return %"
          values={inputs.returnSeries}
          min={-10}
          max={20}
          step={0.5}
          color="#2563eb"
          unitSuffix="%"
          formatTick={(v) => `${v}%`}
          onChange={(v) => set('returnSeries', v)}
          hint="local-currency return, FX applied separately"
        />
      </Section>

      <Section title="Foreign-asset allocation (per year)">
        <DrawableSeries
          label="Foreign %"
          values={inputs.foreignSeries}
          min={0}
          max={100}
          step={1}
          color="#0891b2"
          unitSuffix="%"
          formatTick={(v) => `${v}%`}
          onChange={(v) => set('foreignSeries', v)}
          hint="0 = all domestic, 100 = all オールカントリー"
        />
      </Section>

      <Section title="USD/JPY exchange rate (per year)">
        <NumberField
          label="Current USD/JPY rate"
          unit="JPY"
          value={inputs.currentFxRate}
          onChange={(v) => set('currentFxRate', v)}
          hint="Baseline for year 0 — the drawable below sets the rate at end of each year."
        />
        <DrawableSeries
          label="USD/JPY at end of year"
          values={inputs.fxSeries}
          min={80}
          max={250}
          step={1}
          color="#16a34a"
          unitSuffix=""
          formatTick={(v) => v.toFixed(0)}
          onChange={(v) => set('fxSeries', v)}
        />
      </Section>

      <Section title="Sell schedule (Scenario B)">
        <DrawableSeries
          label="Sell % of holdings"
          values={inputs.sellSeries}
          min={0}
          max={100}
          step={1}
          color="#d97706"
          unitSuffix="%"
          formatTick={(v) => `${v}%`}
          onChange={(v) => set('sellSeries', v)}
          hint="0% = no sale that year. Cost basis (簿価) restores next year."
        />
      </Section>

      <div className="text-xs text-slate-500 leading-relaxed bg-slate-100 rounded-md p-3">
        <p className="font-semibold text-slate-700 mb-1">New NISA rules used</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Annual contribution cap: ¥{ANNUAL_NISA_LIMIT.toLocaleString()}</li>
          <li>Lifetime cost-basis cap: ¥{LIFETIME_NISA_LIMIT.toLocaleString()}</li>
          <li>Gains and dividends inside NISA are tax-free</li>
          <li>When sold, the cost basis is restored to lifetime quota the next year</li>
        </ul>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  unit: string;
  value: number;
  hint?: string;
  warning?: string;
  onChange: (v: number) => void;
}

function NumberField({ label, unit, value, hint, warning, onChange }: NumberFieldProps) {
  const [text, setText] = useState(formatForInput(value));

  useEffect(() => {
    setText((prev) => {
      const parsed = Number(prev);
      if (prev === '' || prev === '-' || !Number.isFinite(parsed) || parsed !== value) {
        return formatForInput(value);
      }
      return prev;
    });
  }, [value]);

  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <input
        type="text"
        inputMode="decimal"
        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm tabular-nums"
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (next === '' || next === '-') return;
          const n = Number(next);
          if (Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => {
          const n = Number(text);
          if (text === '' || !Number.isFinite(n)) setText(formatForInput(value));
          else setText(formatForInput(n));
        }}
      />
      {hint && !warning && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {warning && <p className="mt-1 text-xs text-amber-600">{warning}</p>}
    </label>
  );
}

interface SliderFieldProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hint?: string;
  onChange: (v: number) => void;
}

function SliderField({ label, unit, value, min, max, step, hint, onChange }: SliderFieldProps) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500 tabular-nums">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        className="w-full accent-brand-600"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}

function formatForInput(v: number): string {
  if (!Number.isFinite(v)) return '';
  return String(v);
}
