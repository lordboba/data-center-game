import {
  DATA_CENTER_SITES,
  DataCenterSite,
  DEFAULT_GAME_MODE_ID,
  GameMode,
  GameModeId,
  GAME_MODES,
  MIN_DEMAND_TO_WIN,
  MAX_BUILDS,
  REGION_TARGETS,
  START_YEAR,
  STARTING_BUDGET,
  WIN_SCORE,
} from "../data/gameData";

export type GameState = {
  turn: number;
  builtSiteIds: string[];
  selectedSiteId: string;
  missedPeriods: number;
  isFinished: boolean;
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

export type RunOutcome = {
  status: "won" | "lost" | "in-progress";
  title: string;
  description: string;
};

export const initialGameState: GameState = {
  turn: 1,
  builtSiteIds: [],
  selectedSiteId: DATA_CENTER_SITES[0].id,
  missedPeriods: 0,
  isFinished: false,
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

export function getGameMode(modeId: GameModeId): GameMode {
  return GAME_MODES.find((mode) => mode.id === modeId) ?? GAME_MODES[0];
}

export function getDefaultGameMode(): GameMode {
  return getGameMode(DEFAULT_GAME_MODE_ID);
}

export function findSite(siteId: string): DataCenterSite {
  const site = DATA_CENTER_SITES.find((candidate) => candidate.id === siteId);
  if (!site) {
    throw new Error(`Unknown data center site: ${siteId}`);
  }
  return site;
}

export function getBuiltSites(state: GameState): DataCenterSite[] {
  return state.builtSiteIds.map(findSite);
}

export function calculateScore(siteIds: string[], missedPeriods = 0): ScoreBreakdown {
  const sites = siteIds.map(findSite);
  const budgetSpent = sites.reduce((sum, site) => sum + site.capex, 0);
  const budgetRemaining = STARTING_BUDGET - budgetSpent;
  const capacity = sites.reduce((sum, site) => sum + site.capacity, 0);
  const avg = (key: keyof Pick<
    DataCenterSite,
    "latency" | "cleanPower" | "waterSecurity" | "climateResilience" | "operatingMargin"
  >) => {
    if (sites.length === 0) return 0;
    return Math.round(sites.reduce((sum, site) => sum + Number(site[key]), 0) / sites.length);
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
    Math.round((160 - avgWaterSecurity - avgClimateResilience) * 0.7) + missedPeriods * 7,
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
  const breakdown = calculateScore(state.builtSiteIds, state.missedPeriods);
  const built = new Set(state.builtSiteIds);
  return DATA_CENTER_SITES.filter(
    (site) => !built.has(site.id) && site.capex <= breakdown.budgetRemaining,
  );
}

export function canBuildSite(state: GameState, siteId: string): boolean {
  if (state.isFinished) return false;
  if (state.builtSiteIds.length >= MAX_BUILDS) return false;
  if (state.builtSiteIds.includes(siteId)) return false;
  const site = findSite(siteId);
  return site.capex <= calculateScore(state.builtSiteIds, state.missedPeriods).budgetRemaining;
}

export function buildSite(state: GameState, siteId: string, mode: GameMode): GameState {
  if (!canBuildSite(state, siteId)) {
    return state;
  }

  const builtSiteIds = [...state.builtSiteIds, siteId];
  const nextTurn = state.turn + 1;
  const nextState: GameState = {
    turn: nextTurn,
    builtSiteIds,
    selectedSiteId: siteId,
    missedPeriods: state.missedPeriods,
    isFinished: nextTurn > mode.maxPeriods || builtSiteIds.length >= MAX_BUILDS,
  };

  if (nextState.isFinished || getAffordableSites(nextState).length === 0) {
    return { ...nextState, isFinished: true };
  }

  return nextState;
}

export function selectNextCandidate(state: GameState): string {
  const affordable = getAffordableSites(state);
  return affordable[0]?.id ?? state.selectedSiteId;
}

export function advancePeriod(state: GameState, mode: GameMode): GameState {
  if (state.isFinished) return state;

  const nextState: GameState = {
    ...state,
    turn: state.turn + 1,
    missedPeriods: state.missedPeriods + 1,
  };

  if (nextState.turn > mode.maxPeriods || getAffordableSites(nextState).length === 0) {
    return { ...nextState, isFinished: true };
  }

  return nextState;
}

export function finishRun(state: GameState): GameState {
  return { ...state, isFinished: true };
}

export function restartRun(): GameState {
  return { ...initialGameState };
}

export function formatBudget(value: number): string {
  return `$${value.toFixed(0)}B`;
}

export function getCurrentPeriodLabel(state: GameState, mode: GameMode): string {
  const periodIndex = Math.min(state.turn - 1, mode.maxPeriods - 1);
  const monthOffset = periodIndex * mode.stepMonths;
  const year = START_YEAR + Math.floor(monthOffset / 12);
  const monthIndex = monthOffset % 12;

  if (mode.stepMonths === 3) {
    return `Q${Math.floor(monthIndex / 3) + 1} ${year}`;
  }

  return `${MONTH_LABELS[monthIndex]} ${year}`;
}

export function getRunOutcome(state: GameState): RunOutcome {
  if (!state.isFinished) {
    return {
      status: "in-progress",
      title: "Run in progress",
      description: "Keep building until the planning window closes.",
    };
  }

  const score = calculateScore(state.builtSiteIds, state.missedPeriods);
  const won = score.score >= WIN_SCORE && score.demandCoverage >= MIN_DEMAND_TO_WIN;

  if (won) {
    return {
      status: "won",
      title: "Network approved",
      description: `You cleared ${WIN_SCORE} points and ${MIN_DEMAND_TO_WIN}% demand coverage before the window closed.`,
    };
  }

  return {
      status: "lost",
      title: "Board rejected",
      description: `You need at least ${WIN_SCORE} points and ${MIN_DEMAND_TO_WIN}% demand coverage. Missed time windows also reduce the final score.`,
    };
}
