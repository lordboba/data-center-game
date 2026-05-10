export const MAX_BUILDS = 14;
export const STARTING_BUDGET = 120;
export const START_YEAR = 2022;
export const END_YEAR = 2030;
export const WIN_SCORE = 720;
export const MIN_DEMAND_TO_WIN = 88;

export type UnlockStage =
  | "siting"
  | "compute"
  | "infrastructure"
  | "public"
  | "politics"
  | "operations"
  | "monthly";

export type CampaignPeriod = {
  index: number;
  year: number;
  startMonth: number;
  endMonth: number;
  label: string;
  cadence: "quarterly" | "bimonthly" | "monthly";
  unlockStage: UnlockStage;
};

export type TutorialStep = {
  id: string;
  sequenceId: TutorialSequenceId;
  target: string;
  firstAvailablePeriod: number;
  title: string;
  body: string;
  nextLabel: string;
};

export type TutorialSequenceId =
  | "starter"
  | "colocation"
  | "campus-expansion"
  | "infrastructure"
  | "water-reuse"
  | "dry-cooling"
  | "public-support"
  | "politics"
  | "operations-cadence"
  | "monthly-pressure";

export type TutorialSequenceProgress = {
  stepIndex: number;
  stepCount: number;
};

export type ProgressionRule = {
  unlockStage: UnlockStage;
  label: string;
  startsAtPeriod: number;
  description: string;
};

export const UNLOCK_STAGE_ORDER: UnlockStage[] = [
  "siting",
  "compute",
  "infrastructure",
  "public",
  "politics",
  "operations",
  "monthly",
];

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

function periodLabel(year: number, startMonth: number, endMonth: number) {
  if (startMonth === endMonth) return `${MONTH_LABELS[startMonth - 1]} ${year}`;
  if (endMonth - startMonth === 2) {
    return `Q${Math.floor((startMonth - 1) / 3) + 1} ${year}`;
  }
  return `${MONTH_LABELS[startMonth - 1]}-${MONTH_LABELS[endMonth - 1]} ${year}`;
}

function unlockStageForPeriod(year: number, startMonth: number): UnlockStage {
  if (year === 2022 && startMonth === 1) return "siting";
  if (year === 2022) return "compute";
  if (year === 2023) return "infrastructure";
  if (year === 2024) return "public";
  if (year === 2025) return "politics";
  if (year >= 2030) return "monthly";
  return "operations";
}

function createCampaignPeriods(): CampaignPeriod[] {
  const periods: CampaignPeriod[] = [];

  for (let year = 2022; year <= 2025; year += 1) {
    for (let startMonth = 1; startMonth <= 10; startMonth += 3) {
      const endMonth = startMonth + 2;
      periods.push({
        index: periods.length,
        year,
        startMonth,
        endMonth,
        label: periodLabel(year, startMonth, endMonth),
        cadence: "quarterly",
        unlockStage: unlockStageForPeriod(year, startMonth),
      });
    }
  }

  for (let year = 2026; year <= 2029; year += 1) {
    for (let startMonth = 1; startMonth <= 11; startMonth += 2) {
      const endMonth = startMonth + 1;
      periods.push({
        index: periods.length,
        year,
        startMonth,
        endMonth,
        label: periodLabel(year, startMonth, endMonth),
        cadence: "bimonthly",
        unlockStage: unlockStageForPeriod(year, startMonth),
      });
    }
  }

  for (let month = 1; month <= 12; month += 1) {
    periods.push({
      index: periods.length,
      year: 2030,
      startMonth: month,
      endMonth: month,
      label: periodLabel(2030, month, month),
      cadence: "monthly",
      unlockStage: "monthly",
    });
  }

  return periods;
}

export const CAMPAIGN_PERIODS = createCampaignPeriods();

export const PROGRESSION_RULES: ProgressionRule[] = [
  {
    unlockStage: "siting",
    label: "Siting",
    startsAtPeriod: 0,
    description: "Pick an initial market and fund the first campus.",
  },
  {
    unlockStage: "compute",
    label: "Compute",
    startsAtPeriod: 1,
    description: "Track compute demand and use smaller capacity stopgaps.",
  },
  {
    unlockStage: "infrastructure",
    label: "Infrastructure",
    startsAtPeriod: 4,
    description: "Power, cooling, and water constraints become active.",
  },
  {
    unlockStage: "public",
    label: "Public support",
    startsAtPeriod: 8,
    description:
      "Community sentiment becomes visible and starts affecting cost.",
  },
  {
    unlockStage: "politics",
    label: "Politics",
    startsAtPeriod: 12,
    description: "Political support and permitting enter the planning surface.",
  },
  {
    unlockStage: "operations",
    label: "Operations",
    startsAtPeriod: 16,
    description: "The game shifts to two-month operating turns.",
  },
  {
    unlockStage: "monthly",
    label: "Monthly pressure",
    startsAtPeriod: 40,
    description: "2030 runs month by month against the final demand curve.",
  },
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "market",
    sequenceId: "starter",
    target: "market-map",
    firstAvailablePeriod: 0,
    title: "Choose the first market",
    body: "Your first job is siting. Pick a market before buying capacity; regional cards use the selected market.",
    nextLabel: "Next",
  },
  {
    id: "campus",
    sequenceId: "starter",
    target: "open-actions",
    firstAvailablePeriod: 0,
    title: "Fund the first campus",
    body: "Open the action panel. Early 2022 only asks you to farm the core resource: compute capacity, so start with one hyperscale campus.",
    nextLabel: "Next",
  },
  {
    id: "budget",
    sequenceId: "starter",
    target: "metric-budget",
    firstAvailablePeriod: 0,
    title: "Watch budget",
    body: "Every period has a smaller budget slice. Strong outlook adds room next turn; weak management raises prices.",
    nextLabel: "Next",
  },
  {
    id: "compute",
    sequenceId: "starter",
    target: "metric-compute",
    firstAvailablePeriod: 0,
    title: "Track compute",
    body: "Compute coverage is the first demand statistic. Falling behind makes later capacity more expensive.",
    nextLabel: "Next",
  },
  {
    id: "run",
    sequenceId: "starter",
    target: "run-plan",
    firstAvailablePeriod: 0,
    title: "Advance the turn",
    body: "Run the plan to complete ready projects, read the report, and move to the next period.",
    nextLabel: "Next",
  },
  {
    id: "report",
    sequenceId: "starter",
    target: "turn-report",
    firstAvailablePeriod: 0,
    title: "Read the report",
    body: "Reports explain what improved, what slipped, and which bottleneck should guide the next purchase.",
    nextLabel: "Next",
  },
  {
    id: "colocation",
    sequenceId: "colocation",
    target: "action-lease-colocation",
    firstAvailablePeriod: 1,
    title: "Lease colocation",
    body: "Colocation is instant national capacity. It helps cover a near-term compute gap, but it consumes power and cooling headroom without creating a durable market footprint.",
    nextLabel: "Got it",
  },
  {
    id: "campus-expansion",
    sequenceId: "campus-expansion",
    target: "action-expand-campus",
    firstAvailablePeriod: 2,
    title: "Expand an existing campus",
    body: "Expansion is cheaper and faster than a new campus, but only works in a market where a hyperscale campus has already come online.",
    nextLabel: "Got it",
  },
  {
    id: "infrastructure",
    sequenceId: "infrastructure",
    target: "metric-power",
    firstAvailablePeriod: 4,
    title: "Power unlocks the next layer",
    body: "From 2023, compute is not enough. Power coverage starts affecting cost and can block compute expansion if it falls too low.",
    nextLabel: "Next",
  },
  {
    id: "power-projects",
    sequenceId: "infrastructure",
    target: "action-renewables-ppa",
    firstAvailablePeriod: 4,
    title: "Choose power strategy",
    body: "PPAs improve cleaner supply and support. Gas is faster but dirtier. Grid interconnects improve deliverable power without adding compute by themselves.",
    nextLabel: "Got it",
  },
  {
    id: "water-reuse",
    sequenceId: "water-reuse",
    target: "action-water-recycling",
    firstAvailablePeriod: 6,
    title: "Protect water resilience",
    body: "Water recycling does not add compute, but it protects local legitimacy and reduces the risk that future permits become fragile.",
    nextLabel: "Got it",
  },
  {
    id: "dry-cooling",
    sequenceId: "dry-cooling",
    target: "action-dry-cooling",
    firstAvailablePeriod: 7,
    title: "Manage cooling separately",
    body: "Dry cooling adds thermal capacity and reduces water pressure, but it consumes extra power headroom.",
    nextLabel: "Got it",
  },
  {
    id: "support",
    sequenceId: "public-support",
    target: "metric-support",
    firstAvailablePeriod: 8,
    title: "Public support matters",
    body: "In 2024, communities notice the buildout. If support drops too low, projects get costly and fragile.",
    nextLabel: "Next",
  },
  {
    id: "community-benefits",
    sequenceId: "public-support",
    target: "action-community-benefits",
    firstAvailablePeriod: 8,
    title: "Buy legitimacy before it breaks",
    body: "Community benefits consume budget without adding capacity, but they can keep site-required work from being blocked by public opposition.",
    nextLabel: "Got it",
  },
  {
    id: "politics",
    sequenceId: "politics",
    target: "metric-politics",
    firstAvailablePeriod: 12,
    title: "Politics arrives later",
    body: "By 2025, policy and permitting become explicit. Support can now block expansion if ignored.",
    nextLabel: "Next",
  },
  {
    id: "permitting",
    sequenceId: "politics",
    target: "action-fast-track-permitting",
    firstAvailablePeriod: 12,
    title: "Permitting trades speed for backlash",
    body: "Fast-track permitting boosts political and regulator support, but rushed approvals can damage public and environmental support.",
    nextLabel: "Got it",
  },
  {
    id: "operations-cadence",
    sequenceId: "operations-cadence",
    target: "metric-year",
    firstAvailablePeriod: 16,
    title: "The campaign speeds up",
    body: "From 2026, turns run every two months. Queued projects still complete by period, so timing matters more than annual planning.",
    nextLabel: "Got it",
  },
  {
    id: "monthly-pressure",
    sequenceId: "monthly-pressure",
    target: "run-plan",
    firstAvailablePeriod: 40,
    title: "Final monthly pressure",
    body: "In 2030, every month checks the final demand curve. The win condition now depends on capacity, support, and the score threshold holding together.",
    nextLabel: "Done",
  },
];

export function getTutorialSequenceProgress(
  tutorialId: string | undefined,
): TutorialSequenceProgress {
  if (!tutorialId) {
    return { stepIndex: 0, stepCount: 0 };
  }

  const activeStep = TUTORIAL_STEPS.find((step) => step.id === tutorialId);
  if (!activeStep) {
    throw new Error(`Unknown tutorial step id: ${tutorialId}`);
  }

  const sequenceSteps = TUTORIAL_STEPS.filter(
    (step) => step.sequenceId === activeStep.sequenceId,
  );
  const stepIndex = sequenceSteps.findIndex((step) => step.id === tutorialId);
  if (stepIndex === -1) {
    throw new Error(
      `Tutorial step ${tutorialId} is missing from its sequence.`,
    );
  }

  return {
    stepIndex,
    stepCount: sequenceSteps.length,
  };
}

export type GameModeId = "monthly" | "quarterly";

export type GameMode = {
  id: GameModeId;
  label: string;
  shortLabel: string;
  stepMonths: number;
  maxPeriods: number;
  secondsPerPeriod: number;
  description: string;
};

export const GAME_MODES: GameMode[] = [
  {
    id: "quarterly",
    label: "Quarterly sprint",
    shortLabel: "Quarter",
    stepMonths: 3,
    maxPeriods: 8,
    secondsPerPeriod: 45,
    description:
      "Advance one quarter at a time across a two-year planning window.",
  },
  {
    id: "monthly",
    label: "Monthly sprint",
    shortLabel: "Month",
    stepMonths: 1,
    maxPeriods: 12,
    secondsPerPeriod: 20,
    description:
      "Advance one month at a time across one compressed build year.",
  },
];

export const DEFAULT_GAME_MODE_ID: GameModeId = "quarterly";

export type Region = "East" | "South" | "Midwest" | "Mountain" | "West";

export type DataCenterSite = {
  id: string;
  metro: string;
  state: string;
  stateFips: string;
  region: Region;
  firstAvailablePeriod: number;
  latitude: number;
  longitude: number;
  capex: number;
  capacity: number;
  latency: number;
  cleanPower: number;
  waterSecurity: number;
  climateResilience: number;
  operatingMargin: number;
  note: string;
};

export const DATA_CENTER_SITES: DataCenterSite[] = [
  {
    id: "ashburn-va",
    metro: "Ashburn",
    state: "Virginia",
    stateFips: "51",
    region: "East",
    firstAvailablePeriod: 0,
    latitude: 39.0437,
    longitude: -77.4875,
    capex: 24,
    capacity: 38,
    latency: 98,
    cleanPower: 58,
    waterSecurity: 68,
    climateResilience: 72,
    operatingMargin: 88,
    note: "The deepest network market, but expensive and grid constrained.",
  },
  {
    id: "dallas-tx",
    metro: "Dallas",
    state: "Texas",
    stateFips: "48",
    region: "South",
    firstAvailablePeriod: 0,
    latitude: 32.7767,
    longitude: -96.797,
    capex: 18,
    capacity: 34,
    latency: 88,
    cleanPower: 70,
    waterSecurity: 60,
    climateResilience: 63,
    operatingMargin: 86,
    note: "Central latency and power optionality with heat and storm risk.",
  },
  {
    id: "hillsboro-or",
    metro: "Hillsboro",
    state: "Oregon",
    stateFips: "41",
    region: "West",
    firstAvailablePeriod: 0,
    latitude: 45.5229,
    longitude: -122.9898,
    capex: 17,
    capacity: 29,
    latency: 78,
    cleanPower: 93,
    waterSecurity: 82,
    climateResilience: 76,
    operatingMargin: 78,
    note: "Clean power and cool climate, farther from East Coast demand.",
  },
  {
    id: "chicago-il",
    metro: "Chicago",
    state: "Illinois",
    stateFips: "17",
    region: "Midwest",
    firstAvailablePeriod: 1,
    latitude: 41.8781,
    longitude: -87.6298,
    capex: 19,
    capacity: 31,
    latency: 91,
    cleanPower: 66,
    waterSecurity: 88,
    climateResilience: 80,
    operatingMargin: 80,
    note: "Excellent central peering with strong water access.",
  },
  {
    id: "phoenix-az",
    metro: "Phoenix",
    state: "Arizona",
    stateFips: "04",
    region: "Mountain",
    firstAvailablePeriod: 2,
    latitude: 33.4484,
    longitude: -112.074,
    capex: 15,
    capacity: 30,
    latency: 76,
    cleanPower: 88,
    waterSecurity: 38,
    climateResilience: 44,
    operatingMargin: 84,
    note: "Solar upside and land availability, but water and heat bite hard.",
  },
  {
    id: "atlanta-ga",
    metro: "Atlanta",
    state: "Georgia",
    stateFips: "13",
    region: "South",
    firstAvailablePeriod: 3,
    latitude: 33.749,
    longitude: -84.388,
    capex: 16,
    capacity: 27,
    latency: 87,
    cleanPower: 61,
    waterSecurity: 70,
    climateResilience: 66,
    operatingMargin: 83,
    note: "Southeast demand coverage with balanced operating costs.",
  },
  {
    id: "columbus-oh",
    metro: "Columbus",
    state: "Ohio",
    stateFips: "39",
    region: "Midwest",
    firstAvailablePeriod: 4,
    latitude: 39.9612,
    longitude: -82.9988,
    capex: 14,
    capacity: 25,
    latency: 83,
    cleanPower: 63,
    waterSecurity: 84,
    climateResilience: 82,
    operatingMargin: 82,
    note: "Efficient Midwest expansion with good resilience per dollar.",
  },
  {
    id: "des-moines-ia",
    metro: "Des Moines",
    state: "Iowa",
    stateFips: "19",
    region: "Midwest",
    firstAvailablePeriod: 5,
    latitude: 41.5868,
    longitude: -93.625,
    capex: 13,
    capacity: 24,
    latency: 72,
    cleanPower: 95,
    waterSecurity: 86,
    climateResilience: 78,
    operatingMargin: 76,
    note: "Wind-heavy power and low cost, with weaker coastal latency.",
  },
  {
    id: "secaucus-nj",
    metro: "Secaucus",
    state: "New Jersey",
    stateFips: "34",
    region: "East",
    firstAvailablePeriod: 6,
    latitude: 40.7895,
    longitude: -74.0565,
    capex: 23,
    capacity: 28,
    latency: 96,
    cleanPower: 55,
    waterSecurity: 74,
    climateResilience: 62,
    operatingMargin: 73,
    note: "Premium New York metro reach with coastal and cost pressure.",
  },
  {
    id: "reno-nv",
    metro: "Reno",
    state: "Nevada",
    stateFips: "32",
    region: "West",
    firstAvailablePeriod: 8,
    latitude: 39.5296,
    longitude: -119.8138,
    capex: 14,
    capacity: 23,
    latency: 70,
    cleanPower: 82,
    waterSecurity: 52,
    climateResilience: 64,
    operatingMargin: 81,
    note: "Western expansion with tax and land upside, limited water cushion.",
  },
  {
    id: "salt-lake-city-ut",
    metro: "Salt Lake City",
    state: "Utah",
    stateFips: "49",
    region: "Mountain",
    firstAvailablePeriod: 9,
    latitude: 40.7608,
    longitude: -111.891,
    capex: 15,
    capacity: 26,
    latency: 77,
    cleanPower: 72,
    waterSecurity: 50,
    climateResilience: 68,
    operatingMargin: 82,
    note: "Mountain West coverage with moderate power and drought exposure.",
  },
  {
    id: "raleigh-nc",
    metro: "Raleigh",
    state: "North Carolina",
    stateFips: "37",
    region: "South",
    firstAvailablePeriod: 10,
    latitude: 35.7796,
    longitude: -78.6382,
    capex: 15,
    capacity: 24,
    latency: 84,
    cleanPower: 67,
    waterSecurity: 76,
    climateResilience: 70,
    operatingMargin: 80,
    note: "Research Triangle demand with dependable regional economics.",
  },
  {
    id: "quincy-wa",
    metro: "Quincy",
    state: "Washington",
    stateFips: "53",
    region: "West",
    firstAvailablePeriod: 12,
    latitude: 47.2343,
    longitude: -119.8526,
    capex: 16,
    capacity: 27,
    latency: 68,
    cleanPower: 96,
    waterSecurity: 80,
    climateResilience: 78,
    operatingMargin: 79,
    note: "Hydro-backed capacity with lower national latency coverage.",
  },
  {
    id: "omaha-ne",
    metro: "Omaha",
    state: "Nebraska",
    stateFips: "31",
    region: "Midwest",
    firstAvailablePeriod: 14,
    latitude: 41.2565,
    longitude: -95.9345,
    capex: 12,
    capacity: 22,
    latency: 73,
    cleanPower: 78,
    waterSecurity: 84,
    climateResilience: 80,
    operatingMargin: 79,
    note: "A budget stabilizer with central routing and strong resilience.",
  },
];

export const INITIAL_SITE_IDS = DATA_CENTER_SITES.filter(
  (site) => site.firstAvailablePeriod === 0,
).map((site) => site.id);

export const METRIC_FIRST_AVAILABLE_PERIODS = {
  power: 4,
  water: 6,
  cooling: 7,
  peopleSupport: 8,
  politicalSupport: 12,
} as const;

export const REGION_TARGETS: Record<Region, number> = {
  East: 30,
  South: 28,
  Midwest: 22,
  Mountain: 8,
  West: 12,
};

export type ActionCategory =
  | "compute"
  | "power"
  | "cooling"
  | "water"
  | "politics"
  | "permitting"
  | "efficiency";

export type ActionEffects = {
  computeH100e?: number;
  powerMW?: number;
  coolingMW?: number;
  waterMLDay?: number;
  peopleSupport?: number;
  politicalSupport?: number;
  environmentalSupport?: number;
  laborSupport?: number;
  regulatorSupport?: number;
  businessSupport?: number;
  emissionsIndex?: number;
};

export type SiteRequirement = "none" | "available-site" | "built-site";

export type ActionCard = {
  id: string;
  title: string;
  shortTitle: string;
  category: ActionCategory;
  cost: number;
  unlockStage: UnlockStage;
  firstAvailablePeriod: number;
  durationMonths: number;
  siteRequirement: SiteRequirement;
  effects: ActionEffects;
  benefitText: string;
  riskText: string;
  flavorText: string;
};

export const ANNUAL_BUDGETS: Record<number, number> = {
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

export const DEMAND_CURVE = [
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

export const ACTION_CARDS: ActionCard[] = [
  {
    id: "hyperscale-campus",
    title: "Build Hyperscale Campus",
    shortTitle: "Hyperscale",
    category: "compute",
    cost: 5,
    unlockStage: "siting",
    firstAvailablePeriod: 0,
    durationMonths: 0,
    siteRequirement: "available-site",
    effects: {
      computeH100e: 4_800_000,
      coolingMW: 900,
      waterMLDay: -90,
      peopleSupport: -4,
      environmentalSupport: -3,
      businessSupport: 3,
    },
    benefitText: "+4.8M H100e and +900 MW cooling after construction.",
    riskText: "Raises local scrutiny and water pressure.",
    flavorText:
      "A large AI campus that turns the selected market into core capacity.",
  },
  {
    id: "expand-campus",
    title: "Expand Existing Campus",
    shortTitle: "Expansion",
    category: "compute",
    cost: 3,
    unlockStage: "compute",
    firstAvailablePeriod: 2,
    durationMonths: 3,
    siteRequirement: "built-site",
    effects: {
      computeH100e: 2_200_000,
      coolingMW: 420,
      waterMLDay: -36,
      peopleSupport: -2,
      businessSupport: 2,
    },
    benefitText: "+2.2M H100e using an existing selected-market footprint.",
    riskText: "Adds load before every utility upgrade catches up.",
    flavorText:
      "Denser halls, more substations, and a faster but noisier build.",
  },
  {
    id: "lease-colocation",
    title: "Lease Colocation Capacity",
    shortTitle: "Colocation",
    category: "compute",
    cost: 2,
    unlockStage: "compute",
    firstAvailablePeriod: 1,
    durationMonths: 0,
    siteRequirement: "none",
    effects: {
      computeH100e: 700_000,
      powerMW: -80,
      coolingMW: -24,
      businessSupport: 1,
    },
    benefitText: "+700K H100e immediately.",
    riskText:
      "Expensive stopgap capacity that consumes hidden power and cooling.",
    flavorText: "Lease available cages while the larger build catches up.",
  },
  {
    id: "fast-gas-capacity",
    title: "Build Fast Gas Capacity",
    shortTitle: "Gas Power",
    category: "power",
    cost: 4,
    unlockStage: "infrastructure",
    firstAvailablePeriod: 5,
    durationMonths: 4,
    siteRequirement: "available-site",
    effects: {
      powerMW: 8_500,
      politicalSupport: 2,
      peopleSupport: -4,
      environmentalSupport: -8,
      emissionsIndex: 12,
    },
    benefitText: "+8.5 GW dispatchable power.",
    riskText: "Higher emissions and local opposition.",
    flavorText: "Fast reliability at a real legitimacy cost.",
  },
  {
    id: "renewables-ppa",
    title: "Sign Renewables PPA",
    shortTitle: "PPA",
    category: "power",
    cost: 3,
    unlockStage: "infrastructure",
    firstAvailablePeriod: 4,
    durationMonths: 4,
    siteRequirement: "none",
    effects: {
      powerMW: 4_800,
      environmentalSupport: 5,
      peopleSupport: 1,
      emissionsIndex: -6,
    },
    benefitText: "+4.8 GW cleaner contracted power.",
    riskText: "Slower than gas and still needs interconnection capacity.",
    flavorText: "Long-term clean supply with less community backlash.",
  },
  {
    id: "grid-interconnect",
    title: "Build Grid Interconnect",
    shortTitle: "Interconnect",
    category: "power",
    cost: 4,
    unlockStage: "infrastructure",
    firstAvailablePeriod: 5,
    durationMonths: 4,
    siteRequirement: "available-site",
    effects: {
      powerMW: 6_200,
      regulatorSupport: 3,
      politicalSupport: 1,
    },
    benefitText: "+6.2 GW deliverable power and better regulator confidence.",
    riskText: "Uses budget without adding compute by itself.",
    flavorText: "Transmission, switching gear, and queue discipline.",
  },
  {
    id: "water-recycling",
    title: "Add Water Recycling",
    shortTitle: "Water Reuse",
    category: "water",
    cost: 3,
    unlockStage: "infrastructure",
    firstAvailablePeriod: 6,
    durationMonths: 0,
    siteRequirement: "available-site",
    effects: {
      waterMLDay: 1_900,
      peopleSupport: 2,
      environmentalSupport: 5,
      regulatorSupport: 2,
    },
    benefitText: "+1,900 ML/day water resilience.",
    riskText: "Does not solve compute or power pressure.",
    flavorText:
      "Reuse loops and public commitments that make permits less fragile.",
  },
  {
    id: "dry-cooling",
    title: "Add Dry Cooling",
    shortTitle: "Dry Cooling",
    category: "cooling",
    cost: 3,
    unlockStage: "infrastructure",
    firstAvailablePeriod: 7,
    durationMonths: 0,
    siteRequirement: "available-site",
    effects: {
      coolingMW: 3_600,
      waterMLDay: 900,
      powerMW: -450,
      environmentalSupport: 3,
    },
    benefitText: "+3.6 GW cooling and lower water exposure.",
    riskText: "Consumes additional power headroom.",
    flavorText: "More air-side cooling, less evaporative dependence.",
  },
  {
    id: "community-benefits",
    title: "Community Benefits Package",
    shortTitle: "Benefits",
    category: "politics",
    cost: 2,
    unlockStage: "public",
    firstAvailablePeriod: 8,
    durationMonths: 0,
    siteRequirement: "available-site",
    effects: {
      peopleSupport: 8,
      laborSupport: 4,
      politicalSupport: 2,
    },
    benefitText: "+8 people support and stronger labor backing.",
    riskText: "Consumes budget without adding capacity.",
    flavorText: "Jobs, grants, tax-sharing, and visible concessions.",
  },
  {
    id: "fast-track-permitting",
    title: "Fast-Track Permitting",
    shortTitle: "Permitting",
    category: "permitting",
    cost: 2,
    unlockStage: "politics",
    firstAvailablePeriod: 12,
    durationMonths: 0,
    siteRequirement: "available-site",
    effects: {
      politicalSupport: 5,
      regulatorSupport: 4,
      peopleSupport: -2,
      environmentalSupport: -2,
    },
    benefitText: "+5 political support and +4 regulator support.",
    riskText: "Public groups dislike rushed approvals.",
    flavorText: "Executive pressure, staff capacity, and procedural shortcuts.",
  },
];
