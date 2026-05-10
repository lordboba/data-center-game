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

- `Q1 2022`: three starter markets only: Ashburn, Dallas, and Hillsboro. Show market selection, period budget, compute, outlook, and Build Hyperscale Campus.
- `Q2 2022`: add Lease Colocation Capacity and Chicago.
- `Q3 2022`: add Expand Existing Campus and Phoenix. Expansion requires the selected market to already have a completed hyperscale campus.
- `Q4 2022`: add Atlanta.
- `2023`: infrastructure arrives in waves. Q1 adds power coverage and renewables PPAs. Q2 adds gas and grid interconnects. Q3 adds water recycling. Q4 adds dry cooling. Columbus, Des Moines, and Secaucus unlock through the year.
- `2024`: people support becomes visible, Community Benefits Package unlocks, and Reno, Salt Lake City, and Raleigh become available through the year.
- `2025`: political support and Fast-Track Permitting unlock. Quincy and Omaha finish the pre-full-game site ramp.
- `Jan-Feb 2026`: all current markets and action cards are available, and the game shifts to two-month operating turns.
- `2030`: monthly turns run against the final demand pressure.

Political support is tracked internally before 2025, but it should not be a visible planning surface or independent fail condition until the politics stage.
Power, water, and cooling are also tracked internally before their tutorials arrive, but they only become visible planning surfaces when their period-level feature unlocks.

## Tutorial Behavior

Tutorial steps live in `TUTORIAL_STEPS`. Each step has a target matching a `data-tutorial` anchor in the UI and a `sequenceId` that defines its local counter group. The active tutorial layer draws a boxed highlight around the target and places a small explanation panel near it.

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

The tutorial can be advanced manually with `Next`, `Back`, and `Skip`. The overlay counter is sequence-local, so the starter tutorial displays 1/6 through 6/6 and later feature tutorials reset to their own counts. Each tutorial id is recorded in `completedTutorialIds` when it is completed or dismissed, so feature tips do not repeat every turn. Core tutorials also complete automatically when the player selects a market, buys the first campus, runs a plan, and continues after a report.

Mini tutorials appear at the same period as their feature:

- `Q2 2022`: colocation.
- `Q3 2022`: campus expansion and the built-campus requirement.
- `2023`: power, power-project tradeoffs, water recycling, and dry cooling.
- `2024`: public support and community benefits.
- `2025`: politics and fast-track permitting.
- `Jan-Feb 2026`: faster two-month cadence and queued project timing.
- `Jan 2030`: final monthly pressure.

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
- After power coverage is visible, compute expansion can be blocked when power coverage falls below 25.
- `Expand Existing Campus` requires the selected market to have a completed hyperscale campus.

## Verification Scenarios

- New run starts at `Q1 2022` with only market selection and Build Hyperscale Campus available.
- The tutorial highlights market selection, the first campus card, budget, compute, the run button, and the report.
- Colocation appears in `Q2 2022`; campus expansion appears in `Q3 2022` but is disabled for unbuilt markets.
- 2023 reveals infrastructure in waves without political cards.
- 2025 reveals political support and permitting.
- The market list grows by explicit period and never jumps from three markets to all markets after the first build.
- Built campuses appear as small data-center SVG markers on the map.
- Balanced play improves outlook and makes budget/prices easier.
- Neglected compute, power, water, people support, or political support raises costs and can block expansion.
- The campaign labels advance quarterly, then bimonthly, then monthly.
