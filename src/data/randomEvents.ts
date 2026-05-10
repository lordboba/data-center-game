import type { ActionEffects } from "./gameData";

export type EventFamily =
  | "public-media"
  | "community-legal"
  | "market-finance"
  | "vendor-competitor"
  | "grid-utility"
  | "climate-weather"
  | "labor-supply"
  | "security-operations"
  | "technology"
  | "geopolitics";

export type EventSeverity = "low" | "medium" | "high";

export type EventRiskMetric =
  | "peopleSupport"
  | "politicalSupport"
  | "powerCoverage"
  | "coolingCoverage"
  | "waterCoverage"
  | "computeCoverage"
  | "outlook"
  | "emissionsIndex"
  | "builtUnits"
  | "laborSupport"
  | "regulatorSupport"
  | "businessSupport";

export type EventRiskRule = {
  metric: EventRiskMetric;
  direction: "below" | "above";
  mediumAt: number;
  highAt: number;
};

export type EventModifierTemplate = {
  label: string;
  description: string;
  durationPeriods: number;
  costMultiplier: number;
};

export type RandomEventEffects = ActionEffects & {
  outlook?: number;
  budgetBalance?: number;
  eventCooldownPeriods?: number;
  modifiers?: EventModifierTemplate[];
};

export type RandomEventOutcome = {
  id: string;
  summary: string;
  weightBySeverity: Record<EventSeverity, number>;
  effects: RandomEventEffects;
};

export type RandomEventChoice = {
  id: string;
  label: string;
  body: string;
  outcomes: RandomEventOutcome[];
};

export type RandomEventDefinition = {
  id: string;
  family: EventFamily;
  title: string;
  promptTemplate: string;
  baseWeight: number;
  firstAvailablePeriod: number;
  minBuiltUnits?: number;
  cooldownPeriods?: number;
  risk?: EventRiskRule;
  choices: RandomEventChoice[];
};

const favorableWeights = { low: 68, medium: 52, high: 34 };
const mixedWeights = { low: 26, medium: 32, high: 34 };
const adverseWeights = { low: 6, medium: 16, high: 32 };

function outcome(
  id: string,
  summary: string,
  weightBySeverity: Record<EventSeverity, number>,
  effects: RandomEventEffects,
): RandomEventOutcome {
  return { id, summary, weightBySeverity, effects };
}

function publicResponseChoices(topic: string): RandomEventChoice[] {
  return [
    {
      id: "engage",
      label: "Engage publicly",
      body: "Fund a transparent response, local briefings, and independent experts.",
      outcomes: [
        outcome(
          "trust-recovers",
          `${topic} becomes a chance to show discipline; trust improves.`,
          favorableWeights,
          {
            peopleSupport: 5,
            politicalSupport: 2,
            regulatorSupport: 2,
            outlook: 2,
          },
        ),
        outcome(
          "message-muted",
          `${topic} fades, but only after consuming leadership attention.`,
          mixedWeights,
          { peopleSupport: 1, budgetBalance: -1 },
        ),
        outcome(
          "message-backfires",
          `${topic} spreads beyond the original audience and hardens opposition.`,
          adverseWeights,
          { peopleSupport: -7, politicalSupport: -3, outlook: -3 },
        ),
      ],
    },
    {
      id: "ignore",
      label: "Stay quiet",
      body: "Avoid amplifying the story and keep execution focused.",
      outcomes: [
        outcome(
          "quiet-cycle",
          `${topic} burns out without changing the coalition.`,
          { low: 48, medium: 30, high: 16 },
          { outlook: 1 },
        ),
        outcome(
          "vacuum-filled",
          `Critics fill the vacuum around ${topic}; the next permit fight gets harder.`,
          { low: 22, medium: 38, high: 48 },
          { peopleSupport: -5, regulatorSupport: -2, outlook: -2 },
        ),
      ],
    },
  ];
}

function communityResponseChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "settle",
      label: "Negotiate concessions",
      body: "Use budget to settle the immediate local dispute.",
      outcomes: [
        outcome(
          "durable-compact",
          `${issue} turns into a signed local compact with enforceable benefits.`,
          favorableWeights,
          {
            peopleSupport: 6,
            laborSupport: 3,
            politicalSupport: 2,
            budgetBalance: -1,
          },
        ),
        outcome(
          "expensive-peace",
          `${issue} quiets down, but the settlement is expensive.`,
          mixedWeights,
          { peopleSupport: 3, budgetBalance: -2 },
        ),
        outcome(
          "moving-target",
          `${issue} keeps moving as new groups demand the same concessions.`,
          adverseWeights,
          { peopleSupport: -4, politicalSupport: -3, budgetBalance: -2 },
        ),
      ],
    },
    {
      id: "litigate",
      label: "Fight it",
      body: "Preserve budget and challenge the complaint on process.",
      outcomes: [
        outcome(
          "challenge-dismissed",
          `${issue} is narrowed by the record and loses force.`,
          { low: 54, medium: 36, high: 20 },
          { regulatorSupport: 2, outlook: 1 },
        ),
        outcome(
          "legal-delay",
          `${issue} delays the calendar and damages local permission.`,
          { low: 18, medium: 34, high: 48 },
          {
            peopleSupport: -6,
            politicalSupport: -4,
            modifiers: [
              {
                label: "Legal overhang",
                description: "Counsel, filing risk, and local review add cost.",
                durationPeriods: 3,
                costMultiplier: 1.06,
              },
            ],
          },
        ),
      ],
    },
  ];
}

function financeChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "protect-balance-sheet",
      label: "Protect liquidity",
      body: "Slow discretionary spend and preserve budget flexibility.",
      outcomes: [
        outcome(
          "credit-discipline",
          `${issue} is handled with credible discipline; investors stay patient.`,
          favorableWeights,
          { businessSupport: 4, outlook: 2, budgetBalance: 1 },
        ),
        outcome(
          "underbuilt-pipeline",
          `${issue} protects cash but leaves the buildout looking timid.`,
          mixedWeights,
          { businessSupport: -2, outlook: -2 },
        ),
        outcome(
          "market-doubts",
          `${issue} becomes a signal that the campaign is underfunded.`,
          adverseWeights,
          {
            businessSupport: -6,
            politicalSupport: -2,
            budgetBalance: -2,
            outlook: -4,
          },
        ),
      ],
    },
    {
      id: "raise-capital",
      label: "Raise capital",
      body: "Accept higher financing cost to keep the buildout moving.",
      outcomes: [
        outcome(
          "oversubscribed",
          `${issue} draws new capital and gives the next period more room.`,
          { low: 46, medium: 38, high: 24 },
          { businessSupport: 5, budgetBalance: 3, outlook: 2 },
        ),
        outcome(
          "expensive-money",
          `Capital arrives for ${issue}, but every project carries a financing premium.`,
          { low: 26, medium: 34, high: 44 },
          {
            budgetBalance: 1,
            modifiers: [
              {
                label: "Expensive capital",
                description:
                  "Debt and equity providers demand a higher return.",
                durationPeriods: 4,
                costMultiplier: 1.08,
              },
            ],
          },
        ),
      ],
    },
  ];
}

function vendorChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "partner",
      label: "Take the deal",
      body: "Use the vendor offer to buy time.",
      outcomes: [
        outcome(
          "vendor-bridge",
          `${issue} gives the campaign a useful bridge without losing control.`,
          favorableWeights,
          {
            computeH100e: 650_000,
            businessSupport: 4,
            budgetBalance: 1,
            outlook: 2,
          },
        ),
        outcome(
          "strings-attached",
          `${issue} helps now, but creates dependency and pricing pressure later.`,
          mixedWeights,
          {
            computeH100e: 420_000,
            businessSupport: 1,
            modifiers: [
              {
                label: "Vendor leverage",
                description:
                  "A major supplier has pricing power over follow-on work.",
                durationPeriods: 3,
                costMultiplier: 1.05,
              },
            ],
          },
        ),
        outcome(
          "vendor-headline",
          `${issue} is framed as a bailout and weakens the coalition.`,
          adverseWeights,
          {
            peopleSupport: -4,
            politicalSupport: -3,
            businessSupport: -3,
            outlook: -3,
          },
        ),
      ],
    },
    {
      id: "stay-independent",
      label: "Stay independent",
      body: "Reject the offer and keep the operating model clean.",
      outcomes: [
        outcome(
          "clean-position",
          `Rejecting ${issue} strengthens confidence in the plan.`,
          { low: 42, medium: 34, high: 24 },
          { businessSupport: 2, politicalSupport: 2, outlook: 1 },
        ),
        outcome(
          "missed-bridge",
          `Passing on ${issue} leaves the near-term compute gap exposed.`,
          { low: 20, medium: 32, high: 46 },
          { computeH100e: -120_000, businessSupport: -3, outlook: -2 },
        ),
      ],
    },
  ];
}

function utilityChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "pay-for-certainty",
      label: "Pay for certainty",
      body: "Spend budget to secure engineering, reserves, and queue priority.",
      outcomes: [
        outcome(
          "utility-aligned",
          `${issue} is contained through better utility coordination.`,
          favorableWeights,
          {
            powerMW: 650,
            regulatorSupport: 4,
            politicalSupport: 2,
            budgetBalance: -1,
          },
        ),
        outcome(
          "partial-relief",
          `${issue} improves, but the utility still demands costly upgrades.`,
          mixedWeights,
          { powerMW: 250, regulatorSupport: 1, budgetBalance: -2 },
        ),
        outcome(
          "ratepayer-backlash",
          `${issue} spills into ratepayer politics.`,
          adverseWeights,
          {
            peopleSupport: -5,
            politicalSupport: -5,
            regulatorSupport: -3,
            outlook: -3,
          },
        ),
      ],
    },
    {
      id: "wait-for-queue",
      label: "Wait for process",
      body: "Avoid special treatment and ride the standard utility process.",
      outcomes: [
        outcome(
          "queue-clears",
          `${issue} clears without extra spend.`,
          { low: 46, medium: 28, high: 14 },
          { regulatorSupport: 2, budgetBalance: 1 },
        ),
        outcome(
          "queue-stalls",
          `${issue} stalls, raising costs for near-term capacity work.`,
          { low: 20, medium: 38, high: 54 },
          {
            powerMW: -250,
            outlook: -3,
            modifiers: [
              {
                label: "Grid congestion",
                description: "Interconnection work and grid studies add cost.",
                durationPeriods: 4,
                costMultiplier: 1.09,
              },
            ],
          },
        ),
      ],
    },
  ];
}

function climateChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "harden-sites",
      label: "Harden sites",
      body: "Spend on resilience and operating safeguards.",
      outcomes: [
        outcome(
          "resilience-proven",
          `${issue} proves the resilience program is real.`,
          favorableWeights,
          {
            coolingMW: 220,
            waterMLDay: 180,
            peopleSupport: 3,
            environmentalSupport: 2,
            outlook: 2,
          },
        ),
        outcome(
          "costly-hardening",
          `${issue} is managed, but hardening consumes budget.`,
          mixedWeights,
          { coolingMW: 120, waterMLDay: 80, budgetBalance: -2 },
        ),
        outcome(
          "visible-strain",
          `${issue} exposes operational strain despite the spend.`,
          adverseWeights,
          { coolingMW: -180, waterMLDay: -160, peopleSupport: -4, outlook: -3 },
        ),
      ],
    },
    {
      id: "operate-through",
      label: "Operate through it",
      body: "Keep capital focused on the buildout and accept operating risk.",
      outcomes: [
        outcome(
          "weather-passes",
          `${issue} passes with limited operational impact.`,
          { low: 44, medium: 28, high: 12 },
          { outlook: 1 },
        ),
        outcome(
          "operating-losses",
          `${issue} creates outages and local scrutiny.`,
          { low: 20, medium: 38, high: 58 },
          {
            coolingMW: -260,
            waterMLDay: -220,
            peopleSupport: -5,
            businessSupport: -3,
            outlook: -4,
          },
        ),
      ],
    },
  ];
}

function laborSupplyChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "secure-supply",
      label: "Secure supply",
      body: "Pay premiums for labor stability and critical equipment.",
      outcomes: [
        outcome(
          "pipeline-secured",
          `${issue} is contained before it hits the delivery calendar.`,
          favorableWeights,
          {
            laborSupport: 4,
            businessSupport: 2,
            outlook: 2,
            budgetBalance: -1,
          },
        ),
        outcome(
          "premium-paid",
          `${issue} is solved, but suppliers extract a premium.`,
          mixedWeights,
          {
            laborSupport: 2,
            modifiers: [
              {
                label: "Supply premium",
                description:
                  "Critical equipment and crews cost more than planned.",
                durationPeriods: 3,
                costMultiplier: 1.07,
              },
            ],
          },
        ),
        outcome(
          "supply-squeeze",
          `${issue} worsens even after paying premiums.`,
          adverseWeights,
          {
            laborSupport: -3,
            businessSupport: -4,
            outlook: -4,
            budgetBalance: -2,
          },
        ),
      ],
    },
    {
      id: "hold-line",
      label: "Hold the line",
      body: "Refuse premiums and keep procurement discipline.",
      outcomes: [
        outcome(
          "discipline-rewarded",
          `${issue} resolves without breaking procurement discipline.`,
          { low: 42, medium: 28, high: 16 },
          { businessSupport: 3, budgetBalance: 1 },
        ),
        outcome(
          "missed-slots",
          `${issue} causes missed delivery slots and credibility loss.`,
          { low: 18, medium: 36, high: 54 },
          { laborSupport: -4, businessSupport: -4, outlook: -4 },
        ),
      ],
    },
  ];
}

function securityChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "full-remediation",
      label: "Full remediation",
      body: "Stop, disclose, audit, and fix the root cause.",
      outcomes: [
        outcome(
          "trustworthy-fix",
          `${issue} becomes evidence of operational maturity.`,
          favorableWeights,
          {
            regulatorSupport: 4,
            businessSupport: 3,
            politicalSupport: 2,
            budgetBalance: -1,
            outlook: 2,
          },
        ),
        outcome(
          "contained-incident",
          `${issue} is contained, but the audit is expensive.`,
          mixedWeights,
          { regulatorSupport: 2, budgetBalance: -2 },
        ),
        outcome(
          "audit-expands",
          `${issue} expands into a broader compliance review.`,
          adverseWeights,
          { regulatorSupport: -5, businessSupport: -4, outlook: -4 },
        ),
      ],
    },
    {
      id: "quiet-fix",
      label: "Quiet fix",
      body: "Patch quickly and avoid a public process.",
      outcomes: [
        outcome(
          "quietly-contained",
          `${issue} is fixed before anyone notices.`,
          { low: 50, medium: 28, high: 12 },
          { budgetBalance: 1 },
        ),
        outcome(
          "coverup-story",
          `${issue} leaks and the quiet fix looks like a coverup.`,
          { low: 18, medium: 40, high: 62 },
          {
            peopleSupport: -5,
            politicalSupport: -5,
            regulatorSupport: -6,
            outlook: -5,
          },
        ),
      ],
    },
  ];
}

function technologyChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "adopt",
      label: "Adopt quickly",
      body: "Move fast to capture the technical upside.",
      outcomes: [
        outcome(
          "technical-edge",
          `${issue} improves the buildout economics.`,
          favorableWeights,
          {
            computeH100e: 500_000,
            coolingMW: 180,
            powerMW: 180,
            businessSupport: 4,
            outlook: 3,
          },
        ),
        outcome(
          "integration-cost",
          `${issue} works, but integration is harder than promised.`,
          mixedWeights,
          { computeH100e: 240_000, budgetBalance: -1 },
        ),
        outcome(
          "immature-tech",
          `${issue} proves immature and distracts the operating team.`,
          adverseWeights,
          { businessSupport: -4, regulatorSupport: -2, outlook: -3 },
        ),
      ],
    },
    {
      id: "pilot",
      label: "Pilot first",
      body: "Run a limited deployment before committing the network.",
      outcomes: [
        outcome(
          "pilot-decision",
          `${issue} produces clean data and a safer rollout plan.`,
          { low: 44, medium: 38, high: 28 },
          { regulatorSupport: 2, businessSupport: 2, outlook: 2 },
        ),
        outcome(
          "too-slow",
          `A cautious pilot for ${issue} misses the market window.`,
          { low: 20, medium: 30, high: 42 },
          { computeH100e: -90_000, businessSupport: -2, outlook: -2 },
        ),
      ],
    },
  ];
}

function geopoliticalChoices(issue: string): RandomEventChoice[] {
  return [
    {
      id: "stockpile",
      label: "Stockpile and reroute",
      body: "Buy critical inventory and reroute commitments before markets tighten.",
      outcomes: [
        outcome(
          "buffer-built",
          `${issue} is painful but the buffer protects delivery.`,
          favorableWeights,
          {
            businessSupport: 3,
            budgetBalance: -1,
            modifiers: [
              {
                label: "Geopolitical inflation",
                description:
                  "Freight, equipment, and insurance premiums stay elevated.",
                durationPeriods: 4,
                costMultiplier: 1.06,
              },
            ],
          },
        ),
        outcome(
          "expensive-buffer",
          `${issue} forces costly inventory purchases.`,
          mixedWeights,
          {
            budgetBalance: -2,
            modifiers: [
              {
                label: "Geopolitical inflation",
                description:
                  "Freight, equipment, and insurance premiums stay elevated.",
                durationPeriods: 5,
                costMultiplier: 1.1,
              },
            ],
          },
        ),
        outcome(
          "supply-shock",
          `${issue} overwhelms the buffer and pushes prices higher.`,
          adverseWeights,
          {
            businessSupport: -5,
            politicalSupport: -3,
            outlook: -4,
            modifiers: [
              {
                label: "War inflation",
                description:
                  "A prolonged conflict keeps energy and equipment prices elevated.",
                durationPeriods: 8,
                costMultiplier: 1.16,
              },
            ],
          },
        ),
      ],
    },
    {
      id: "wait",
      label: "Wait it out",
      body: "Avoid panic buying and preserve budget.",
      outcomes: [
        outcome(
          "shock-fades",
          `${issue} de-escalates before it changes the build plan.`,
          { low: 40, medium: 24, high: 12 },
          { budgetBalance: 1, outlook: 1 },
        ),
        outcome(
          "prices-run",
          `${issue} persists and prices run away before procurement can react.`,
          { low: 24, medium: 42, high: 62 },
          {
            outlook: -4,
            modifiers: [
              {
                label: "War inflation",
                description:
                  "A prolonged conflict keeps energy and equipment prices elevated.",
                durationPeriods: 7,
                costMultiplier: 1.14,
              },
            ],
          },
        ),
      ],
    },
  ];
}

export const RANDOM_EVENTS: RandomEventDefinition[] = [
  {
    id: "ai-safety-podcast",
    family: "public-media",
    title: "AI safety podcast goes viral",
    promptTemplate:
      "A podcast on AI safety and dangers has gone viral, tying frontier models to the buildout in {location}.",
    baseWeight: 9,
    firstAvailablePeriod: 4,
    minBuiltUnits: 1,
    risk: {
      metric: "peopleSupport",
      direction: "below",
      mediumAt: 58,
      highAt: 42,
    },
    choices: publicResponseChoices("the AI safety podcast"),
  },
  {
    id: "documentary-backlash",
    family: "public-media",
    title: "Documentary backlash",
    promptTemplate:
      "A streaming documentary frames data centers as power-hungry infrastructure and highlights {location}.",
    baseWeight: 7,
    firstAvailablePeriod: 8,
    minBuiltUnits: 2,
    risk: {
      metric: "emissionsIndex",
      direction: "above",
      mediumAt: 50,
      highAt: 66,
    },
    choices: publicResponseChoices("the documentary backlash"),
  },
  {
    id: "school-board-controversy",
    family: "public-media",
    title: "School-board controversy",
    promptTemplate:
      "A local school-board race in {location} turns the data-center tax deal into a proxy fight.",
    baseWeight: 5,
    firstAvailablePeriod: 8,
    minBuiltUnits: 1,
    risk: {
      metric: "politicalSupport",
      direction: "below",
      mediumAt: 55,
      highAt: 38,
    },
    choices: publicResponseChoices("the school-board controversy"),
  },
  {
    id: "local-protests",
    family: "community-legal",
    title: "Local protests",
    promptTemplate:
      "Protests in {location} target noise, water use, and tax abatements around the latest buildout.",
    baseWeight: 10,
    firstAvailablePeriod: 6,
    minBuiltUnits: 1,
    risk: {
      metric: "peopleSupport",
      direction: "below",
      mediumAt: 60,
      highAt: 42,
    },
    choices: communityResponseChoices("the protest campaign"),
  },
  {
    id: "zoning-lawsuit",
    family: "community-legal",
    title: "Zoning lawsuit",
    promptTemplate:
      "A coalition files a zoning lawsuit over setbacks and backup generation in {location}.",
    baseWeight: 8,
    firstAvailablePeriod: 8,
    minBuiltUnits: 1,
    risk: {
      metric: "regulatorSupport",
      direction: "below",
      mediumAt: 56,
      highAt: 40,
    },
    choices: communityResponseChoices("the zoning lawsuit"),
  },
  {
    id: "referendum-threat",
    family: "community-legal",
    title: "Referendum threat",
    promptTemplate:
      "Opponents in {location} threaten a local referendum on future data-center permits.",
    baseWeight: 6,
    firstAvailablePeriod: 12,
    minBuiltUnits: 2,
    risk: {
      metric: "peopleSupport",
      direction: "below",
      mediumAt: 54,
      highAt: 38,
    },
    choices: communityResponseChoices("the referendum threat"),
  },
  {
    id: "credit-crunch",
    family: "market-finance",
    title: "Credit crunch",
    promptTemplate:
      "Lenders reprice infrastructure debt after a credit crunch hits capital markets.",
    baseWeight: 7,
    firstAvailablePeriod: 10,
    risk: { metric: "outlook", direction: "below", mediumAt: 58, highAt: 42 },
    choices: financeChoices("the credit crunch"),
  },
  {
    id: "bond-subsidy",
    family: "market-finance",
    title: "Bond subsidy window",
    promptTemplate:
      "A state infrastructure bond subsidy opens for grid-adjacent compute projects near {location}.",
    baseWeight: 6,
    firstAvailablePeriod: 12,
    minBuiltUnits: 1,
    risk: {
      metric: "politicalSupport",
      direction: "below",
      mediumAt: 50,
      highAt: 34,
    },
    choices: financeChoices("the bond subsidy window"),
  },
  {
    id: "cloud-demand-spike",
    family: "market-finance",
    title: "Cloud-demand spike",
    promptTemplate:
      "Enterprise AI demand spikes faster than forecast and customers pressure the network for capacity.",
    baseWeight: 8,
    firstAvailablePeriod: 16,
    risk: {
      metric: "computeCoverage",
      direction: "below",
      mediumAt: 76,
      highAt: 54,
    },
    choices: financeChoices("the cloud-demand spike"),
  },
  {
    id: "investor-pullback",
    family: "market-finance",
    title: "Investor pullback",
    promptTemplate:
      "Infrastructure investors pull back from AI capacity after several overbuilt campuses miss targets.",
    baseWeight: 5,
    firstAvailablePeriod: 16,
    risk: { metric: "outlook", direction: "below", mediumAt: 60, highAt: 44 },
    choices: financeChoices("the investor pullback"),
  },
  {
    id: "amazon-loan-offer",
    family: "vendor-competitor",
    title: "Amazon loan offer",
    promptTemplate:
      "Amazon offers to loan {loanAmount} of temporary capacity if you route overflow through its platform.",
    baseWeight: 7,
    firstAvailablePeriod: 8,
    risk: {
      metric: "computeCoverage",
      direction: "below",
      mediumAt: 75,
      highAt: 50,
    },
    choices: vendorChoices("Amazon's loan offer"),
  },
  {
    id: "hyperscaler-partnership",
    family: "vendor-competitor",
    title: "Hyperscaler partnership",
    promptTemplate:
      "{vendor} proposes a joint build near {location} with shared procurement and shared control.",
    baseWeight: 6,
    firstAvailablePeriod: 12,
    minBuiltUnits: 2,
    risk: {
      metric: "businessSupport",
      direction: "below",
      mediumAt: 56,
      highAt: 40,
    },
    choices: vendorChoices("the hyperscaler partnership"),
  },
  {
    id: "competitor-overbuild",
    family: "vendor-competitor",
    title: "Competitor overbuild",
    promptTemplate:
      "A competitor announces a nearby overbuild and starts bidding up labor and substations around {location}.",
    baseWeight: 7,
    firstAvailablePeriod: 10,
    minBuiltUnits: 1,
    risk: { metric: "builtUnits", direction: "above", mediumAt: 5, highAt: 9 },
    choices: vendorChoices("the competitor overbuild"),
  },
  {
    id: "interconnection-delay",
    family: "grid-utility",
    title: "Interconnection delay",
    promptTemplate:
      "The utility warns that interconnection studies near {location} are slipping behind schedule.",
    baseWeight: 9,
    firstAvailablePeriod: 5,
    minBuiltUnits: 1,
    risk: {
      metric: "powerCoverage",
      direction: "below",
      mediumAt: 72,
      highAt: 50,
    },
    choices: utilityChoices("the interconnection delay"),
  },
  {
    id: "grid-emergency",
    family: "grid-utility",
    title: "Grid emergency",
    promptTemplate:
      "A regional grid emergency triggers public scrutiny of large flexible loads near {location}.",
    baseWeight: 7,
    firstAvailablePeriod: 7,
    minBuiltUnits: 1,
    risk: {
      metric: "powerCoverage",
      direction: "below",
      mediumAt: 76,
      highAt: 55,
    },
    choices: utilityChoices("the grid emergency"),
  },
  {
    id: "utility-rate-case",
    family: "grid-utility",
    title: "Utility rate case",
    promptTemplate:
      "A utility rate case asks whether data-center upgrades should be socialized across customers.",
    baseWeight: 6,
    firstAvailablePeriod: 12,
    risk: {
      metric: "politicalSupport",
      direction: "below",
      mediumAt: 54,
      highAt: 38,
    },
    choices: utilityChoices("the utility rate case"),
  },
  {
    id: "queue-reform",
    family: "grid-utility",
    title: "Queue reform",
    promptTemplate:
      "Regulators open a queue-reform docket that could reward shovel-ready power projects.",
    baseWeight: 5,
    firstAvailablePeriod: 14,
    risk: {
      metric: "regulatorSupport",
      direction: "below",
      mediumAt: 54,
      highAt: 38,
    },
    choices: utilityChoices("the queue-reform docket"),
  },
  {
    id: "heat-wave",
    family: "climate-weather",
    title: "Heat wave",
    promptTemplate:
      "A heat wave in {location} stresses cooling systems and puts peak power use on the news.",
    baseWeight: 8,
    firstAvailablePeriod: 7,
    minBuiltUnits: 1,
    risk: {
      metric: "coolingCoverage",
      direction: "below",
      mediumAt: 74,
      highAt: 52,
    },
    choices: climateChoices("the heat wave"),
  },
  {
    id: "drought-restriction",
    family: "climate-weather",
    title: "Drought restriction",
    promptTemplate:
      "Water agencies near {location} consider drought restrictions for industrial users.",
    baseWeight: 7,
    firstAvailablePeriod: 8,
    minBuiltUnits: 1,
    risk: {
      metric: "waterCoverage",
      direction: "below",
      mediumAt: 72,
      highAt: 50,
    },
    choices: climateChoices("the drought restriction"),
  },
  {
    id: "storm-damage",
    family: "climate-weather",
    title: "Storm damage",
    promptTemplate:
      "A severe storm damages transmission and access roads serving {location}.",
    baseWeight: 5,
    firstAvailablePeriod: 10,
    minBuiltUnits: 1,
    risk: { metric: "outlook", direction: "below", mediumAt: 55, highAt: 38 },
    choices: climateChoices("the storm damage"),
  },
  {
    id: "wildfire-smoke",
    family: "climate-weather",
    title: "Wildfire smoke",
    promptTemplate:
      "Wildfire smoke threatens air-handling reliability and worker safety near {location}.",
    baseWeight: 5,
    firstAvailablePeriod: 10,
    minBuiltUnits: 1,
    risk: {
      metric: "coolingCoverage",
      direction: "below",
      mediumAt: 72,
      highAt: 48,
    },
    choices: climateChoices("the wildfire-smoke episode"),
  },
  {
    id: "union-strike",
    family: "labor-supply",
    title: "Union strike",
    promptTemplate:
      "A union strike threatens electrical and mechanical work across the buildout.",
    baseWeight: 6,
    firstAvailablePeriod: 9,
    risk: {
      metric: "laborSupport",
      direction: "below",
      mediumAt: 55,
      highAt: 40,
    },
    choices: laborSupplyChoices("the union strike"),
  },
  {
    id: "transformer-shortage",
    family: "labor-supply",
    title: "Transformer shortage",
    promptTemplate:
      "A transformer shortage hits the market just as new substations are scheduled.",
    baseWeight: 8,
    firstAvailablePeriod: 8,
    risk: {
      metric: "powerCoverage",
      direction: "below",
      mediumAt: 74,
      highAt: 52,
    },
    choices: laborSupplyChoices("the transformer shortage"),
  },
  {
    id: "gpu-shipment-delay",
    family: "labor-supply",
    title: "GPU shipment delay",
    promptTemplate:
      "GPU shipments slip after a packaging bottleneck hits the supply chain.",
    baseWeight: 7,
    firstAvailablePeriod: 5,
    risk: {
      metric: "computeCoverage",
      direction: "below",
      mediumAt: 78,
      highAt: 55,
    },
    choices: laborSupplyChoices("the GPU shipment delay"),
  },
  {
    id: "supplier-fire",
    family: "labor-supply",
    title: "Supplier fire",
    promptTemplate:
      "A supplier fire disrupts switchgear and cooling components used in the next wave.",
    baseWeight: 4,
    firstAvailablePeriod: 10,
    risk: { metric: "outlook", direction: "below", mediumAt: 56, highAt: 40 },
    choices: laborSupplyChoices("the supplier fire"),
  },
  {
    id: "cyber-incident",
    family: "security-operations",
    title: "Cyber incident",
    promptTemplate:
      "A cyber incident targets operations tooling for the data-center network.",
    baseWeight: 5,
    firstAvailablePeriod: 12,
    risk: {
      metric: "regulatorSupport",
      direction: "below",
      mediumAt: 56,
      highAt: 42,
    },
    choices: securityChoices("the cyber incident"),
  },
  {
    id: "network-outage",
    family: "security-operations",
    title: "Network outage",
    promptTemplate:
      "A regional outage interrupts customer workloads and draws attention to operational resilience.",
    baseWeight: 6,
    firstAvailablePeriod: 14,
    risk: {
      metric: "computeCoverage",
      direction: "below",
      mediumAt: 76,
      highAt: 55,
    },
    choices: securityChoices("the network outage"),
  },
  {
    id: "safety-violation",
    family: "security-operations",
    title: "Safety violation",
    promptTemplate:
      "Inspectors cite a safety violation at a construction site near {location}.",
    baseWeight: 5,
    firstAvailablePeriod: 8,
    minBuiltUnits: 1,
    risk: {
      metric: "laborSupport",
      direction: "below",
      mediumAt: 56,
      highAt: 40,
    },
    choices: securityChoices("the safety violation"),
  },
  {
    id: "compliance-audit",
    family: "security-operations",
    title: "Compliance audit",
    promptTemplate:
      "A compliance audit reviews energy reporting, water commitments, and emergency procedures.",
    baseWeight: 5,
    firstAvailablePeriod: 12,
    risk: {
      metric: "regulatorSupport",
      direction: "below",
      mediumAt: 56,
      highAt: 40,
    },
    choices: securityChoices("the compliance audit"),
  },
  {
    id: "cooling-breakthrough",
    family: "technology",
    title: "Cooling breakthrough",
    promptTemplate:
      "A cooling breakthrough promises better thermal density for the next expansion wave.",
    baseWeight: 5,
    firstAvailablePeriod: 9,
    risk: {
      metric: "coolingCoverage",
      direction: "below",
      mediumAt: 70,
      highAt: 48,
    },
    choices: technologyChoices("the cooling breakthrough"),
  },
  {
    id: "model-efficiency-jump",
    family: "technology",
    title: "Model-efficiency jump",
    promptTemplate:
      "A model-efficiency jump changes the compute-per-megawatt assumptions customers expect.",
    baseWeight: 5,
    firstAvailablePeriod: 16,
    risk: {
      metric: "computeCoverage",
      direction: "below",
      mediumAt: 76,
      highAt: 54,
    },
    choices: technologyChoices("the model-efficiency jump"),
  },
  {
    id: "power-management-upgrade",
    family: "technology",
    title: "Power-management upgrade",
    promptTemplate:
      "A power-management upgrade could make data-center loads more useful to the grid.",
    baseWeight: 5,
    firstAvailablePeriod: 12,
    risk: {
      metric: "powerCoverage",
      direction: "below",
      mediumAt: 72,
      highAt: 50,
    },
    choices: technologyChoices("the power-management upgrade"),
  },
  {
    id: "war-started",
    family: "geopolitics",
    title: "War shock",
    promptTemplate:
      "War started overseas, pushing energy, insurance, freight, and critical equipment prices higher.",
    baseWeight: 4,
    firstAvailablePeriod: 12,
    risk: { metric: "outlook", direction: "below", mediumAt: 58, highAt: 42 },
    choices: geopoliticalChoices("the war shock"),
  },
  {
    id: "export-controls",
    family: "geopolitics",
    title: "Export controls",
    promptTemplate:
      "New export controls reshape GPU availability and supplier commitments.",
    baseWeight: 5,
    firstAvailablePeriod: 14,
    risk: {
      metric: "computeCoverage",
      direction: "below",
      mediumAt: 76,
      highAt: 54,
    },
    choices: geopoliticalChoices("the export-control shock"),
  },
  {
    id: "shipping-disruption",
    family: "geopolitics",
    title: "Shipping disruption",
    promptTemplate:
      "A shipping disruption slows long-lead electrical and cooling components.",
    baseWeight: 6,
    firstAvailablePeriod: 10,
    risk: { metric: "outlook", direction: "below", mediumAt: 58, highAt: 42 },
    choices: geopoliticalChoices("the shipping disruption"),
  },
  {
    id: "sanctions-shock",
    family: "geopolitics",
    title: "Sanctions shock",
    promptTemplate:
      "A sanctions shock forces suppliers to reroute procurement and compliance checks.",
    baseWeight: 4,
    firstAvailablePeriod: 14,
    risk: {
      metric: "businessSupport",
      direction: "below",
      mediumAt: 55,
      highAt: 40,
    },
    choices: geopoliticalChoices("the sanctions shock"),
  },
];
