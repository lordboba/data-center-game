import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_PERIODS,
  DATA_CENTER_SITES,
  MAX_BUILDS,
} from "../data/gameData";
import { RANDOM_EVENTS } from "../data/randomEvents";
import {
  canChangeDifficulty,
  changeDifficulty,
  continueFromReport,
  findAction,
  GameState,
  getActionLockReason,
  getCommittedBuildUnits,
  getDynamicActionCost,
  getInflationMultiplier,
  getRandomEventSeverity,
  initialGameState,
  resolveRandomEventChoice,
  restartRun,
  rollRandomEventForTurn,
} from "./gameEngine";

function stateWith(overrides: Partial<GameState>): GameState {
  return {
    ...initialGameState,
    builtSiteIds: [...initialGameState.builtSiteIds],
    selectedActionIds: [...initialGameState.selectedActionIds],
    completedTutorialIds: [...initialGameState.completedTutorialIds],
    projects: [...initialGameState.projects],
    activeModifiers: [...initialGameState.activeModifiers],
    support: { ...initialGameState.support },
    infrastructure: { ...initialGameState.infrastructure },
    ...overrides,
  };
}

function periodIndexFor(year: number): number {
  const period = CAMPAIGN_PERIODS.find((candidate) => candidate.year === year);
  if (!period) throw new Error(`Missing period for ${year}`);
  return period.index;
}

function testReport(periodIndex = periodIndexFor(2026)) {
  return {
    periodIndex,
    year: CAMPAIGN_PERIODS[periodIndex].year,
    periodLabel: CAMPAIGN_PERIODS[periodIndex].label,
    summary: "Test report.",
    completedProjects: [],
    headlines: [],
    warnings: [],
    advisorTips: [],
    metricDeltas: {
      computeCoverage: 0,
      powerCoverage: 0,
      coolingCoverage: 0,
      waterCoverage: 0,
      peopleSupport: 0,
      politicalSupport: 0,
      outlook: 0,
    },
  };
}

function findStateThatRollsEvent(): GameState {
  for (let seed = 1; seed < 10_000; seed += 1) {
    const state = stateWith({
      periodIndex: periodIndexFor(2026),
      year: 2026,
      rngSeed: seed,
      rngStep: 0,
      eventCooldownPeriods: 0,
      builtSiteIds: [DATA_CENTER_SITES[0].id, DATA_CENTER_SITES[1].id],
      infrastructure: {
        computeH100e: 3_000_000,
        powerMW: 1_000,
        coolingMW: 500,
        waterMLDay: 250,
      },
    });
    if (rollRandomEventForTurn(state).pendingEvent) return state;
  }

  throw new Error("Could not find deterministic event seed.");
}

describe("game economy", () => {
  it("compounds yearly inflation into action prices", () => {
    const card = findAction("hyperscale-campus");
    const earlyState = stateWith({
      periodIndex: periodIndexFor(2022),
      year: 2022,
    });
    const laterState = stateWith({
      periodIndex: periodIndexFor(2025),
      year: 2025,
    });

    expect(getInflationMultiplier(laterState)).toBeGreaterThan(
      getInflationMultiplier(earlyState),
    );
    expect(getDynamicActionCost(laterState, card)).toBeGreaterThan(
      getDynamicActionCost(earlyState, card),
    );
  });

  it("includes active crisis modifiers in inflation", () => {
    const baseState = stateWith({
      periodIndex: periodIndexFor(2026),
      year: 2026,
    });
    const crisisState = stateWith({
      ...baseState,
      activeModifiers: [
        {
          id: "war-test",
          sourceEventId: "war-started",
          label: "War inflation",
          description: "Test crisis modifier.",
          costMultiplier: 1.2,
          endsAtPeriodIndex: baseState.periodIndex + 2,
        },
      ],
    });

    expect(getInflationMultiplier(crisisState)).toBeCloseTo(
      getInflationMultiplier(baseState) * 1.2,
    );
  });

  it("uses easy as the baseline and raises inflation for medium and hard", () => {
    const easyState = stateWith({
      difficultyId: "easy",
      periodIndex: periodIndexFor(2026),
      year: 2026,
    });
    const mediumState = stateWith({
      ...easyState,
      difficultyId: "medium",
    });
    const hardState = stateWith({
      ...easyState,
      difficultyId: "hard",
    });

    expect(getInflationMultiplier(easyState)).toBeCloseTo(Math.pow(1.1, 4));
    expect(getInflationMultiplier(mediumState)).toBeGreaterThan(
      getInflationMultiplier(easyState),
    );
    expect(getInflationMultiplier(hardState)).toBeGreaterThan(
      getInflationMultiplier(mediumState),
    );
  });
});

describe("difficulty selection", () => {
  it("can be changed before commitments and is preserved by restart", () => {
    const changed = changeDifficulty(initialGameState, "hard");

    expect(changed.difficultyId).toBe("hard");
    expect(restartRun(changed.difficultyId).difficultyId).toBe("hard");
  });

  it("cannot be changed once projects are committed", () => {
    const committedState = stateWith({
      projects: [
        {
          id: "queued-campus",
          cardId: "hyperscale-campus",
          siteId: DATA_CENTER_SITES[0].id,
          selectedPeriodIndex: 0,
          readyPeriodIndex: 0,
          cost: 5,
        },
      ],
    });

    expect(canChangeDifficulty(committedState)).toBe(false);
    expect(changeDifficulty(committedState, "hard").difficultyId).toBe("easy");
  });
});

describe("build-cap rules", () => {
  it("counts completed and queued campuses and expansions against the cap", () => {
    const state = stateWith({
      builtSiteIds: DATA_CENTER_SITES.slice(0, MAX_BUILDS - 2).map(
        (site) => site.id,
      ),
      completedExpansionCount: 1,
      projects: [
        {
          id: "queued-expansion",
          cardId: "expand-campus",
          siteId: DATA_CENTER_SITES[0].id,
          selectedPeriodIndex: 3,
          readyPeriodIndex: 4,
          cost: 4,
        },
      ],
    });

    expect(getCommittedBuildUnits(state)).toBe(MAX_BUILDS);
  });

  it("blocks campuses and expansions when committed build capacity is full", () => {
    const fullState = stateWith({
      periodIndex: periodIndexFor(2026),
      year: 2026,
      builtSiteIds: DATA_CENTER_SITES.map((site) => site.id),
      completedExpansionCount: MAX_BUILDS - DATA_CENTER_SITES.length,
      selectedSiteId: DATA_CENTER_SITES[0].id,
      infrastructure: {
        computeH100e: 60_000_000,
        powerMW: 50_000,
        coolingMW: 20_000,
        waterMLDay: 4_000,
      },
    });

    expect(getActionLockReason(fullState, findAction("expand-campus"))).toBe(
      `Build capacity is full (${MAX_BUILDS}/${MAX_BUILDS})`,
    );
  });

  it("blocks duplicate campus commitments in the same market", () => {
    const selectedSiteId = DATA_CENTER_SITES[0].id;
    const state = stateWith({
      selectedSiteId,
      projects: [
        {
          id: "queued-campus",
          cardId: "hyperscale-campus",
          siteId: selectedSiteId,
          selectedPeriodIndex: 0,
          readyPeriodIndex: 0,
          cost: 5,
        },
      ],
    });

    expect(getActionLockReason(state, findAction("hyperscale-campus"))).toBe(
      "Campus already committed here",
    );
  });
});

describe("random events", () => {
  it("rolls events reproducibly from the same seed and RNG step", () => {
    const state = findStateThatRollsEvent();

    expect(rollRandomEventForTurn(state)).toEqual(
      rollRandomEventForTurn(state),
    );
  });

  it("raises event severity when current conditions are weak", () => {
    const stableState = stateWith({
      periodIndex: periodIndexFor(2025),
      year: 2025,
      support: {
        ...initialGameState.support,
        people: 80,
        labor: 80,
        environmental: 80,
      },
    });
    const fragileState = stateWith({
      periodIndex: periodIndexFor(2025),
      year: 2025,
      support: {
        ...initialGameState.support,
        people: 20,
        labor: 20,
        environmental: 20,
      },
    });

    expect(getRandomEventSeverity("local-protests", stableState)).toBe("low");
    expect(getRandomEventSeverity("local-protests", fragileState)).toBe("high");
  });

  it("rolls standard random events more often on medium than easy", () => {
    let matchedState: GameState | null = null;

    for (let seed = 1; seed < 20_000; seed += 1) {
      const state = stateWith({
        difficultyId: "easy",
        periodIndex: periodIndexFor(2026),
        year: 2026,
        rngSeed: seed,
        rngStep: 0,
        eventCooldownPeriods: 0,
        builtSiteIds: [DATA_CENTER_SITES[0].id, DATA_CENTER_SITES[1].id],
        infrastructure: {
          computeH100e: 3_000_000,
          powerMW: 1_000,
          coolingMW: 500,
          waterMLDay: 250,
        },
      });

      if (
        !rollRandomEventForTurn(state).pendingEvent &&
        rollRandomEventForTurn({ ...state, difficultyId: "medium" })
          .pendingEvent
      ) {
        matchedState = state;
        break;
      }
    }

    if (!matchedState) {
      throw new Error("Could not find medium-only random-event seed.");
    }

    expect(rollRandomEventForTurn(matchedState).pendingEvent).toBeNull();
    expect(
      rollRandomEventForTurn({ ...matchedState, difficultyId: "medium" })
        .pendingEvent,
    ).not.toBeNull();
  });

  it("applies prolonged war inflation and expires it cleanly", () => {
    let resolved: GameState | null = null;

    for (let seed = 1; seed < 10_000; seed += 1) {
      const state = stateWith({
        periodIndex: periodIndexFor(2026),
        year: 2026,
        phase: "report",
        report: testReport(),
        rngSeed: seed,
        rngStep: 0,
        pendingEvent: {
          id: "war-started",
          family: "geopolitics",
          title: "War shock",
          prompt: "War started overseas.",
          severity: "high",
          periodIndex: periodIndexFor(2026),
          choices: [
            { id: "wait", label: "Wait it out", body: "Preserve budget." },
          ],
        },
      });
      const candidate = resolveRandomEventChoice(state, "wait");
      if (
        candidate.activeModifiers.some(
          (modifier) => modifier.label === "War inflation",
        )
      ) {
        resolved = candidate;
        break;
      }
    }

    if (!resolved)
      throw new Error("Could not resolve a war-inflation outcome.");

    const warModifier = resolved.activeModifiers.find(
      (modifier) => modifier.label === "War inflation",
    );
    expect(warModifier).toBeDefined();
    const expired = continueFromReport({
      ...resolved,
      phase: "report",
      pendingEvent: { ...resolved.pendingEvent!, resolvedChoiceId: "wait" },
      periodIndex: warModifier!.endsAtPeriodIndex,
    });

    expect(expired.activeModifiers).not.toContainEqual(warModifier);
  });

  it("lets hard-mode independent wars stack with existing war inflation", () => {
    const periodIndex = periodIndexFor(2026);
    const existingWar = {
      id: "existing-war",
      sourceEventId: "war-started",
      label: "War inflation",
      description: "Existing test war.",
      costMultiplier: 1.08,
      endsAtPeriodIndex: periodIndex + 6,
    };
    let rolled: GameState | null = null;

    for (let seed = 1; seed < 20_000; seed += 1) {
      const state = stateWith({
        difficultyId: "hard",
        periodIndex,
        year: 2026,
        phase: "report",
        report: testReport(periodIndex),
        rngSeed: seed,
        rngStep: 0,
        eventCooldownPeriods: 5,
        builtSiteIds: [DATA_CENTER_SITES[0].id],
        activeModifiers: [existingWar],
      });
      const candidate = rollRandomEventForTurn(state);
      const warModifiers = candidate.activeModifiers.filter(
        (modifier) => modifier.label === "War inflation",
      );

      if (warModifiers.length === 2) {
        rolled = candidate;
        break;
      }
    }

    if (!rolled) {
      throw new Error("Could not find hard-mode independent war seed.");
    }

    const baseHardState = stateWith({
      difficultyId: "hard",
      periodIndex,
      year: 2026,
    });

    expect(
      rolled.activeModifiers.filter(
        (modifier) => modifier.label === "War inflation",
      ),
    ).toHaveLength(2);
    expect(getInflationMultiplier(rolled)).toBeCloseTo(
      getInflationMultiplier(baseHardState) * 1.08 * 1.08,
    );
    expect(rolled.report?.warnings).toContain(
      "Hard-mode war risk is independent of normal random events; overlapping wars multiply project costs.",
    );
  });

  it("keeps representative event families in the catalog", () => {
    const families = new Set(RANDOM_EVENTS.map((event) => event.family));

    expect(families).toEqual(
      new Set([
        "public-media",
        "community-legal",
        "market-finance",
        "vendor-competitor",
        "grid-utility",
        "climate-weather",
        "labor-supply",
        "security-operations",
        "technology",
        "geopolitics",
      ]),
    );
    expect(
      getRandomEventSeverity("amazon-loan-offer", findStateThatRollsEvent()),
    ).toMatch(/low|medium|high/);
    expect(
      getRandomEventSeverity("cooling-breakthrough", findStateThatRollsEvent()),
    ).toMatch(/low|medium|high/);
  });
});
