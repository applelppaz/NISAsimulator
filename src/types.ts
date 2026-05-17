export interface SimulationInputs {
  currentPortfolioValue: number;
  currentReturnPct: number;
  projectedReturnPct: number;
  monthlyContribution: number;
  currentFxRate: number;
  projectedFxRate: number;
  foreignAllocationPct: number;
  horizonYears: number;
  yearOfSale: number;
}

export interface YearlyResult {
  year: number;
  portfolioValue: number;
  costBasis: number;
  cashOutsideNisa: number;
  contributedThisYear: number;
  totalContributed: number;
  lifetimeQuotaUsed: number;
  annualQuotaUsed: number;
  fxRate: number;
}

export interface ScenarioResult {
  yearly: YearlyResult[];
  finalPortfolioValue: number;
  finalTotalValue: number;
  totalContributed: number;
  totalGain: number;
  peakLifetimeUsage: number;
}

export type ScenarioKind = 'hold' | 'sellReinvest';

export const ANNUAL_NISA_LIMIT = 3_600_000;
export const LIFETIME_NISA_LIMIT = 18_000_000;
