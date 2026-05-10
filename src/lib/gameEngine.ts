import {
  ACTION_CARDS,
  ANNUAL_BUDGETS,
  ActionCard,
  ActionEffects,
  CAMPAIGN_PERIODS,
  DATA_CENTER_SITES,
  DataCenterSite,
  DEMAND_CURVE,
  END_YEAR,
  GameMode,
  GameModeId,
  GAME_MODES,
  METRIC_FIRST_AVAILABLE_PERIODS,
  MIN_DEMAND_TO_WIN,
  REGION_TARGETS,
  STARTING_BUDGET,
  START_YEAR,
  UNLOCK_STAGE_ORDER,
  WIN_SCORE,
  UnlockStage,
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
  selectedPeriodIndex: number;
  readyPeriodIndex: number;
  cost: number;
};

export type TurnReport = {
  periodIndex: number;
  year: number;
  periodLabel: string;
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
    outlook: number;
  };
};

export type GameState = {
  periodIndex: number;
  year: number;
  phase: GamePhase;
  outcome: GameOutcomeStatus;
  builtSiteIds: string[];
  selectedSiteId: string;
  selectedActionIds: string[];
  completedTutorialIds: string[];
  projects: PlannedAction[];
  report: TurnReport | null;
  support: SupportState;
  infrastructure: InfrastructureState;
  emissionsIndex: number;
  missedPeriods: number;
  outlook: number;
  budgetBalance: number;
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
  periodIndex: 0,
  year: START_YEAR,
  phase: "planning",
  outcome: "active",
  builtSiteIds: [],
  selectedSiteId: DATA_CENTER_SITES[0].id,
  selectedActionIds: [],
  completedTutorialIds: [],
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
  outlook: 62,
  budgetBalance: 0,
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

function stageRank(stage: UnlockStage): number {
  return UNLOCK_STAGE_ORDER.indexOf(stage);
}

function hasProgressionPeriod(
  state: Pick<GameState, "periodIndex">,
  firstAvailablePeriod: number,
): boolean {
  return state.periodIndex >= firstAvailablePeriod;
}

function periodUnlockLabel(firstAvailablePeriod: number): string {
  return CAMPAIGN_PERIODS[firstAvailablePeriod]?.label ?? "a later period";
}

function hasVisibleMetric(
  state: Pick<GameState, "periodIndex">,
  metric: keyof typeof METRIC_FIRST_AVAILABLE_PERIODS,
): boolean {
  return hasProgressionPeriod(state, METRIC_FIRST_AVAILABLE_PERIODS[metric]);
}

function absoluteMonth(year: number, month: number): number {
  return (year - START_YEAR) * 12 + month;
}

function periodEndMonth(periodIndex: number): number {
  const period = CAMPAIGN_PERIODS[periodIndex] ?? CAMPAIGN_PERIODS[0];
  return absoluteMonth(period.year, period.endMonth);
}

function getReadyPeriodIndex(
  selectedPeriodIndex: number,
  durationMonths: number,
): number {
  if (durationMonths <= 0) return selectedPeriodIndex;

  const readyMonth = periodEndMonth(selectedPeriodIndex) + durationMonths;
  const readyPeriod =
    CAMPAIGN_PERIODS.find(
      (period) => absoluteMonth(period.year, period.endMonth) >= readyMonth,
    ) ?? CAMPAIGN_PERIODS[CAMPAIGN_PERIODS.length - 1];
  return readyPeriod.index;
}

export function getCurrentPeriod(state: Pick<GameState, "periodIndex">) {
  return (
    CAMPAIGN_PERIODS[state.periodIndex] ??
    CAMPAIGN_PERIODS[CAMPAIGN_PERIODS.length - 1]
  );
}

export function getPeriodLabel(state: Pick<GameState, "periodIndex">): string {
  return getCurrentPeriod(state).label;
}

export function isUnlockStageAvailable(
  currentStage: UnlockStage,
  requiredStage: UnlockStage,
): boolean {
  return stageRank(currentStage) >= stageRank(requiredStage);
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

export function getSelectableSites(state: GameState): DataCenterSite[] {
  return DATA_CENTER_SITES.filter((site) =>
    hasProgressionPeriod(state, site.firstAvailablePeriod),
  );
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

export function getPeriodDemand(state: Pick<GameState, "periodIndex">) {
  const period = getCurrentPeriod(state);
  const current =
    DEMAND_CURVE.find((row) => row.year === period.year) ??
    DEMAND_CURVE[DEMAND_CURVE.length - 1];
  const next =
    DEMAND_CURVE.find((row) => row.year === period.year + 1) ?? current;
  const fraction = Math.min(1, Math.max(0, (period.endMonth - 1) / 12));
  const h100e = Math.round(
    current.h100e + (next.h100e - current.h100e) * fraction,
  );
  const powerMW = Math.round(
    current.powerMW + (next.powerMW - current.powerMW) * fraction,
  );

  return {
    h100e,
    powerMW,
    coolingMW: Math.round(powerMW * 0.3),
    waterMLDay: Math.round(powerMW * 0.08),
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
  year?: number,
): SupplySummary {
  const demand =
    typeof year === "number" ? getDemand(year) : getPeriodDemand(state);
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
  const bottlenecks = [{ label: "Compute", value: computeCoverage }];

  if (hasVisibleMetric(state, "power")) {
    bottlenecks.push({ label: "Power", value: powerCoverage });
  }
  if (hasVisibleMetric(state, "cooling")) {
    bottlenecks.push({ label: "Cooling", value: coolingCoverage });
  }
  if (hasVisibleMetric(state, "water")) {
    bottlenecks.push({ label: "Water", value: waterCoverage });
  }
  if (hasVisibleMetric(state, "peopleSupport")) {
    bottlenecks.push({ label: "People support", value: peopleSupport });
  }
  if (hasVisibleMetric(state, "politicalSupport")) {
    bottlenecks.push({ label: "Political support", value: politicalSupport });
  }
  bottlenecks.sort((a, b) => a.value - b.value);

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

export function getAnnualBudget(stateOrYear: GameState | number): number {
  if (typeof stateOrYear === "number") {
    return ANNUAL_BUDGETS[stateOrYear] ?? ANNUAL_BUDGETS[END_YEAR];
  }

  const period = getCurrentPeriod(stateOrYear);
  const base = ANNUAL_BUDGETS[period.year] ?? ANNUAL_BUDGETS[END_YEAR];
  return Math.max(2, base + stateOrYear.budgetBalance);
}

export function getPlannedCost(state: GameState): number {
  return state.projects
    .filter((project) => project.selectedPeriodIndex === state.periodIndex)
    .reduce((sum, project) => sum + project.cost, 0);
}

export function getBudgetRemaining(state: GameState): number {
  return getAnnualBudget(state) - getPlannedCost(state);
}

function getCostPressureValue(state: GameState, card: ActionCard): number {
  const supply = getSupplySummary(state);

  if (card.category === "compute") return supply.computeCoverage;
  if (card.category === "power") return supply.powerCoverage;
  if (card.category === "cooling") return supply.coolingCoverage;
  if (card.category === "water") return supply.waterCoverage;
  if (card.category === "permitting") return supply.politicalSupport;
  if (card.category === "politics") return supply.peopleSupport;
  return Math.round(
    (supply.computeCoverage +
      supply.powerCoverage +
      supply.coolingCoverage +
      supply.waterCoverage) /
      4,
  );
}

export function getDynamicActionCost(
  state: GameState,
  card: ActionCard,
): number {
  const pressure = getCostPressureValue(state, card);
  let cost = card.cost;

  if (pressure >= 85) cost -= 1;
  if (pressure < 60) cost += 1;
  if (pressure < 35) cost += 1;
  if (state.outlook >= 78) cost -= 1;
  if (state.outlook < 45) cost += 1;

  return Math.max(1, cost);
}

export function getActionLockReason(
  state: GameState,
  card: ActionCard,
): string | null {
  const period = getCurrentPeriod(state);
  if (!hasProgressionPeriod(state, card.firstAvailablePeriod)) {
    return `Unlocks ${periodUnlockLabel(card.firstAvailablePeriod)}`;
  }
  if (!isUnlockStageAvailable(period.unlockStage, card.unlockStage)) {
    return `Unlocks with ${card.unlockStage}`;
  }
  if (state.selectedActionIds.includes(card.id)) return "Already selected";

  const requiresMarket = card.siteRequirement !== "none";
  if (requiresMarket) {
    const selectableSiteIds = new Set(
      getSelectableSites(state).map((site) => site.id),
    );
    if (!selectableSiteIds.has(state.selectedSiteId)) {
      return "Market unavailable this period";
    }
  }
  if (
    card.siteRequirement === "built-site" &&
    !state.builtSiteIds.includes(state.selectedSiteId)
  ) {
    return "Build a campus here first";
  }

  const supply = getSupplySummary(state);
  if (
    requiresMarket &&
    hasVisibleMetric(state, "peopleSupport") &&
    supply.peopleSupport < 25 &&
    card.category !== "politics"
  ) {
    return "Public support too low";
  }
  if (
    requiresMarket &&
    hasVisibleMetric(state, "politicalSupport") &&
    supply.politicalSupport < 25 &&
    card.category !== "permitting"
  ) {
    return "Political support too low";
  }
  if (
    hasVisibleMetric(state, "power") &&
    card.category === "compute" &&
    supply.powerCoverage < 25
  ) {
    return "Power shortage blocks expansion";
  }

  const cost = getDynamicActionCost(state, card);
  if (getBudgetRemaining(state) < cost) return "Not enough budget";
  return null;
}

export function getUnlockedActions(state: GameState): ActionCard[] {
  const period = getCurrentPeriod(state);
  return ACTION_CARDS.filter(
    (card) =>
      isUnlockStageAvailable(period.unlockStage, card.unlockStage) &&
      hasProgressionPeriod(state, card.firstAvailablePeriod),
  );
}

export function getVisibleMetrics(state: GameState): Set<string> {
  const visible = new Set(["year", "budget", "compute", "outlook"]);

  if (hasVisibleMetric(state, "power")) visible.add("power");
  if (hasVisibleMetric(state, "cooling")) visible.add("cooling");
  if (hasVisibleMetric(state, "water")) visible.add("water");
  if (hasVisibleMetric(state, "peopleSupport")) visible.add("peopleSupport");
  if (hasVisibleMetric(state, "politicalSupport")) {
    visible.add("politicalSupport");
  }

  return visible;
}

export function canSelectAction(state: GameState, card: ActionCard): boolean {
  if (state.phase !== "planning" || state.outcome !== "active") return false;
  return getActionLockReason(state, card) === null;
}

export function selectAction(state: GameState, cardId: string): GameState {
  const card = findAction(cardId);
  if (!canSelectAction(state, card)) return state;
  const cost = getDynamicActionCost(state, card);

  return {
    ...state,
    selectedActionIds: [...state.selectedActionIds, card.id],
    projects: [
      ...state.projects,
      {
        id: projectId(),
        cardId: card.id,
        siteId: card.siteRequirement === "none" ? null : state.selectedSiteId,
        selectedPeriodIndex: state.periodIndex,
        readyPeriodIndex: getReadyPeriodIndex(
          state.periodIndex,
          card.durationMonths,
        ),
        cost,
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
  if (!project || project.selectedPeriodIndex !== state.periodIndex)
    return state;

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

  if (supply.computeCoverage < 55) {
    headlines.push(
      "AI demand is moving faster than the active compute footprint.",
    );
    support.business = (support.business ?? 0) - 3;
  }

  if (hasVisibleMetric(state, "power") && supply.powerCoverage < 70) {
    headlines.push(
      "Grid operator warns that AI load growth is outrunning firm power.",
    );
    support.political = (support.political ?? 0) - 5;
    support.regulator = (support.regulator ?? 0) - 4;
  }

  if (hasVisibleMetric(state, "water") && supply.waterCoverage < 70) {
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

  if (hasVisibleMetric(state, "peopleSupport") && supply.peopleSupport < 40) {
    headlines.push(
      "Community pressure raises review costs for every visible expansion.",
    );
    support.political = (support.political ?? 0) - 3;
    support.regulator = (support.regulator ?? 0) - 2;
  }

  if (
    hasVisibleMetric(state, "politicalSupport") &&
    supply.politicalSupport < 40
  ) {
    headlines.push(
      "Policy sponsors delay public commitments until the coalition stabilizes.",
    );
    support.business = (support.business ?? 0) - 3;
    support.regulator = (support.regulator ?? 0) - 3;
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

function managementScore(state: GameState, supply: SupplySummary): number {
  const scores = [supply.computeCoverage];

  if (hasVisibleMetric(state, "power")) {
    scores.push(supply.powerCoverage);
  }
  if (hasVisibleMetric(state, "cooling")) {
    scores.push(supply.coolingCoverage);
  }
  if (hasVisibleMetric(state, "water")) {
    scores.push(supply.waterCoverage);
  }
  if (hasVisibleMetric(state, "peopleSupport")) {
    scores.push(supply.peopleSupport);
  }
  if (hasVisibleMetric(state, "politicalSupport")) {
    scores.push(supply.politicalSupport);
  }

  return Math.round(
    scores.reduce((sum, value) => sum + value, 0) / scores.length,
  );
}

function updateOutlook(currentOutlook: number, score: number): number {
  if (score >= 82) return clamp(currentOutlook + 6);
  if (score >= 68) return clamp(currentOutlook + 3);
  if (score < 42) return clamp(currentOutlook - 7);
  if (score < 58) return clamp(currentOutlook - 3);
  return currentOutlook;
}

function getBudgetBalanceForOutlook(outlook: number): number {
  if (outlook >= 85) return 5;
  if (outlook >= 75) return 3;
  if (outlook >= 65) return 1;
  if (outlook < 35) return -4;
  if (outlook < 48) return -2;
  return 0;
}

export function runAnnualPlan(state: GameState): GameState {
  if (state.phase !== "planning" || state.outcome !== "active") return state;

  const before = getSupplySummary(state);
  const plannedThisYear = state.projects.filter(
    (project) => project.selectedPeriodIndex === state.periodIndex,
  );
  const completedNow = state.projects.filter(
    (project) => project.readyPeriodIndex <= state.periodIndex,
  );
  const stillQueued = state.projects.filter(
    (project) => project.readyPeriodIndex > state.periodIndex,
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

    if (card.id === "hyperscale-campus" && project.siteId) {
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
  const score = managementScore(eventState, after);
  const outlook = updateOutlook(state.outlook, score);
  const budgetBalance = getBudgetBalanceForOutlook(outlook);
  const finalEventState = {
    ...eventState,
    outlook,
    budgetBalance,
  };
  const warnings = [
    after.computeCoverage < 65
      ? "Compute demand is outrunning built capacity."
      : "",
    hasVisibleMetric(eventState, "power") && after.powerCoverage < 65
      ? "Power is the binding constraint."
      : "",
    hasVisibleMetric(eventState, "cooling") && after.coolingCoverage < 65
      ? "Cooling capacity is below the current demand target."
      : "",
    hasVisibleMetric(eventState, "water") && after.waterCoverage < 65
      ? "Water resilience is under the safe operating threshold."
      : "",
    hasVisibleMetric(eventState, "peopleSupport") && after.peopleSupport < 45
      ? "People support is close to collapse."
      : "",
    hasVisibleMetric(eventState, "politicalSupport") &&
    after.politicalSupport < 45
      ? "Political support is close to collapse."
      : "",
    outlook < state.outlook
      ? "Outlook fell; next period's budget and prices will tighten."
      : "",
    outlook > state.outlook
      ? "Outlook improved; next period's budget and pricing will be easier."
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
        ? "Projects entered the queue; longer builds will come online in a later period."
        : "No period plan was funded.";
  const outcome = getOutcomeForState(finalEventState, after);
  const report: TurnReport = {
    periodIndex: state.periodIndex,
    year: state.year,
    periodLabel: getPeriodLabel(state),
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
      outlook: outlook - state.outlook,
    },
  };

  return {
    ...finalEventState,
    phase: outcome === "active" ? "report" : "finished",
    outcome,
    report,
  };
}

function getOutcomeForState(
  state: GameState,
  supply = getSupplySummary(state),
): GameOutcomeStatus {
  if (hasVisibleMetric(state, "peopleSupport") && supply.peopleSupport <= 0) {
    return "lost";
  }
  if (
    hasVisibleMetric(state, "politicalSupport") &&
    supply.politicalSupport <= 0
  ) {
    return "lost";
  }
  if (state.periodIndex < CAMPAIGN_PERIODS.length - 1) return "active";

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

  const nextPeriodIndex = state.periodIndex + 1;
  const nextPeriod = CAMPAIGN_PERIODS[nextPeriodIndex];
  if (!nextPeriod) {
    return { ...state, phase: "finished", outcome: getOutcomeForState(state) };
  }

  return {
    ...state,
    periodIndex: nextPeriodIndex,
    year: nextPeriod.year,
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
    builtSiteIds: [...initialGameState.builtSiteIds],
    selectedActionIds: [...initialGameState.selectedActionIds],
    completedTutorialIds: [...initialGameState.completedTutorialIds],
    projects: [...initialGameState.projects],
    support: { ...initialGameState.support },
    infrastructure: { ...initialGameState.infrastructure },
  };
}

export function completeTutorialStep(
  state: GameState,
  tutorialId: string,
): GameState {
  if (state.completedTutorialIds.includes(tutorialId)) return state;
  return {
    ...state,
    completedTutorialIds: [...state.completedTutorialIds, tutorialId],
  };
}

export function selectSite(state: GameState, siteId: string): GameState {
  const selectableSiteIds = new Set(
    getSelectableSites(state).map((site) => site.id),
  );
  if (!selectableSiteIds.has(siteId)) return state;
  return { ...state, selectedSiteId: siteId };
}

export function formatBudget(value: number): string {
  return `$${value.toFixed(0)}B`;
}

export function getCurrentPeriodLabel(state: GameState): string {
  return getPeriodLabel(state);
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
  return getSelectableSites(state).filter((site) => !built.has(site.id));
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
      description: "Keep planning period capacity until 2030.",
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
