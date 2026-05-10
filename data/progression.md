# Progression and Tutorial Ramp

## Product Goal

The game should teach one layer at a time. The first turn is about choosing a market and buying compute capacity. Later turns introduce budget pressure, infrastructure constraints, public support, political support, and finally faster operating cadence. The pacing is modeled after Pre-Civilization-style onboarding: learn the core resource loop first, then add new pressures after the player has acted on the previous one.

## Campaign Calendar

The canonical turn is `periodIndex`, not `year`.

- 2022-2025: quarterly turns, labeled `Q1 2022` through `Q4 2025`.
- 2026-2029: two-month turns, labeled `Jan-Feb 2026` through `Nov-Dec 2029`.
- 2030: monthly turns, labeled `Jan 2030` through `Dec 2030`.

This produces 52 campaign turns. `year` remains on game state as a derived compatibility field for score and display code, but new gameplay should use `getCurrentPeriod`, `getPeriodLabel`, and `getPeriodDemand`.

## Unlock Ramp

- `siting`: 2022 Q1. Show market selection and Build Hyperscale Campus only.
- `compute`: later 2022. Add compute coverage, period budget, colocation, and campus expansion.
- `infrastructure`: 2023. Reveal power, cooling, water, and the basic infrastructure cards.
- `public`: 2024. Reveal people support and community mitigation.
- `politics`: 2025. Reveal political support and permitting.
- `operations`: 2026-2029. Use two-month turns and all major systems.
- `monthly`: 2030. Use monthly turns against final demand pressure.

Political support is tracked internally before 2025, but it should not be a visible planning surface or independent fail condition until the politics stage.

## Tutorial Behavior

Tutorial steps live in `TUTORIAL_STEPS`. Each step has a target matching a `data-tutorial` anchor in the UI. The active tutorial layer draws a boxed highlight around the target and places a small explanation panel near it.

Required anchors:

- `market-map`
- `action-hyperscale-campus`
- `metric-budget`
- `metric-compute`
- `run-plan`
- `turn-report`
- `metric-power`
- `metric-support`
- `metric-politics`

The tutorial can be advanced manually with `Next`, `Back`, and `Skip`. It also advances when the player completes core actions: selecting a market, buying the first campus, running a plan, and continuing after a report.

## Dynamic Budget and Cost Pressure

Each period has a base budget from the existing annual budget curve plus `budgetBalance`. Management quality changes `outlook`; `outlook` changes next-period `budgetBalance` and dynamic card prices.

Cost pressure rules:

- Related metric at or above 85: reduce card cost.
- Related metric below 60: add a surcharge.
- Related metric below 35: add another surcharge.
- Outlook at or above 78: reduce card cost.
- Outlook below 45: add a surcharge.

Blocking rules:

- After public support is visible, site-required expansion can be blocked when people support falls below 25.
- After political support is visible, site-required expansion can be blocked when political support falls below 25.
- After infrastructure unlocks, compute expansion can be blocked when power coverage falls below 25.

## Verification Scenarios

- New run starts at `Q1 2022` with only market selection and Build Hyperscale Campus available.
- The tutorial highlights market selection, the first campus card, budget, compute, the run button, and the report.
- 2023 reveals power, cooling, and water cards without political cards.
- 2025 reveals political support and permitting.
- Balanced play improves outlook and makes budget/prices easier.
- Neglected compute, power, water, people support, or political support raises costs and can block expansion.
- The campaign labels advance quarterly, then bimonthly, then monthly.
