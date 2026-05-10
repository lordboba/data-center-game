export const MAX_BUILDS = 6;
export const STARTING_BUDGET = 120;
export const START_YEAR = 2026;
export const WIN_SCORE = 720;
export const MIN_DEMAND_TO_WIN = 88;

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
    description: "Advance one quarter at a time across a two-year planning window.",
  },
  {
    id: "monthly",
    label: "Monthly sprint",
    shortLabel: "Month",
    stepMonths: 1,
    maxPeriods: 12,
    secondsPerPeriod: 20,
    description: "Advance one month at a time across one compressed build year.",
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

export const REGION_TARGETS: Record<Region, number> = {
  East: 30,
  South: 28,
  Midwest: 22,
  Mountain: 8,
  West: 12,
};
