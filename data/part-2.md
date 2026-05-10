# Data Center Strategy Game: End-to-End Improvement Plan

## Current Game Diagnosis

The current app appears to be a **Next.js data-center strategy game** with the following visible structure:

```text
app/
  layout.tsx
  page.tsx
  globals.css

model-notes.md
```

The current interface already has a strong command-center visual direction, including:

- topbar
- status cards
- map board
- location panel
- parcel grid
- build palette
- year control
- analytics
- leaderboard

The current gameplay loop appears to be closer to:

```text
Pick region → pick build type → click parcel → advance year → view metrics
```

That creates basic interactivity, but the strategic choices are still somewhat hidden. The player has to infer what matters from the map, parcel tiles, support numbers, and demand readout.

The improved game should become a more guided turn-based strategy game:

```text
Review annual crisis
→ choose 3–5 action cards within budget
→ lock annual plan
→ resolve construction, politics, power, cooling, water, and events
→ read year-end report
→ continue to next year
```

The goal is to make the game easier to understand while making the simulation deeper.

---

# 1. Target Product Vision

The game should become a fully playable turn-based strategy game about building data centers from **2022 to 2030** while maintaining:

- compute capacity
- power supply
- cooling capacity
- water resilience
- public support
- political support
- permitting momentum
- emissions legitimacy

The player should not need to make dozens of tiny placement decisions every turn. Instead, each year should present a small set of clear, meaningful choices.

A good annual decision should feel like:

```text
Do I build more compute?
Do I build power first?
Do I reduce water risk?
Do I repair public support?
Do I fast-track permitting?
Do I diversify into a less risky region?
```

---

# 2. Recommended File Structure

Refactor the app into smaller modules so the game is easier to develop and maintain.

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css

  components/
    game/
      GameShell.tsx
      Topbar.tsx
      StatusStrip.tsx
      MetricCard.tsx
      DemandPanel.tsx
      RegionMap.tsx
      RegionPanel.tsx
      ActionCardGrid.tsx
      ActionCard.tsx
      AnnualPlanTray.tsx
      BuildQueue.tsx
      AdvisorPanel.tsx
      TurnReportModal.tsx
      AnalyticsScreen.tsx
      LeaderboardPanel.tsx

  lib/
    game-data.ts
    game-engine.ts
    game-actions.ts
    game-events.ts
    game-scoring.ts
    game-storage.ts
    us-locations.ts
    formatters.ts
```

`page.tsx` should become a very small entry point:

```tsx
"use client";

import { GameShell } from "@/components/game/GameShell";

export default function Home() {
  return <GameShell />;
}
```

This keeps the app easy to reason about and makes future Cursor edits safer.

---

# 3. Preserve the Existing Visual Direction

Do not throw away the current CSS.

The current `globals.css` already supports a strong visual identity:

- dark command-room background
- mint/cyan/amber/red status language
- grid-based dashboard layout
- map panel
- parcel board
- analytics screen
- leaderboard styling

Extend the existing style system instead of replacing it.

Add classes like:

```css
.action-card-grid
.action-card
.action-card.selected
.action-card.recommended
.action-card.disabled
.annual-plan-tray
.plan-chip
.turn-report
.turn-report-grid
.headline-list
.advisor-panel
.support-breakdown
.budget-meter
.phase-banner
.event-feed
```

The new UI should continue using the same color vocabulary:

```text
Mint: success / stability
Cyan: information / infrastructure
Amber: warning / opportunity
Red: risk / failure
Dark panels: command-center base
```

---

# 4. New Core Game Loop

## Current Loop

```text
Build on parcels → advance year
```

## New Loop

```text
Planning Phase:
  - Show current year.
  - Show annual budget.
  - Show demand pressure.
  - Show main bottleneck.
  - Player chooses action cards.
  - Some cards require a region.
  - Some cards require a parcel.
  - Some cards are national policy actions.

Resolution Phase:
  - Complete projects whose ready year has arrived.
  - Add new projects to the build queue.
  - Apply compute, power, cooling, water, emissions, and support effects.
  - Trigger conditional events.
  - Produce a clear year-end report.

Next Year:
  - Budget refreshes.
  - Demand rises.
  - New cards unlock.
  - The player plans again.
```

The player should always know:

```text
What year is it?
What is the main bottleneck?
How much budget remains?
What have I selected?
What happens if I run the year now?
```

---

# 5. Add Explicit Game Phases

Create a phase-based game state.

```ts
export type GamePhase = "planning" | "report" | "finished";

export type GameMode = "tutorial" | "standard" | "expert";

export type GameOutcome = "active" | "won" | "lost";

export type GameState = {
  year: number;
  mode: GameMode;
  phase: GamePhase;
  outcome: GameOutcome;

  budget: {
    annualLimit: number;
    remaining: number;
    spent: number;
  };

  support: {
    people: number;
    political: number;
    labor: number;
    regulator: number;
    business: number;
    environmental: number;
  };

  capacity: {
    computeH100e: number;
    powerMW: number;
    coolingMW: number;
    waterMLDay: number;
  };

  selectedLocationId: string | null;
  selectedActionIds: string[];

  actionPlan: PlannedAction[];
  projects: Project[];
  tiles: Tile[];

  latestReport?: TurnReport;
  history: TurnHistoryRecord[];
};
```

This lets the UI show a clear state:

```text
Planning 2026
Budget remaining: 11 / 17
Selected actions: 3
Main warning: power shortfall
```

---

# 6. Replace Build Orders with Action Cards

The current build palette should become an annual action-card system.

Instead of only choosing build types, the player should choose from cards like:

```text
Build Hyperscale Campus
Expand Existing Campus
Lease Colocation Capacity
Build Fast Gas Capacity
Sign Renewables PPA
Build Grid Interconnect
Add Water Recycling
Add Dry Cooling
Community Benefits Package
Fast-Track Permitting
```

## Action Card Type

```ts
export type ActionCard = {
  id: string;
  title: string;
  shortTitle: string;

  category:
    | "compute"
    | "power"
    | "cooling"
    | "water"
    | "politics"
    | "permitting"
    | "efficiency";

  cost: number;
  availableYear: number;
  durationYears: number;

  requiresRegion: boolean;
  requiresParcel: boolean;

  effects: {
    computeH100e?: number;
    powerMW?: number;
    coolingMW?: number;
    waterMLDay?: number;
    peopleSupport?: number;
    politicalSupport?: number;
    laborSupport?: number;
    regulatorSupport?: number;
    businessSupport?: number;
    environmentalSupport?: number;
    emissionsIndex?: number;
    gridStress?: number;
    waterStress?: number;
  };

  riskText: string;
  benefitText: string;
  flavorText: string;
};
```

## Example Cards

```ts
export const actionCards: ActionCard[] = [
  {
    id: "hyperscale-campus",
    title: "Build Hyperscale Campus",
    shortTitle: "Hyperscale",
    category: "compute",
    cost: 5,
    availableYear: 2022,
    durationYears: 2,
    requiresRegion: true,
    requiresParcel: true,
    effects: {
      computeH100e: 650_000,
      coolingMW: -120,
      waterMLDay: -18,
      peopleSupport: -3,
    },
    benefitText: "+650K H100e after construction",
    riskText: "Raises local water and grid scrutiny",
    flavorText:
      "A major compute campus that needs power, cooling, and political cover.",
  },
  {
    id: "fast-gas-capacity",
    title: "Build Fast Gas Capacity",
    shortTitle: "Gas Power",
    category: "power",
    cost: 4,
    availableYear: 2022,
    durationYears: 1,
    requiresRegion: true,
    requiresParcel: false,
    effects: {
      powerMW: 900,
      politicalSupport: 2,
      peopleSupport: -4,
      emissionsIndex: 10,
    },
    benefitText: "+900 MW next year",
    riskText: "Higher emissions and local opposition",
    flavorText: "Fast reliability, expensive legitimacy.",
  },
  {
    id: "community-benefits",
    title: "Community Benefits Package",
    shortTitle: "Benefits",
    category: "politics",
    cost: 2,
    availableYear: 2022,
    durationYears: 0,
    requiresRegion: true,
    requiresParcel: false,
    effects: {
      peopleSupport: 8,
      laborSupport: 4,
      politicalSupport: 2,
    },
    benefitText: "+8 people support",
    riskText: "Consumes budget without adding capacity",
    flavorText:
      "Jobs, local grants, tax-sharing, and public-facing concessions.",
  },
];
```

---

# 7. Add Annual Budget Caps

Each year should give the player a fixed budget.

```ts
export const annualBudgetByYear: Record<number, number> = {
  2022: 8,
  2023: 9,
  2024: 11,
  2025: 14,
  2026: 17,
  2027: 20,
  2028: 22,
  2029: 22,
  2030: 24,
};
```

## Budget Selection Rule

```ts
export function canSelectAction(state: GameState, card: ActionCard) {
  return (
    state.phase === "planning" &&
    state.year >= card.availableYear &&
    state.budget.remaining >= card.cost
  );
}
```

## Selecting a Card

```ts
export function selectAction(
  state: GameState,
  card: ActionCard,
  locationId?: string,
  parcelId?: string,
): GameState {
  if (!canSelectAction(state, card)) {
    return state;
  }

  return {
    ...state,
    budget: {
      ...state.budget,
      remaining: state.budget.remaining - card.cost,
      spent: state.budget.spent + card.cost,
    },
    actionPlan: [
      ...state.actionPlan,
      {
        id: crypto.randomUUID(),
        cardId: card.id,
        locationId,
        parcelId,
        selectedYear: state.year,
        readyYear: state.year + card.durationYears,
      },
    ],
  };
}
```

This makes the spending limit obvious and turns the game into a clear planning challenge.

---

# 8. Use the Model Notes as the Campaign Spine

Use the 2022–2030 demand curve as the campaign pressure.

```ts
export const demandCurve = [
  { year: 2022, h100e: 3_941, powerMW: 57 },
  { year: 2023, h100e: 118_742, powerMW: 340 },
  { year: 2024, h100e: 585_947, powerMW: 1_611 },
  { year: 2025, h100e: 3_765_163, powerMW: 5_904 },
  { year: 2026, h100e: 11_897_305, powerMW: 15_002 },
  { year: 2027, h100e: 24_160_918, powerMW: 22_674 },
  { year: 2028, h100e: 48_290_532, powerMW: 35_510 },
  { year: 2029, h100e: 49_026_133, powerMW: 35_919 },
  { year: 2030, h100e: 48_250_842, powerMW: 36_213 },
];
```

## Derived Targets

```ts
export function getDemand(year: number) {
  const base = demandCurve.find((row) => row.year === year) ?? demandCurve[0];

  return {
    year,
    h100e: base.h100e,
    powerMW: base.powerMW,
    coolingMW: Math.round(base.powerMW * 0.3),
    waterMLDay: Math.round(base.powerMW * 0.08),
  };
}
```

The model should communicate that:

```text
H100e = frontier compute pressure
Power MW = available power versus frontier demand
Cooling target = 30% of power target
Water target = abstract ML/day pressure
People support and political support are independent fail states
```

---

# 9. Make Political Support a Real System

The current game should expand from simple public/policy values into a visible coalition model.

```ts
support: {
  people: number;
  political: number;
  labor: number;
  regulator: number;
  business: number;
  environmental: number;
}
```

## Visible Support Scores

```ts
export function calculatePeopleSupport(support: GameState["support"]) {
  return Math.round(
    support.people * 0.5 +
      support.labor * 0.2 +
      support.environmental * 0.2 +
      support.regulator * 0.1,
  );
}

export function calculatePoliticalSupport(support: GameState["support"]) {
  return Math.round(
    support.political * 0.4 +
      support.business * 0.25 +
      support.regulator * 0.2 +
      support.labor * 0.15,
  );
}
```

## Fail States

```ts
if (peopleSupport <= 0) {
  return lose("Public opposition stopped expansion.");
}

if (politicalSupport <= 0) {
  return lose("The political coalition collapsed.");
}
```

This makes political support central to the game instead of decorative.

---

# 10. Add a Turn Report After Every Year

After the player clicks **Run Annual Plan**, do not silently advance the numbers.

Show a clear report modal.

## Example Report

```text
2026 YEAR-END REPORT

Capacity:
- Compute coverage: 72% → 84%
- Power coverage: 61% → 76%
- Cooling coverage: 80% → 74%

Politics:
- People support: -5
- Political support: +2
- Environmental bloc: -8

Headlines:
- Northern Virginia grid operator warns of interconnection delays.
- Governor praises new AI construction jobs.
- Water coalition challenges Phoenix expansion permit.

Advisor:
- You are power-constrained.
- Build power or efficiency before adding another hyperscale campus.
```

## Turn Report Type

```ts
export type TurnReport = {
  year: number;
  summary: string;

  headlines: string[];
  completedProjects: string[];

  metricDeltas: {
    computeCoverage: number;
    powerCoverage: number;
    coolingCoverage: number;
    waterCoverage: number;
    peopleSupport: number;
    politicalSupport: number;
  };

  warnings: string[];
  advisorTips: string[];
};
```

This is one of the most important UX improvements because it explains why the player is winning or losing.

---

# 11. Add Conditional Events

Create:

```text
src/lib/game-events.ts
```

## Event Type

```ts
export type GameEvent = {
  id: string;
  title: string;
  condition: (state: GameState, supply: SupplySummary) => boolean;
  effects: Partial<GameState["support"]> & {
    emissionsIndex?: number;
    gridStress?: number;
    waterStress?: number;
  };
  headline: string;
};
```

## Example Events

```ts
export const gameEvents: GameEvent[] = [
  {
    id: "grid-warning",
    title: "Grid Capacity Warning",
    condition: (_state, supply) => supply.powerCoverage < 0.75,
    effects: {
      political: -5,
      regulator: -4,
    },
    headline:
      "Regional grid operator warns that AI load growth is outrunning new supply.",
  },
  {
    id: "water-protest",
    title: "Water Protest",
    condition: (_state, supply) => supply.waterCoverage < 0.8,
    effects: {
      people: -7,
      environmental: -6,
    },
    headline:
      "Local coalition challenges the water footprint of new data-center construction.",
  },
  {
    id: "jobs-ribbon-cutting",
    title: "Jobs Ribbon-Cutting",
    condition: (_state, supply) => supply.computeCoverage >= 0.9,
    effects: {
      political: 4,
      business: 5,
      labor: 2,
    },
    headline:
      "State officials celebrate construction jobs and new AI infrastructure investment.",
  },
];
```

Events should not be purely random. They should mostly fire because the player made certain tradeoffs.

---

# 12. Keep the Map, But Demote Parcels from the Main Decision

The existing map and parcel system are useful, but parcel clicking should not be the main game.

Recommended UX:

```text
Primary decision:
  Action cards

Secondary decision:
  Region choice

Optional detail:
  Parcel choice for data-center builds
```

Example flow:

```text
1. Player selects Build Hyperscale Campus.
2. UI asks for a region.
3. Game auto-selects a recommended parcel.
4. Player can override the parcel if desired.
5. Action is added to the annual plan.
```

This keeps the current parcel board valuable without making it the whole game.

---

# 13. Recommended Screen Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Topbar: title, model notes, sources, new game, continue      │
├─────────────────────────────────────────────────────────────┤
│ Status Strip: Year | Budget | Compute | Power | Cooling     │
│               Water | People | Political | Emissions         │
├───────────────────────────────┬─────────────────────────────┤
│ Map + Region Panel             │ Annual Briefing / Advisor   │
├───────────────────────────────┴─────────────────────────────┤
│ Action Card Grid                                             │
├───────────────────────────────┬─────────────────────────────┤
│ Annual Plan Tray              │ Build Queue / News           │
└───────────────────────────────┴─────────────────────────────┘
```

The most important information should always be visible:

```text
Year
Budget
Demand pressure
Main bottleneck
Selected actions
Support risk
Run Annual Plan button
```

---

# 14. Cursor Implementation Sequence

## Pass 1: Source Discovery

Run:

```bash
find . -maxdepth 4 -type f | sort
cat package.json
```

Confirm whether these files exist:

```text
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/lib/game-data.ts
src/lib/game-engine.ts
src/lib/us-locations.ts
```

The current `page.tsx` appears to depend on library files such as:

```text
@/lib/game-data
@/lib/game-engine
@/lib/us-locations
```

Cursor should inspect those files before making major edits.

---

## Pass 2: Make the App Easier to Run

Add or confirm these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

Add a simple `README.md`:

```md
# Data Center Strategy Game

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Reset Local Game State

Use the in-game reset button, or clear local storage.

## Gameplay Summary

Build data-center capacity from 2022 to 2030 while maintaining power, cooling, water resilience, public support, and political support.
```

---

## Pass 3: Refactor Without Changing Behavior

Before adding new mechanics, split `page.tsx` into components.

Move:

```text
MetricCard → components/game/MetricCard.tsx
LocationMarker → components/game/LocationMarker.tsx
LocationPanel → components/game/LocationPanel.tsx
BuildPalette → components/game/BuildPalette.tsx
ParcelTile → components/game/ParcelTile.tsx
AnalyticsScreen → components/game/AnalyticsScreen.tsx
LeaderboardPanel → components/game/LeaderboardPanel.tsx
```

After this pass, the game should look and behave exactly the same.

This is the safety checkpoint.

---

## Pass 4: Add Action Cards

Create:

```text
src/lib/game-actions.ts
src/components/game/ActionCardGrid.tsx
src/components/game/ActionCard.tsx
src/components/game/AnnualPlanTray.tsx
```

Start with these 10 cards:

```text
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
```

Each card should display:

```text
Cost
Duration
Benefit
Risk
Whether it requires a region
Whether it requires a parcel
```

---

## Pass 5: Add the Resolution Report

Create:

```text
src/components/game/TurnReportModal.tsx
src/lib/game-events.ts
```

Update the year-advance function so it returns a report instead of silently mutating the game.

Rename the button:

```text
Advance Year
```

to:

```text
Run Annual Plan
```

After clicking, show the report modal.

---

## Pass 6: Add Save and Load

Create:

```text
src/lib/game-storage.ts
```

```ts
export function saveGame(state: GameState) {
  localStorage.setItem("data-center-game-save", JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem("data-center-game-save");
  return raw ? JSON.parse(raw) : null;
}

export function clearSave() {
  localStorage.removeItem("data-center-game-save");
}
```

Add UI buttons:

```text
New Run
Continue Run
Reset Save
Export Save
Import Save
```

---

## Pass 7: Add Tutorial Mode

Tutorial mode should guide the first three years.

```text
2022: Build compute.
2023: Solve the power bottleneck.
2024: Recover people and political support.
```

The tutorial should:

- highlight recommended cards
- explain tradeoffs in plain language
- prevent catastrophic first-turn mistakes
- teach the budget system
- teach the support system
- teach the annual report

---

# 15. Cursor Prompt

Paste this into Cursor after opening the full repo:

```text
Inspect the existing Next.js project before editing. The current game is a data-center strategy game with app/page.tsx, app/layout.tsx, app/globals.css, and lib files for game data, game engine, and U.S. locations.

Goal:
Turn the current parcel-placement interface into a fully playable turn-based strategy game about building data centers from 2022 to 2030 while maintaining public and political support.

Preserve:
- Existing visual theme in globals.css.
- Existing map and regional siting layer.
- Existing model-notes link and source links.
- Existing leaderboard if possible.

Refactor:
- Split app/page.tsx into smaller components under components/game.
- Keep app/page.tsx as a thin GameShell entry point.
- Keep the current game working after the first refactor before adding mechanics.

Add:
- Annual planning phase.
- Action-card decision system.
- Annual budget with remaining/spent display.
- Action plan tray.
- Turn report modal.
- Conditional yearly events.
- Advisor tips.
- Local save/load.
- Tutorial mode.

Core simulation:
- Annual turns from 2022 to 2030.
- Demand curve:
  2022: 3,941 H100e, 57 MW
  2023: 118,742 H100e, 340 MW
  2024: 585,947 H100e, 1,611 MW
  2025: 3,765,163 H100e, 5,904 MW
  2026: 11,897,305 H100e, 15,002 MW
  2027: 24,160,918 H100e, 22,674 MW
  2028: 48,290,532 H100e, 35,510 MW
  2029: 49,026,133 H100e, 35,919 MW
  2030: 48,250,842 H100e, 36,213 MW

- Cooling target is 30% of power target.
- Water target is an abstract ML/day pressure derived from power and cooling intensity.
- People support and political support are independent fail states.

Gameplay:
- Each year gives the player a fixed budget.
- Player selects 3–5 action cards depending on budget.
- Cards can build compute, power, cooling, water resilience, political support, permitting speed, or efficiency.
- Some cards require a region.
- Some compute cards require a parcel.
- End turn resolves construction, demand growth, public reaction, political reaction, emissions, water stress, and events.
- Show a clear year-end report.

UX:
- Make decisions easier than the current interface.
- Show the main bottleneck every year.
- Mark recommended cards.
- Disable unaffordable cards.
- Explain risks and benefits on every card.
- Add keyboard-accessible buttons and color-independent labels.

Do not rewrite the entire visual design. Extend the current CSS classes and add new classes only where needed.
```

---

# 16. Acceptance Criteria

The new version is successful when:

1. A new player can start, make decisions, and finish a campaign without reading external instructions.
2. A full campaign takes about 10–15 minutes.
3. Every year has a clear budget limit.
4. The player makes a small number of meaningful choices, not dozens of low-level clicks.
5. Ignoring compute demand can lose the game.
6. Ignoring power can lose the game.
7. Ignoring cooling can lose the game.
8. Ignoring water stress can lose the game.
9. Ignoring people support can lose the game.
10. Ignoring political support can lose the game.
11. The turn report explains why support rose or fell.
12. The game can be run locally with one documented command.
13. The UI remains visually consistent with the existing command-center theme.
14. The map and parcel system remain available but are no longer the only meaningful interaction.
15. The game has a tutorial mode for first-time players.

---

# 17. Immediate Next Engineering Move

The next move should be:

```text
Refactor page.tsx into smaller components without changing behavior.
```

Then add:

```text
Action-card planning layer
Annual budget
Turn report modal
Conditional events
Save/load
Tutorial mode
```

This creates a safe path from the current prototype to a fully playable strategy game.