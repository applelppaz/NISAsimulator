import {
  ANNUAL_NISA_LIMIT,
  LIFETIME_NISA_LIMIT,
  ScenarioKind,
  ScenarioResult,
  SimulationInputs,
  YearlyResult,
} from '../types';

export function simulate(inputs: SimulationInputs, kind: ScenarioKind): ScenarioResult {
  const {
    currentPortfolioValue,
    currentReturnPct,
    monthlyContribution,
    currentFxRate,
    horizonYears,
    returnSeries,
    foreignSeries,
    fxSeries,
    sellSeries,
  } = inputs;

  const initialCostBasis =
    currentReturnPct > -100
      ? currentPortfolioValue / (1 + currentReturnPct / 100)
      : currentPortfolioValue;

  let portfolioValue = currentPortfolioValue;
  let costBasis = initialCostBasis;
  let lifetimeQuotaUsed = Math.min(initialCostBasis, LIFETIME_NISA_LIMIT);
  let cashOutsideNisa = 0;
  let totalContributed = initialCostBasis;
  let peakLifetimeUsage = lifetimeQuotaUsed;
  let restoreNextYear = 0;
  let previousFx = currentFxRate;

  const yearly: YearlyResult[] = [];
  yearly.push({
    year: 0,
    portfolioValue,
    costBasis,
    cashOutsideNisa,
    contributedThisYear: 0,
    totalContributed,
    lifetimeQuotaUsed,
    annualQuotaUsed: 0,
    fxRate: currentFxRate,
  });

  for (let y = 1; y <= horizonYears; y++) {
    const idx = y - 1;
    const r = (returnSeries[idx] ?? 0) / 100;
    const foreignFrac = clamp((foreignSeries[idx] ?? 0) / 100, 0, 1);
    const fxEnd = fxSeries[idx] ?? previousFx;
    const sellFrac = kind === 'sellReinvest' ? clamp((sellSeries[idx] ?? 0) / 100, 0, 1) : 0;

    if (restoreNextYear > 0) {
      lifetimeQuotaUsed = Math.max(0, lifetimeQuotaUsed - restoreNextYear);
      restoreNextYear = 0;
    }

    let annualQuotaUsed = 0;
    let contributedThisYear = 0;

    if (sellFrac > 0 && portfolioValue > 0) {
      const soldValue = portfolioValue * sellFrac;
      const soldBasis = costBasis * sellFrac;
      cashOutsideNisa += soldValue;
      restoreNextYear += soldBasis;
      portfolioValue -= soldValue;
      costBasis -= soldBasis;
    }

    const remaining = () =>
      Math.max(
        0,
        Math.min(ANNUAL_NISA_LIMIT - annualQuotaUsed, LIFETIME_NISA_LIMIT - lifetimeQuotaUsed),
      );

    if (cashOutsideNisa > 0) {
      const deposit = Math.min(cashOutsideNisa, remaining());
      if (deposit > 0) {
        cashOutsideNisa -= deposit;
        portfolioValue += deposit;
        costBasis += deposit;
        lifetimeQuotaUsed += deposit;
        annualQuotaUsed += deposit;
      }
    }

    const monthlyDesired = Math.max(0, monthlyContribution) * 12;
    if (monthlyDesired > 0) {
      const deposit = Math.min(monthlyDesired, remaining());
      if (deposit > 0) {
        portfolioValue += deposit;
        costBasis += deposit;
        lifetimeQuotaUsed += deposit;
        annualQuotaUsed += deposit;
        totalContributed += deposit;
        contributedThisYear = deposit;
      }
    }

    peakLifetimeUsage = Math.max(peakLifetimeUsage, lifetimeQuotaUsed);

    const fxDrift = previousFx > 0 ? fxEnd / previousFx - 1 : 0;
    const foreignPart = portfolioValue * foreignFrac;
    const domesticPart = portfolioValue - foreignPart;
    portfolioValue =
      foreignPart * (1 + r) * (1 + fxDrift) + domesticPart * (1 + r);

    previousFx = fxEnd;

    yearly.push({
      year: y,
      portfolioValue,
      costBasis,
      cashOutsideNisa,
      contributedThisYear,
      totalContributed,
      lifetimeQuotaUsed,
      annualQuotaUsed,
      fxRate: fxEnd,
    });
  }

  const last = yearly[yearly.length - 1];
  return {
    yearly,
    finalPortfolioValue: last.portfolioValue,
    finalTotalValue: last.portfolioValue + last.cashOutsideNisa,
    totalContributed,
    totalGain: last.portfolioValue + last.cashOutsideNisa - totalContributed,
    peakLifetimeUsage,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
