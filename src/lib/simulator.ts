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
    projectedReturnPct,
    monthlyContribution,
    currentFxRate,
    projectedFxRate,
    foreignAllocationPct,
    horizonYears,
    yearOfSale,
  } = inputs;

  const r = projectedReturnPct / 100;
  const foreignFrac = clamp(foreignAllocationPct, 0, 100) / 100;
  const initialCostBasis =
    currentReturnPct > -100
      ? currentPortfolioValue / (1 + currentReturnPct / 100)
      : currentPortfolioValue;

  let portfolioValue = currentPortfolioValue;
  let costBasis = initialCostBasis;
  let lifetimeQuotaUsed = Math.min(initialCostBasis, LIFETIME_NISA_LIMIT);
  let cashOutsideNisa = 0;
  // Treat existing holdings' cost basis as already contributed; new monthly money is added below.
  let totalContributed = initialCostBasis;
  let peakLifetimeUsage = lifetimeQuotaUsed;
  let restoreNextYear = 0;

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
    // 簿価復活 from any sale in the previous year.
    if (restoreNextYear > 0) {
      lifetimeQuotaUsed = Math.max(0, lifetimeQuotaUsed - restoreNextYear);
      restoreNextYear = 0;
    }

    let annualQuotaUsed = 0;
    let contributedThisYear = 0;

    if (kind === 'sellReinvest' && y === yearOfSale && portfolioValue > 0) {
      cashOutsideNisa += portfolioValue;
      restoreNextYear = costBasis;
      portfolioValue = 0;
      costBasis = 0;
    }

    const remainingThisYear = () =>
      Math.max(
        0,
        Math.min(ANNUAL_NISA_LIMIT - annualQuotaUsed, LIFETIME_NISA_LIMIT - lifetimeQuotaUsed),
      );

    if (cashOutsideNisa > 0) {
      const deposit = Math.min(cashOutsideNisa, remainingThisYear());
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
      const deposit = Math.min(monthlyDesired, remainingThisYear());
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

    const fxStart =
      currentFxRate + (projectedFxRate - currentFxRate) * ((y - 1) / horizonYears);
    const fxEnd = currentFxRate + (projectedFxRate - currentFxRate) * (y / horizonYears);
    const fxDrift = fxStart > 0 ? fxEnd / fxStart - 1 : 0;

    const foreignPart = portfolioValue * foreignFrac;
    const domesticPart = portfolioValue - foreignPart;
    const foreignGrown = foreignPart * (1 + r) * (1 + fxDrift);
    const domesticGrown = domesticPart * (1 + r);
    portfolioValue = foreignGrown + domesticGrown;

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
  const finalPortfolioValue = last.portfolioValue;
  const finalTotalValue = last.portfolioValue + last.cashOutsideNisa;
  const totalGain = finalTotalValue - totalContributed;

  return {
    yearly,
    finalPortfolioValue,
    finalTotalValue,
    totalContributed,
    totalGain,
    peakLifetimeUsage,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
