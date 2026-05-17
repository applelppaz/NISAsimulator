export type Currency = 'JPY' | 'USD';

export function formatCurrency(amountJpy: number, currency: Currency, fxRate: number): string {
  const value = currency === 'JPY' ? amountJpy : amountJpy / Math.max(fxRate, 0.0001);
  const symbol = currency === 'JPY' ? '¥' : '$';
  const fractionDigits = currency === 'JPY' ? 0 : 0;
  const formatted = Math.round(value).toLocaleString('en-US', {
    maximumFractionDigits: fractionDigits,
  });
  return `${symbol}${formatted}`;
}

export function formatCompactCurrency(
  amountJpy: number,
  currency: Currency,
  fxRate: number,
): string {
  const value = currency === 'JPY' ? amountJpy : amountJpy / Math.max(fxRate, 0.0001);
  const symbol = currency === 'JPY' ? '¥' : '$';
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol}${formatted}`;
}

export function formatPercent(pct: number, digits = 1): string {
  return `${pct.toFixed(digits)}%`;
}

export function parseNumber(input: string): number {
  const cleaned = input.replace(/[,  ¥$]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
