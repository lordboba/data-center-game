import {
  ACTION_CARDS,
  ANNUAL_BUDGETS,
  ActionCard,
  ActionEffects,
  DATA_CENTER_SITES,
  DataCenterSite,
  DEMAND_CURVE,
  END_YEAR,
  GameMode,
  GameModeId,
  GAME_MODES,
  MIN_DEMAND_TO_WIN,
  REGION_TARGETS,
  STARTING_BUDGET,
  START_YEAR,
  WIN_SCORE,
} from "../data/gameData";

export type GamePhase = "planning" | "report" | "finished";
export type GameOutcomeStatus = "active" | "won" | "lost";

export type SupportState = {
  people: number;
  political: number;
  environmental: number;
  labor: number;
  regulator: number;
  business: number;
};

export type InfrastructureState = {
  computeH100e: number;
  powerMW: number;
  coolingMW: number;
  waterMLDay: number;
};

export type PlannedAction = {
  id: string;
  cardId: string;
  siteId: string | null;
  selectedYear: number;
  readyYear: number;
};

export type TurnReport = {
  year: number;
  summary: string;
  completedProjects: string[];
  headlines: string[];
  warnings: string[];
  advisorTips: string[];
  metricDeltas: {
    computeCoverage: number;
    powerCoverage: number;
    coolingCoverage: number;
    waterCoverage: number;
    peopleSupport: number;
    politicalSupport: number;
  };
};

export type GameState = {
  year: number;
  phase: GamePhase;
  outcome: GameOutcomeStatus;
  builtSiteIds: string[];
  selectedSiteId: string;
  selectedActionIds: string[];
  projects: PlannedAction[];
  report: TurnReport | null;
  support: SupportState;
  infrastructure: InfrastructureState;
  emissionsIndex: number;
  missedPeriods: number;
};

export type ScoreBreakdown = {
  score: number;
  capacity: number;
  budgetSpent: number;
  budgetRemaining: number;
  avgLatency: number;
  avgCleanPower: number;
  avgWaterSecurity: number;
  avgClimateResilience: number;
  avgOperatingMargin: number;
  regionCoverage: number;
  demandCoverage: number;
  riskPenalty: number;
  missedPeriods: number;
};

export type SupplySummary = {
  demand: {
    h100e: number;
    powerMW: number;
    coolingMW: number;
    waterMLDay: number;
  };
  computeCoverage: number;
  powerCoverage: number;
  coolingCoverage: number;
  waterCoverage: number;
  peopleSupport: number;
  politicalSupport: number;
  mainBottleneck: string;
};

export type RunOutcome = {
  status: "won" | "lost" | "in-progress";
  title: string;
  description: string;
};

export const initialGameState: GameState = {
  year: START_YEAR,
  phase: "planning",
  outcome: "active",
  builtSiteIds: [],
  selectedSiteId: DATA_CENTER_SITES[0].id,
  selectedActionIds: [],
  projects: [],
  report: null,
  support: {
    people: 68,
    political: 66,
    environmental: 58,
    labor: 62,
    regulator: 60,
    business: 72,
  },
  infrastructure: {
    computeH100e: 0,
    powerMW: 0,
    coolingMW: 0,
    waterMLDay: 450,
  },
  emissionsIndex: 35,
  missedPeriods: 0,
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function projectId(): string {
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getGameMode(modeId: GameModeId): GameMode {
  return GAME_MODES.find((mode) => mode.id === modeId) ?? GAME_MODES[0];
}

export function findSite(siteId: string): DataCenterSite {
  const site = DATA_CENTER_SITES.find((candidate) => candidate.id === siteId);
  if (!site) {
    throw new Error(`Unknown data center site: ${siteId}`);
  }
  return site;
}

export function findAction(cardId: string): ActionCard {
  const card = ACTION_CARDS.find((candidate) => candidate.id === cardId);
  if (!card) {
    throw new Error(`Unknown action card: ${cardId}`);
  }
  return card;
}

export function getBuiltSites(state: GameState): DataCenterSite[] {
  return state.builtSiteIds.map(findSite);
}

export function getDemand(year: number) {
  const demand =
    DEMAND_CURVE.find((row) => row.year === year) ??
    DEMAND_CURVE[DEMAND_CURVE.length - 1];

  return {
    h100e: demand.h100e,
    powerMW: demand.powerMW,
    coolingMW: Math.round(demand.powerMW * 0.3),
    waterMLDay: Math.round(demand.powerMW * 0.08),
  };
}

export function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

export function calculatePeopleSupport(support: SupportState): number {
  return clamp(
    support.people * 0.5 +
      support.labor * 0.2 +
      support.environmental * 0.2 +
      support.regulator * 0.1,
  );
}

export function calculatePoliticalSupport(support: SupportState): number {
  return clamp(
    support.political * 0.4 +
      support.business * 0.25 +
      support.regulator * 0.2 +
      support.labor * 0.15,
  );
}

export function getSupplySummary(
  state: GameState,
  year = state.year,
): SupplySummary {
  const demand = getDemand(year);
  const computeCoverage = clamp(
    (state.infrastructure.computeH100e / demand.h100e) * 100,
  );
  const powerCoverage = clamp(
    (state.infrastructure.powerMW / demand.powerMW) * 100,
  );
  const coolingCoverage = clamp(
    (state.infrastructure.coolingMW / demand.coolingMW) * 100,
  );
  const waterCoverage = clamp(
    (state.infrastructure.waterMLDay / demand.waterMLDay) * 100,
  );
  const peopleSupport = calculatePeopleSupport(state.support);
  const politicalSupport = calculatePoliticalSupport(state.support);
  const bottlenecks = [
    { label: "Compute", value: computeCoverage },
    { label: "Power", value: powerCoverage },
    { label: "Cooling", value: coolingCoverage },
    { label: "Water", value: waterCoverage },
    { label: "People support", value: peopleSupport },
    { label: "Political support", value: politicalSupport },
  ].sort((a, b) => a.value - b.value);

  return {
    demand,
    computeCoverage,
    powerCoverage,
    coolingCoverage,
    waterCoverage,
    peopleSupport,
    politicalSupport,
    mainBottleneck: bottlenecks[0].label,
  };
}

export function getAnnualBudget(year: number): number {
  return ANNUAL_BUDGETS[year] ?? ANNUAL_BUDGETS[END_YEAR];
}

export function getPlannedCost(state: GameState): number {
  return state.projects
    .filter((project) => project.selectedYear === state.year)
    .reduce((sum, project) => sum + findAction(project.cardId).cost, 0);
}

export function getBudgetRemaining(state: GameState): number {
  return getAnnualBudget(state.year) - getPlannedCost(state);
}

export function canSelectAction(state: GameState, card: ActionCard): boolean {
  if (state.phase !== "planning" || state.outcome !== "active") return false;
  if (state.year < card.availableYear) return false;
  if (state.selectedActionIds.includes(card.id)) return false;
  return getBudgetRemaining(state) >= card.cost;
}

export function selectAction(state: GameState, cardId: string): GameState {
  const card = findAction(cardId);
  if (!canSelectAction(state, card)) return state;

  return {
    ...state,
    selectedActionIds: [...state.selectedActionIds, card.id],
    projects: [
      ...state.projects,
      {
        id: projectId(),
        cardId: card.id,
        siteId: card.requiresSite ? state.selectedSiteId : null,
        selectedYear: state.year,
        readyYear: state.year + card.durationYears,
      },
    ],
  };
}

export function removeAction(
  state: GameState,
  projectIdToRemove: string,
): GameState {
  const project = state.projects.find(
    (candidate) => candidate.id === projectIdToRemove,
  );
  if (!project || project.selectedYear !== state.year) return state;

  return {
    ...state,
    selectedActionIds: state.selectedActionIds.filter(
      (id) => id !== project.cardId,
    ),
    projects: state.projects.filter(
      (candidate) => candidate.id !== projectIdToRemove,
    ),
  };
}

function applyEffects(
  infrastructure: InfrastructureState,
  support: SupportState,
  emissionsIndex: number,
  effects: ActionEffects,
) {
  return {
    infrastructure: {
      computeH100e: Math.max(
        0,
        infrastructure.computeH100e + (effects.computeH100e ?? 0),
      ),
      powerMW: Math.max(0, infrastructure.powerMW + (effects.powerMW ?? 0)),
      coolingMW: Math.max(
        0,
        infrastructure.coolingMW + (effects.coolingMW ?? 0),
      ),
      waterMLDay: Math.max(
        0,
        infrastructure.waterMLDay + (effects.waterMLDay ?? 0),
      ),
    },
    support: {
      people: clamp(support.people + (effects.peopleSupport ?? 0)),
      political: clamp(support.political + (effects.politicalSupport ?? 0)),
      environmental: clamp(
        support.environmental + (effects.environmentalSupport ?? 0),
      ),
      labor: clamp(support.labor + (effects.laborSupport ?? 0)),
      regulator: clamp(support.regulator + (effects.regulatorSupport ?? 0)),
      business: clamp(support.business + (effects.businessSupport ?? 0)),
    },
    emissionsIndex: clamp(emissionsIndex + (effects.emissionsIndex ?? 0)),
  };
}

function eventEffects(
  state: GameState,
  supply: SupplySummary,
): {
  support: Partial<SupportState>;
  emissionsIndex?: number;
  headlines: string[];
} {
  const headlines: string[] = [];
  const support: Partial<SupportState> = {};
  let emissionsIndex = state.emissionsIndex;

  if (supply.powerCoverage < 70) {
    headlines.push(
      "Grid operator warns that AI load growth is outrunning firm power.",
    );
    support.political = (support.political ?? 0) - 5;
    support.regulator = (support.regulator ?? 0) - 4;
  }

  if (supply.waterCoverage < 70) {
    headlines.push(
      "Water coalition challenges the footprint of new data-center construction.",
    );
    support.people = (support.people ?? 0) - 6;
    support.environmental = (support.environmental ?? 0) - 6;
  }

  if (supply.computeCoverage >= 90 && supply.powerCoverage >= 85) {
    headlines.push(
      "State officials celebrate AI infrastructure jobs and new regional investment.",
    );
    support.political = (support.political ?? 0) + 4;
    support.business = (support.business ?? 0) + 4;
    support.labor = (support.labor ?? 0) + 2;
  }

  if (state.emissionsIndex > 62) {
    headlines.push(
      "Climate groups pressure regulators over the emissions profile of the expansion.",
    );
    support.environmental = (support.environmental ?? 0) - 5;
    support.people = (support.people ?? 0) - 3;
    emissionsIndex = clamp(emissionsIndex + 2);
  }

  return { support, emissionsIndex, headlines };
}

function applySupportDelta(
  support: SupportState,
  delta: Partial<SupportState>,
): SupportState {
  return {
    people: clamp(support.people + (delta.people ?? 0)),
    political: clamp(support.political + (delta.political ?? 0)),
    environmental: clamp(support.environmental + (delta.environmental ?? 0)),
    labor: clamp(support.labor + (delta.labor ?? 0)),
    regulator: clamp(support.regulator + (delta.regulator ?? 0)),
    business: clamp(support.business + (delta.business ?? 0)),
  };
}

export function getRecommendedActionIds(state: GameState): Set<string> {
  const supply = getSupplySummary(state);
  const recommended = new Set<string>();

  if (supply.computeCoverage < 80) {
    recommended.add("hyperscale-campus");
    recommended.add("lease-colocation");
  }
  if (supply.powerCoverage < 80) {
    recommended.add("renewables-ppa");
    recommended.add("grid-interconnect");
    recommended.add("fast-gas-capacity");
  }
  if (supply.coolingCoverage < 80) recommended.add("dry-cooling");
  if (supply.waterCoverage < 80) recommended.add("water-recycling");
  if (supply.peopleSupport < 55) recommended.add("community-benefits");
  if (supply.politicalSupport < 55) recommended.add("fast-track-permitting");

  return recommended;
}

export function runAnnualPlan(state: GameState): GameState {
  if (state.phase !== "planning" || state.outcome !== "active") return state;

  const before = getSupplySummary(state);
  const plannedThisYear = state.projects.filter(
    (project) => project.selectedYear === state.year,
  );
  const completedNow = state.projects.filter(
    (project) => project.readyYear <= state.year,
  );
  const stillQueued = state.projects.filter(
    (project) => project.readyYear > state.year,
  );
  const completedProjects: string[] = [];
  let infrastructure = state.infrastructure;
  let support = state.support;
  let emissionsIndex = state.emissionsIndex;
  const builtSiteIds = new Set(state.builtSiteIds);

  for (const project of completedNow) {
    const card = findAction(project.cardId);
    const applied = applyEffects(
      infrastructure,
      support,
      emissionsIndex,
      card.effects,
    );
    infrastructure = applied.infrastructure;
    support = applied.support;
    emissionsIndex = applied.emissionsIndex;
    completedProjects.push(card.title);

    if (card.category === "compute" && project.siteId) {
      builtSiteIds.add(project.siteId);
    }
  }

  const nextStateBase: GameState = {
    ...state,
    builtSiteIds: [...builtSiteIds],
    selectedActionIds: [],
    projects: stillQueued,
    infrastructure,
    support,
    emissionsIndex,
  };
  const afterProjects = getSupplySummary(nextStateBase);
  const event = eventEffects(nextStateBase, afterProjects);
  support = applySupportDelta(nextStateBase.support, event.support);
  emissionsIndex = event.emissionsIndex ?? emissionsIndex;

  const eventState = { ...nextStateBase, support, emissionsIndex };
  const after = getSupplySummary(eventState);
  const warnings = [
    after.computeCoverage < 65
      ? "Compute demand is outrunning built capacity."
      : "",
    after.powerCoverage < 65 ? "Power is the binding constraint." : "",
    after.coolingCoverage < 65
      ? "Cooling capacity is below the current demand target."
      : "",
    after.waterCoverage < 65
      ? "Water resilience is under the safe operating threshold."
      : "",
    after.peopleSupport < 45 ? "People support is close to collapse." : "",
    after.politicalSupport < 45
      ? "Political support is close to collapse."
      : "",
  ].filter(Boolean);
  const advisorTips = [
    after.mainBottleneck === "Compute"
      ? "Add compute, but pair it with power and cooling capacity."
      : "",
    after.mainBottleneck === "Power"
      ? "Prioritize PPAs, grid interconnects, or dispatchable power next year."
      : "",
    after.mainBottleneck === "Cooling"
      ? "Use dry cooling or avoid another large campus until thermal capacity catches up."
      : "",
    after.mainBottleneck === "Water"
      ? "Water recycling will protect support and reduce permit risk."
      : "",
    after.mainBottleneck.includes("support")
      ? "Spend political capital before another controversial capacity push."
      : "",
  ].filter(Boolean);
  const completedText =
    completedProjects.length > 0
      ? `${completedProjects.length} project${completedProjects.length === 1 ? "" : "s"} came online.`
      : plannedThisYear.length > 0
        ? "Projects entered the queue; longer builds will come online in a later year."
        : "No annual plan was funded.";
  const outcome = getOutcomeForState(eventState, after);
  const report: TurnReport = {
    year: state.year,
    summary: `${completedText} Main bottleneck: ${after.mainBottleneck}.`,
    completedProjects,
    headlines:
      event.headlines.length > 0
        ? event.headlines
        : [
            "No major external shock this year; execution quality drove the outcome.",
          ],
    warnings,
    advisorTips,
    metricDeltas: {
      computeCoverage: after.computeCoverage - before.computeCoverage,
      powerCoverage: after.powerCoverage - before.powerCoverage,
      coolingCoverage: after.coolingCoverage - before.coolingCoverage,
      waterCoverage: after.waterCoverage - before.waterCoverage,
      peopleSupport: after.peopleSupport - before.peopleSupport,
      politicalSupport: after.politicalSupport - before.politicalSupport,
    },
  };

  return {
    ...eventState,
    phase: outcome === "active" ? "report" : "finished",
    outcome,
    report,
  };
}

function getOutcomeForState(
  state: GameState,
  supply = getSupplySummary(state),
): GameOutcomeStatus {
  if (supply.peopleSupport <= 0 || supply.politicalSupport <= 0) return "lost";
  if (state.year < END_YEAR) return "active";

  const score = calculateScore(state);
  const won =
    score.score >= WIN_SCORE &&
    supply.computeCoverage >= MIN_DEMAND_TO_WIN &&
    supply.powerCoverage >= 80 &&
    supply.coolingCoverage >= 75 &&
    supply.waterCoverage >= 70 &&
    supply.peopleSupport > 0 &&
    supply.politicalSupport > 0;

  return won ? "won" : "lost";
}

export function continueFromReport(state: GameState): GameState {
  if (state.phase !== "report") return state;

  const nextYear = state.year + 1;
  if (nextYear > END_YEAR) {
    return { ...state, phase: "finished", outcome: getOutcomeForState(state) };
  }

  return {
    ...state,
    year: nextYear,
    phase: "planning",
    report: null,
  };
}

export function finishRun(state: GameState): GameState {
  return { ...state, phase: "finished", outcome: getOutcomeForState(state) };
}

export function restartRun(): GameState {
  return {
    ...initialGameState,
    support: { ...initialGameState.support },
    infrastructure: { ...initialGameState.infrastructure },
  };
}

export function formatBudget(value: number): string {
  return `$${value.toFixed(0)}B`;
}

export function getCurrentPeriodLabel(state: GameState): string {
  return String(state.year);
}

export function calculateScore(
  stateOrSiteIds: GameState | string[],
  missedPeriods = 0,
): ScoreBreakdown {
  if (!Array.isArray(stateOrSiteIds)) {
    const state = stateOrSiteIds;
    const supply = getSupplySummary(state, END_YEAR);
    const builtSites = getBuiltSites(state);
    const avg = (
      key: keyof Pick<
        DataCenterSite,
        | "latency"
        | "cleanPower"
        | "waterSecurity"
        | "climateResilience"
        | "operatingMargin"
      >,
    ) => {
      if (builtSites.length === 0) return 0;
      return Math.round(
        builtSites.reduce((sum, site) => sum + Number(site[key]), 0) /
          builtSites.length,
      );
    };
    const budgetSpent = STARTING_BUDGET - getBudgetRemaining(state);
    const demandCoverage = Math.round(
      (supply.computeCoverage +
        supply.powerCoverage +
        supply.coolingCoverage +
        supply.waterCoverage) /
        4,
    );
    const supportBonus = Math.round(
      (supply.peopleSupport + supply.politicalSupport) * 1.4,
    );
    const emissionsPenalty = Math.max(0, state.emissionsIndex - 45) * 3;
    const score = Math.max(
      0,
      Math.round(
        supply.computeCoverage * 2.3 +
          supply.powerCoverage * 1.9 +
          supply.coolingCoverage * 1.3 +
          supply.waterCoverage * 1.2 +
          supportBonus +
          builtSites.length * 24 -
          emissionsPenalty,
      ),
    );

    return {
      score,
      capacity: Math.round(state.infrastructure.powerMW),
      budgetSpent,
      budgetRemaining: getBudgetRemaining(state),
      avgLatency: avg("latency"),
      avgCleanPower: avg("cleanPower"),
      avgWaterSecurity: avg("waterSecurity"),
      avgClimateResilience: avg("climateResilience"),
      avgOperatingMargin: avg("operatingMargin"),
      regionCoverage: new Set(builtSites.map((site) => site.region)).size * 7,
      demandCoverage,
      riskPenalty: emissionsPenalty,
      missedPeriods: state.missedPeriods,
    };
  }

  const sites = stateOrSiteIds.map(findSite);
  const budgetSpent = sites.reduce((sum, site) => sum + site.capex, 0);
  const budgetRemaining = STARTING_BUDGET - budgetSpent;
  const capacity = sites.reduce((sum, site) => sum + site.capacity, 0);
  const avg = (
    key: keyof Pick<
      DataCenterSite,
      | "latency"
      | "cleanPower"
      | "waterSecurity"
      | "climateResilience"
      | "operatingMargin"
    >,
  ) => {
    if (sites.length === 0) return 0;
    return Math.round(
      sites.reduce((sum, site) => sum + Number(site[key]), 0) / sites.length,
    );
  };
  const uniqueRegions = new Set(sites.map((site) => site.region));
  const weightedRegionReach = sites.reduce((sum, site) => {
    const regionWeight = REGION_TARGETS[site.region] ?? 0;
    return sum + regionWeight * (site.latency / 100);
  }, 0);
  const demandCoverage = Math.min(100, Math.round(weightedRegionReach));
  const regionCoverage = uniqueRegions.size * 7;
  const avgWaterSecurity = avg("waterSecurity");
  const avgClimateResilience = avg("climateResilience");
  const riskPenalty = Math.max(
    0,
    Math.round((160 - avgWaterSecurity - avgClimateResilience) * 0.7) +
      missedPeriods * 7,
  );
  const score = Math.max(
    0,
    Math.round(
      capacity * 2.4 +
        avg("latency") * 1.2 +
        avg("cleanPower") * 1.05 +
        avgWaterSecurity * 0.85 +
        avgClimateResilience * 0.85 +
        avg("operatingMargin") * 0.9 +
        demandCoverage * 1.1 +
        regionCoverage +
        budgetRemaining * 0.45 -
        riskPenalty,
    ),
  );

  return {
    score,
    capacity,
    budgetSpent,
    budgetRemaining,
    avgLatency: avg("latency"),
    avgCleanPower: avg("cleanPower"),
    avgWaterSecurity,
    avgClimateResilience,
    avgOperatingMargin: avg("operatingMargin"),
    regionCoverage,
    demandCoverage,
    riskPenalty,
    missedPeriods,
  };
}

export function getAffordableSites(state: GameState): DataCenterSite[] {
  const built = new Set(state.builtSiteIds);
  return DATA_CENTER_SITES.filter((site) => !built.has(site.id));
}

export function canBuildSite(state: GameState, siteId: string): boolean {
  void state;
  void siteId;
  return false;
}

export function buildSite(state: GameState): GameState {
  return state;
}

export function selectNextCandidate(state: GameState): string {
  return getAffordableSites(state)[0]?.id ?? state.selectedSiteId;
}

export function advancePeriod(state: GameState): GameState {
  return runAnnualPlan(state);
}

export function getRunOutcome(state: GameState): RunOutcome {
  if (state.phase !== "finished") {
    return {
      status: "in-progress",
      title: "Campaign in progress",
      description: "Keep planning annual capacity until 2030.",
    };
  }

  if (state.outcome === "won") {
    return {
      status: "won",
      title: "Network approved",
      description: `You cleared the 2030 demand test, maintained support, and passed ${WIN_SCORE} points.`,
    };
  }

  const supply = getSupplySummary(state, END_YEAR);
  const collapse =
    supply.peopleSupport <= 0
      ? "Public opposition stopped expansion."
      : supply.politicalSupport <= 0
        ? "The political coalition collapsed."
        : "The 2030 network missed one or more capacity thresholds.";

  return {
    status: "lost",
    title: "Board rejected",
    description: collapse,
  };
}

export function getDefaultGameMode(): GameMode {
  return getGameMode("quarterly");
}

export function getLegacyClockLabel(turn: number, mode: GameMode): string {
  const periodIndex = Math.min(turn - 1, mode.maxPeriods - 1);
  const monthOffset = periodIndex * mode.stepMonths;
  const year = START_YEAR + Math.floor(monthOffset / 12);
  const monthIndex = monthOffset % 12;

  if (mode.stepMonths === 3) {
    return `Q${Math.floor(monthIndex / 3) + 1} ${year}`;
  }

  return `${MONTH_LABELS[monthIndex]} ${year}`;
}
