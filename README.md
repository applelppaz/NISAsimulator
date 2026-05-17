# NISA Profit Simulator

A web app for projecting future returns inside Japan's new NISA (tax-free investment account, launched 2024). Compares two scenarios side-by-side:

- **Scenario A · Hold & Continue** — keep buying every month, never sell.
- **Scenario B · Sell & Reinvest** — sell at a chosen year, then redeposit the proceeds back into NISA respecting the cost-basis-restoration rule (簿価復活, ¥3.6M/year cap).

All UI is in English. Built as a static React SPA — no backend.

## Inputs

| Input | Notes |
| --- | --- |
| Current portfolio value (JPY) | Market value of holdings already in NISA. |
| Current unrealized return (%) | Used to back out your cost basis (簿価). |
| Projected annual return (%) | Underlying market return in local currency. |
| Monthly contribution (JPY) | Clamped to the ¥3.6M annual cap. |
| Current USD/JPY rate | Used for FX drift and USD display. |
| Projected USD/JPY at end of horizon | Linear drift each year. |
| Foreign-asset allocation (%) | Portion of portfolio exposed to FX (e.g. オールカントリー). The rest is treated as domestic JPY. |
| Horizon (years) | 1–50. |
| Year of sale | 0 = never. Only affects Scenario B. |

## NISA rules modeled

- Annual contribution cap: ¥3,600,000 (Tsumitate ¥1.2M + Growth ¥2.4M).
- Lifetime cost-basis cap: ¥18,000,000.
- Gains and dividends inside NISA are tax-free.
- On sale, the cost basis is restored to the lifetime quota the following year; reinvestment is still capped at ¥3.6M/year.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle in dist/
```

Inputs persist in `localStorage` so they survive a refresh.

## Disclaimer

Estimates only. Not investment advice. Actual returns and FX rates will differ from any projection.
