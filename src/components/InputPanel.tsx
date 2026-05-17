import { ANNUAL_NISA_LIMIT, LIFETIME_NISA_LIMIT, SimulationInputs } from '../types';

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
          step={10_000}
          min={0}
          onChange={(v) => set('currentPortfolioValue', v)}
        />
        <NumberField
          label="Current unrealized return"
          unit="%"
          value={inputs.currentReturnPct}
          step={0.5}
          min={-99}
          onChange={(v) => set('currentReturnPct', v)}
          hint="Used to back out your cost basis (簿価)."
        />
      </Section>

      <Section title="Future assumptions">
        <NumberField
          label="Projected annual return"
          unit="% / yr"
          value={inputs.projectedReturnPct}
          step={0.25}
          onChange={(v) => set('projectedReturnPct', v)}
          hint="Underlying market return in local currency; FX applied separately."
        />
        <NumberField
          label="Monthly contribution"
          unit="JPY"
          value={inputs.monthlyContribution}
          step={1_000}
          min={0}
          onChange={(v) => set('monthlyContribution', v)}
          hint={`Annual cap is ¥${ANNUAL_NISA_LIMIT.toLocaleString()} (¥${monthlyCap.toLocaleString()} / month).`}
          warning={
            monthlyOverCap
              ? `Above the ¥${monthlyCap.toLocaleString()} monthly equivalent — extra will be ignored.`
              : undefined
          }
        />
      </Section>

      <Section title="FX exposure">
        <NumberField
          label="Current USD/JPY rate"
          unit="JPY"
          value={inputs.currentFxRate}
          step={0.1}
          min={0}
          onChange={(v) => set('currentFxRate', v)}
        />
        <NumberField
          label="Projected USD/JPY at end of horizon"
          unit="JPY"
          value={inputs.projectedFxRate}
          step={0.1}
          min={0}
          onChange={(v) => set('projectedFxRate', v)}
          hint="Linear drift from current rate over the horizon."
        />
        <SliderField
          label="Foreign-asset allocation"
          unit="%"
          value={inputs.foreignAllocationPct}
          min={0}
          max={100}
          step={1}
          onChange={(v) => set('foreignAllocationPct', v)}
          hint={`${inputs.foreignAllocationPct}% FX-exposed (e.g. オールカントリー / S&P500) • ${
            100 - inputs.foreignAllocationPct
          }% domestic JPY.`}
        />
      </Section>

      <Section title="Time horizon & sell scenario">
        <SliderField
          label="Investment horizon"
          unit="years"
          value={inputs.horizonYears}
          min={1}
          max={50}
          step={1}
          onChange={(v) => {
            const next = { ...inputs, horizonYears: v };
            if (inputs.yearOfSale > v) next.yearOfSale = v;
            onChange(next);
          }}
        />
        <SliderField
          label="Year of sale (Scenario B)"
          unit={inputs.yearOfSale === 0 ? 'never' : `year ${inputs.yearOfSale}`}
          value={inputs.yearOfSale}
          min={0}
          max={inputs.horizonYears}
          step={1}
          onChange={(v) => set('yearOfSale', v)}
          hint="0 = never sell. After selling, the cost basis (簿価) restores the following year, and reinvestment is capped at ¥3.6M/yr."
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
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
  warning?: string;
  onChange: (v: number) => void;
}

function NumberField({
  label,
  unit,
  value,
  step,
  min,
  max,
  hint,
  warning,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <input
        type="number"
        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm tabular-nums"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
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
