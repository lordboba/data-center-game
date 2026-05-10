# Data Center Game: Part 2 Playable Strategy Layer

## Current Project Surface

This repo is a Vite + React + React Router application, not a Next.js app.
The active gameplay surface is:

```text
src/App.tsx
src/data/gameData.ts
src/lib/gameEngine.ts
src/components/UnitedStatesMap.tsx
src/styles.css
```

The game already has:

- a home route, play route, and leaderboard route
- a U.S. siting map with real candidate markets
- market selection and build scoring
- generated infrastructure SVG assets
- local leaderboard storage
- Vite scripts for `npm run dev`, `npm run build`, `npm run lint`, and `npm run test`

Part 2 should enhance that real surface instead of introducing `app/`, `page.tsx`, or Next.js-specific files.

## Product Goal

Turn the current market-picking prototype into a clearer annual strategy game.
The player should guide a data-center expansion campaign from 2022 to 2030 while balancing:

- compute demand
- power supply
- cooling capacity
- water resilience
- people support
- political support
- emissions legitimacy

The new loop is:

```text
Read annual briefing
Choose action cards within budget
Use the map to choose the region/market for location-based actions
Run annual plan
Read the year-end report
Continue until 2030 or a fail state
```

## Implementation Scope For This Repo

Keep the implementation close to the current architecture:

- Extend `src/data/gameData.ts` with annual budgets, demand curve, and action cards.
- Replace the old timed build loop in `src/lib/gameEngine.ts` with phase-based annual planning helpers.
- Update `src/App.tsx` play route to show annual status, action cards, action plan tray, build queue, advisor copy, map context, and turn reports.
- Extend `src/styles.css` with the new card/report/tray UI while preserving the existing visual system.
- Keep `UnitedStatesMap`, generated assets, and leaderboard behavior working.

Do not add a large component refactor before the gameplay is playable.

## Core Game State

The game state should support:

```ts
type GamePhase = "planning" | "report" | "finished";
type GameOutcome = "active" | "won" | "lost";

type GameState = {
  year: number;
  phase: GamePhase;
  outcome: GameOutcome;
  selectedSiteId: string;
  builtSiteIds: string[];
  selectedActionIds: string[];
  projects: PlannedAction[];
  report: TurnReport | null;
  support: {
    people: number;
    political: number;
    environmental: number;
    labor: number;
    regulator: number;
    business: number;
  };
  infrastructure: {
    computeH100e: number;
    powerMW: number;
    coolingMW: number;
    waterMLDay: number;
  };
  emissionsIndex: number;
  missedPeriods: number;
};
```

## Action Cards

Use a compact action-card system with clear costs, durations, benefits, and risks.

Required starting cards:

1. Build Hyperscale Campus
2. Expand Existing Campus
3. Lease Colocation Capacity
4. Build Fast Gas Capacity
5. Sign Renewables PPA
6. Build Grid Interconnect
7. Add Water Recycling
8. Add Dry Cooling
9. Community Benefits Package
10. Fast-Track Permitting

Each card should show:

- cost
- duration
- category
- benefit text
- risk text
- whether a selected market is used
- whether it is recommended this year

## Annual Budgets

Use this campaign budget curve:

```ts
2022: 8
2023: 9
2024: 11
2025: 14
2026: 17
2027: 20
2028: 22
2029: 22
2030: 24
```

The player can select multiple cards until annual budget is exhausted.

## Demand Curve

Use this 2022-2030 demand curve:

```text
2022: 3,941 H100e, 57 MW
2023: 118,742 H100e, 340 MW
2024: 585,947 H100e, 1,611 MW
2025: 3,765,163 H100e, 5,904 MW
2026: 11,897,305 H100e, 15,002 MW
2027: 24,160,918 H100e, 22,674 MW
2028: 48,290,532 H100e, 35,510 MW
2029: 49,026,133 H100e, 35,919 MW
2030: 48,250,842 H100e, 36,213 MW
```

Derived targets:

- cooling target equals 30% of power target
- water target equals 8% of power target

## Support And Failure

People support and political support must be real fail states.

The game can be lost by ignoring:

- compute coverage
- power coverage
- cooling coverage
- water coverage
- people support
- political support

Support should visibly react to selected actions and triggered events.

## Year-End Report

After the player clicks `Run Annual Plan`, show a report before the next planning year.
The report should include:

- completed projects
- support changes
- coverage changes
- headlines
- warnings
- advisor tips

The report is the main explanation layer for why the player is winning or losing.

## UI Requirements

The play screen should always show:

- year
- annual budget remaining
- compute coverage
- power coverage
- cooling coverage
- water coverage
- people support
- political support
- selected market
- selected annual plan
- run annual plan button

The map remains useful for selecting the market attached to regional actions, but the main decision should be the action-card plan.

## Acceptance Criteria

The Part 2 implementation is successful when:

1. A new player can start a campaign from `/play` without external instructions.
2. Each year has a clear budget and a small set of meaningful card choices.
3. The player can run annual plans and see reports after each year.
4. The campaign can end in a win or a loss.
5. People and political support are visible and can independently fail the run.
6. Power, cooling, water, and compute bottlenecks are visible and influence recommendations.
7. The map and leaderboard still work.
8. `npm run build` succeeds.
