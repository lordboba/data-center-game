import { useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  BatteryCharging,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Factory,
  Flag,
  Gauge,
  Landmark,
  Play,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import { UnitedStatesMap } from "./components/UnitedStatesMap";
import {
  ACTION_CARDS,
  DATA_CENTER_SITES,
  END_YEAR,
  MAX_BUILDS,
  MIN_DEMAND_TO_WIN,
  WIN_SCORE,
} from "./data/gameData";
import type { ActionCard } from "./data/gameData";
import { useLeaderboard } from "./hooks/useLeaderboard";
import {
  calculateScore,
  continueFromReport,
  findAction,
  formatBudget,
  formatLargeNumber,
  GameState,
  getAnnualBudget,
  getBudgetRemaining,
  getBuiltSites,
  getCurrentPeriodLabel,
  getPlannedCost,
  getRecommendedActionIds,
  getRunOutcome,
  getSupplySummary,
  initialGameState,
  removeAction,
  restartRun,
  runAnnualPlan,
  selectAction,
} from "./lib/gameEngine";

const generatedAssets = {
  ui: {
    meterStrip: "/generated-assets/ui/meter-strip.svg",
    titleLockup: "/generated-assets/ui/title-lockup.svg",
  },
  labels: {
    budget: "/generated-assets/labels/budget.svg",
    coverage: "/generated-assets/labels/coverage.svg",
    demand: "/generated-assets/labels/demand.svg",
    leaderboard: "/generated-assets/labels/leaderboard.svg",
    power: "/generated-assets/labels/power.svg",
    water: "/generated-assets/labels/water.svg",
    year: "/generated-assets/labels/year.svg",
  },
  infrastructure: [
    { name: "GPU Pod", src: "/generated-assets/objects/gpu-pod.svg" },
    {
      name: "Grid Interconnect",
      src: "/generated-assets/objects/grid-interconnect.svg",
    },
    {
      name: "Solar + Battery",
      src: "/generated-assets/objects/renewable-ppa.svg",
    },
    { name: "Chiller Yard", src: "/generated-assets/objects/chiller-yard.svg" },
    { name: "Water Reuse", src: "/generated-assets/objects/water-reuse.svg" },
    {
      name: "Frontier Campus",
      src: "/generated-assets/objects/frontier-campus.svg",
    },
  ],
};

function infrastructureAsset(index: number) {
  return generatedAssets.infrastructure[
    index % generatedAssets.infrastructure.length
  ];
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand-mark" aria-label="Data Center Game home">
          <Building2 size={20} />
          <span>Data Center Game</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/play">Play</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
        </nav>
      </header>
      {children}
    </div>
  );
}

function HomePage() {
  const { bestScore } = useLeaderboard();

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <img
            className="title-lockup"
            src={generatedAssets.ui.titleLockup}
            alt=""
            aria-hidden="true"
          />
          <p className="eyebrow">Grid strategy simulator</p>
          <h1>Data Center Game</h1>
          <p className="lede">
            Plan an annual AI infrastructure campaign from 2022 to 2030. Balance
            compute, power, cooling, water, people support, and political
            support before demand outruns the buildout.
          </p>
          <div className="home-actions" aria-label="Home actions">
            <Link className="primary-action" to="/play">
              <Play size={18} />
              Play
            </Link>
            <Link className="secondary-action" to="/leaderboard">
              <Trophy size={18} />
              Leaderboard
            </Link>
          </div>
          <div className="hero-stats" aria-label="Current leaderboard summary">
            <div>
              <span>Best score</span>
              <strong>{bestScore}</strong>
            </div>
            <div>
              <span>Campaign</span>
              <strong>2022-2030</strong>
            </div>
            <div>
              <span>Markets</span>
              <strong>{DATA_CENTER_SITES.length}</strong>
            </div>
          </div>
          <InfrastructureStack builtCount={MAX_BUILDS} compact />
        </div>
        <div className="home-map-panel" aria-label="United States map preview">
          <img
            className="home-meter-strip"
            src={generatedAssets.ui.meterStrip}
            alt=""
            aria-hidden="true"
          />
          <UnitedStatesMap compact />
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  asset,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  asset?: string;
  label: string;
  value: string | number;
  tone?: "good" | "warning";
}) {
  return (
    <div className={`metric-card ${tone ? `metric-card--${tone}` : ""}`}>
      <span className="metric-card__icon">
        {asset ? <img src={asset} alt="" aria-hidden="true" /> : icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfrastructureStack({
  builtCount,
  compact = false,
}: {
  builtCount: number;
  compact?: boolean;
}) {
  return (
    <section
      className={compact ? "build-stack build-stack--compact" : "build-stack"}
      aria-label="Infrastructure build stack"
    >
      {generatedAssets.infrastructure.map((asset, index) => (
        <div
          className={`build-stack__item ${index < builtCount ? "build-stack__item--active" : ""}`}
          key={asset.name}
        >
          <img src={asset.src} alt="" aria-hidden="true" />
          <span>{asset.name}</span>
        </div>
      ))}
    </section>
  );
}

function SitePanel({
  state,
  setState,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}) {
  const selectedSite = DATA_CENTER_SITES.find(
    (site) => site.id === state.selectedSiteId,
  )!;
  const builtSet = new Set(state.builtSiteIds);
  const asset = infrastructureAsset(state.builtSiteIds.length);

  return (
    <aside className="decision-panel" aria-label="Market decision panel">
      <div className="turn-strip">
        <span>Market for regional cards</span>
        <small>{state.builtSiteIds.length} active sites</small>
      </div>

      <div className="selected-site">
        <div className="selected-site__heading">
          <div>
            <p className="eyebrow">Selected market</p>
            <h2>
              {selectedSite.metro}
              <span>{selectedSite.state}</span>
            </h2>
          </div>
          <img src={asset.src} alt="" aria-hidden="true" />
        </div>
        <p>{selectedSite.note}</p>
        <div className="site-metrics">
          <span>{selectedSite.region}</span>
          <span>{selectedSite.capacity} legacy MW</span>
          <span>{selectedSite.waterSecurity} water</span>
        </div>
      </div>

      <div className="site-score-grid">
        <MetricCard
          icon={<Zap size={15} />}
          label="Latency"
          value={selectedSite.latency}
        />
        <MetricCard
          icon={<BatteryCharging size={15} />}
          label="Clean power"
          value={selectedSite.cleanPower}
          tone="good"
        />
        <MetricCard
          icon={<Waves size={15} />}
          label="Water"
          value={selectedSite.waterSecurity}
          tone={selectedSite.waterSecurity < 55 ? "warning" : undefined}
        />
        <MetricCard
          icon={<ShieldCheck size={15} />}
          label="Climate"
          value={selectedSite.climateResilience}
          tone={selectedSite.climateResilience < 60 ? "warning" : undefined}
        />
      </div>

      <div className="site-list" aria-label="Candidate markets">
        {DATA_CENTER_SITES.map((site, index) => {
          const isBuilt = builtSet.has(site.id);
          const isSelected = site.id === selectedSite.id;
          const siteAsset = infrastructureAsset(index);

          return (
            <button
              key={site.id}
              type="button"
              className={[
                "site-list-item",
                isSelected ? "site-list-item--active" : "",
                isBuilt ? "site-list-item--built" : "",
              ].join(" ")}
              onClick={() =>
                setState((current) => ({ ...current, selectedSiteId: site.id }))
              }
            >
              <span className="site-list-main">
                <img
                  className="site-list-thumb"
                  src={siteAsset.src}
                  alt=""
                  aria-hidden="true"
                />
                <span>
                  <b>{site.metro}</b>
                  <small>{site.state}</small>
                </span>
              </span>
              <strong>{isBuilt ? "Built" : "Select"}</strong>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function categoryIcon(card: ActionCard) {
  if (card.category === "compute") return <Factory size={17} />;
  if (card.category === "power") return <Zap size={17} />;
  if (card.category === "cooling") return <Gauge size={17} />;
  if (card.category === "water") return <Waves size={17} />;
  if (card.category === "politics") return <Landmark size={17} />;
  return <Flag size={17} />;
}

function ActionCardGrid({
  state,
  setState,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}) {
  const recommended = getRecommendedActionIds(state);
  const budgetRemaining = getBudgetRemaining(state);

  return (
    <section className="action-card-grid" aria-label="Annual action cards">
      {ACTION_CARDS.map((card) => {
        const selected = state.selectedActionIds.includes(card.id);
        const locked = state.year < card.availableYear;
        const disabled =
          state.phase !== "planning" ||
          selected ||
          locked ||
          budgetRemaining < card.cost;
        const isRecommended = recommended.has(card.id);

        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            className={[
              "action-card",
              selected ? "action-card--selected" : "",
              isRecommended ? "action-card--recommended" : "",
            ].join(" ")}
            onClick={() =>
              setState((current) => selectAction(current, card.id))
            }
          >
            <span className="action-card__topline">
              <span>{categoryIcon(card)}</span>
              <b>{formatBudget(card.cost)}</b>
            </span>
            <strong>{card.title}</strong>
            <small>
              {locked
                ? `Unlocks ${card.availableYear}`
                : `${card.durationYears === 0 ? "Instant" : `${card.durationYears} year`} · ${
                    card.requiresSite ? "uses selected market" : "national"
                  }`}
            </small>
            <p>{card.benefitText}</p>
            <em>{card.riskText}</em>
            {isRecommended && (
              <span className="recommended-chip">Recommended</span>
            )}
          </button>
        );
      })}
    </section>
  );
}

function AnnualPlanTray({
  state,
  setState,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}) {
  const planned = state.projects.filter(
    (project) => project.selectedYear === state.year,
  );
  const queued = state.projects.filter(
    (project) => project.selectedYear < state.year,
  );

  return (
    <section className="plan-grid">
      <div className="annual-plan-tray">
        <div className="panel-heading">
          <p className="eyebrow">Annual plan</p>
          <h2>{planned.length} selected</h2>
        </div>
        {planned.length === 0 ? (
          <p className="empty-copy">Choose cards above to fund this year.</p>
        ) : (
          planned.map((project) => {
            const card = findAction(project.cardId);
            const site = project.siteId
              ? DATA_CENTER_SITES.find(
                  (candidate) => candidate.id === project.siteId,
                )
              : null;
            return (
              <button
                key={project.id}
                type="button"
                className="plan-chip"
                onClick={() =>
                  setState((current) => removeAction(current, project.id))
                }
              >
                <span>
                  <b>{card.shortTitle}</b>
                  <small>{site ? site.metro : "National"}</small>
                </span>
                <strong>{formatBudget(card.cost)}</strong>
              </button>
            );
          })
        )}
      </div>

      <div className="build-queue">
        <div className="panel-heading">
          <p className="eyebrow">Build queue</p>
          <h2>{queued.length} pending</h2>
        </div>
        {queued.length === 0 ? (
          <p className="empty-copy">
            Longer builds will appear here until ready.
          </p>
        ) : (
          queued.map((project) => {
            const card = findAction(project.cardId);
            return (
              <div key={project.id} className="queue-row">
                <span>{card.title}</span>
                <strong>{project.readyYear}</strong>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AdvisorPanel({ state }: { state: GameState }) {
  const supply = getSupplySummary(state);

  return (
    <section className="advisor-panel">
      <div className="panel-heading">
        <p className="eyebrow">Annual briefing</p>
        <h2>{supply.mainBottleneck}</h2>
      </div>
      <p>
        Demand this year is {formatLargeNumber(supply.demand.h100e)} H100e and{" "}
        {formatLargeNumber(supply.demand.powerMW)} MW. Recommended cards are
        based on the lowest coverage or support score.
      </p>
      <div className="support-breakdown">
        <span>People {supply.peopleSupport}</span>
        <span>Political {supply.politicalSupport}</span>
        <span>Emissions {state.emissionsIndex}</span>
      </div>
    </section>
  );
}

function TurnReportModal({
  state,
  onContinue,
  onReviewFinal,
  onRestart,
}: {
  state: GameState;
  onContinue: () => void;
  onReviewFinal: () => void;
  onRestart: () => void;
}) {
  const report = state.report;
  if (!report) return null;
  const final = state.phase === "finished";

  return (
    <div className="summary-overlay">
      <section
        className="turn-report"
        role="dialog"
        aria-modal="true"
        aria-label="Year-end report"
      >
        <div className="panel-heading">
          <p className="eyebrow">{report.year} year-end report</p>
          <h2>{final ? getRunOutcome(state).title : report.summary}</h2>
        </div>
        <div className="turn-report-grid">
          <article>
            <h3>Coverage deltas</h3>
            <span>
              Compute {report.metricDeltas.computeCoverage >= 0 ? "+" : ""}
              {report.metricDeltas.computeCoverage}
            </span>
            <span>
              Power {report.metricDeltas.powerCoverage >= 0 ? "+" : ""}
              {report.metricDeltas.powerCoverage}
            </span>
            <span>
              Cooling {report.metricDeltas.coolingCoverage >= 0 ? "+" : ""}
              {report.metricDeltas.coolingCoverage}
            </span>
            <span>
              Water {report.metricDeltas.waterCoverage >= 0 ? "+" : ""}
              {report.metricDeltas.waterCoverage}
            </span>
          </article>
          <article>
            <h3>Support deltas</h3>
            <span>
              People {report.metricDeltas.peopleSupport >= 0 ? "+" : ""}
              {report.metricDeltas.peopleSupport}
            </span>
            <span>
              Political {report.metricDeltas.politicalSupport >= 0 ? "+" : ""}
              {report.metricDeltas.politicalSupport}
            </span>
          </article>
        </div>
        <div className="headline-list">
          {report.completedProjects.length > 0 && (
            <p>
              <b>Completed:</b> {report.completedProjects.join(", ")}
            </p>
          )}
          {report.headlines.map((headline) => (
            <p key={headline}>{headline}</p>
          ))}
          {report.warnings.map((warning) => (
            <p key={warning} className="warning-copy">
              {warning}
            </p>
          ))}
          {report.advisorTips.map((tip) => (
            <p key={tip}>
              <b>Advisor:</b> {tip}
            </p>
          ))}
        </div>
        <div className="summary-actions">
          {final ? (
            <>
              <button
                className="primary-action"
                type="button"
                onClick={onReviewFinal}
              >
                <Trophy size={18} />
                Review final score
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={onRestart}
              >
                <RotateCcw size={18} />
                New campaign
              </button>
            </>
          ) : (
            <button
              className="primary-action"
              type="button"
              onClick={onContinue}
            >
              <ChevronRight size={18} />
              Continue to {state.year + 1}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function RunSummary({
  state,
  onRestart,
}: {
  state: GameState;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const { addEntry } = useLeaderboard();
  const [playerName, setPlayerName] = useState("");
  const [saved, setSaved] = useState(false);
  const builtSites = getBuiltSites(state);
  const score = calculateScore(state);
  const outcome = getRunOutcome(state);

  const saveRun = () => {
    if (saved) return;
    addEntry(
      playerName,
      score,
      builtSites.map((site) => site.metro),
    );
    setSaved(true);
  };

  return (
    <div
      className="summary-card"
      role="dialog"
      aria-modal="true"
      aria-label="Run summary"
    >
      <div>
        <p className={`eyebrow outcome-${outcome.status}`}>{outcome.title}</p>
        <h2>{score.score}</h2>
        <p>
          {builtSites.length} {builtSites.length === 1 ? "market" : "markets"},{" "}
          {formatLargeNumber(score.capacity)} MW supply, {score.demandCoverage}%
          blended coverage. {outcome.description}
        </p>
      </div>
      <div className="summary-metrics">
        <MetricCard
          asset={generatedAssets.labels.coverage}
          label="Sites"
          value={builtSites.length}
        />
        <MetricCard
          icon={<Zap size={16} />}
          label="Latency"
          value={score.avgLatency || "-"}
        />
        <MetricCard
          asset={generatedAssets.labels.water}
          label="Coverage"
          value={`${score.demandCoverage}%`}
        />
        <MetricCard
          asset={generatedAssets.labels.budget}
          label="Year budget"
          value={formatBudget(score.budgetRemaining)}
        />
      </div>
      <label className="name-field">
        Operator name
        <input
          value={playerName}
          maxLength={22}
          placeholder="Operator"
          onChange={(event) => setPlayerName(event.target.value)}
        />
      </label>
      <div className="summary-actions">
        <button
          className="primary-action"
          type="button"
          onClick={saveRun}
          disabled={saved}
        >
          <Trophy size={18} />
          {saved ? "Saved" : "Save score"}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => navigate("/leaderboard")}
        >
          Leaderboard
        </button>
        <button className="ghost-button" type="button" onClick={onRestart}>
          New campaign
        </button>
      </div>
    </div>
  );
}

function OnboardingOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="summary-overlay">
      <section
        className="tutorial-card"
        role="dialog"
        aria-modal="true"
        aria-label="Game tutorial"
      >
        <div className="tutorial-kicker">
          <BookOpen size={18} />
          Tutorial
        </div>
        <h2>Build the AI footprint without losing the coalition.</h2>
        <button
          className="primary-action tutorial-start"
          type="button"
          onClick={onStart}
        >
          <CheckCircle2 size={18} />
          Start 2022 plan
        </button>
        <div className="tutorial-grid">
          <article>
            <span>1</span>
            <h3>Pick a market</h3>
            <p>
              The map sets the selected market for regional cards such as
              campuses, grid interconnects, water reuse, and benefits packages.
            </p>
          </article>
          <article>
            <span>2</span>
            <h3>Fund cards</h3>
            <p>
              Each year has its own budget. Recommended cards target the current
              bottleneck, but every card has a tradeoff.
            </p>
          </article>
          <article>
            <span>3</span>
            <h3>Read reports</h3>
            <p>
              Reports explain completed projects, support swings, warnings, and
              the next bottleneck before the campaign moves forward.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

function PlayPage() {
  const [state, setState] = useState<GameState>(initialGameState);
  const [showSummary, setShowSummary] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const supply = getSupplySummary(state);
  const builtSites = getBuiltSites(state);
  const budgetRemaining = getBudgetRemaining(state);
  const annualBudget = getAnnualBudget(state.year);
  const plannedCost = getPlannedCost(state);
  const score = calculateScore(state);
  const displaySummary =
    showSummary || (state.phase === "finished" && !state.report);

  const restart = () => {
    setState(restartRun());
    setShowSummary(false);
    setTutorialOpen(true);
  };

  const runPlan = () => {
    setState((current) => runAnnualPlan(current));
  };

  const continueReport = () => {
    setState((current) => continueFromReport(current));
  };

  const reviewFinalScore = () => {
    setState((current) => ({ ...current, report: null }));
    setShowSummary(true);
  };

  return (
    <main className="play-page">
      <section className="game-header">
        <div>
          <p className="eyebrow">Operator console</p>
          <h1>Plan the {getCurrentPeriodLabel(state)} AI buildout</h1>
        </div>
        <div className="run-controls">
          <button className="ghost-button" type="button" onClick={restart}>
            <RotateCcw size={16} />
            New run
          </button>
          <button
            className="primary-action"
            type="button"
            onClick={runPlan}
            disabled={
              state.phase !== "planning" ||
              state.projects.filter(
                (project) => project.selectedYear === state.year,
              ).length === 0
            }
          >
            <Play size={16} />
            Run annual plan
          </button>
        </div>
      </section>

      <section className="score-band" aria-label="Run metrics">
        <MetricCard
          asset={generatedAssets.labels.year}
          label="Year"
          value={`${state.year}/${END_YEAR}`}
        />
        <MetricCard
          asset={generatedAssets.labels.budget}
          label="Budget"
          value={`${formatBudget(budgetRemaining)} / ${formatBudget(annualBudget)}`}
          tone={budgetRemaining <= 2 ? "warning" : undefined}
        />
        <MetricCard
          asset={generatedAssets.labels.demand}
          label="Compute"
          value={`${supply.computeCoverage}%`}
          tone={supply.computeCoverage < 65 ? "warning" : undefined}
        />
        <MetricCard
          asset={generatedAssets.labels.power}
          label="Power"
          value={`${supply.powerCoverage}%`}
          tone={supply.powerCoverage < 65 ? "warning" : undefined}
        />
        <MetricCard
          icon={<Waves size={16} />}
          label="Water"
          value={`${supply.waterCoverage}%`}
          tone={supply.waterCoverage < 65 ? "warning" : undefined}
        />
        <MetricCard
          icon={<Landmark size={16} />}
          label="Support"
          value={`${supply.peopleSupport}/${supply.politicalSupport}`}
          tone={
            supply.peopleSupport < 45 || supply.politicalSupport < 45
              ? "warning"
              : undefined
          }
        />
      </section>

      <div className="budget-meter" aria-label="Annual budget used">
        <span
          style={{
            width: `${Math.min(100, (plannedCost / annualBudget) * 100)}%`,
          }}
        />
      </div>
      <InfrastructureStack
        builtCount={Math.min(builtSites.length, MAX_BUILDS)}
      />

      <section className="game-layout">
        <div className="map-stage">
          <div className="map-topline">
            <div>
              <p className="eyebrow">US atlas</p>
              <h2>Choose a market, then fund cards</h2>
            </div>
            <span>{builtSites.length} built</span>
          </div>
          <UnitedStatesMap
            builtSiteIds={state.builtSiteIds}
            selectedSiteId={state.selectedSiteId}
            onSelectSite={(siteId) =>
              setState((current) => ({ ...current, selectedSiteId: siteId }))
            }
          />
          <AdvisorPanel state={state} />
        </div>
        <SitePanel state={state} setState={setState} />
      </section>

      <ActionCardGrid state={state} setState={setState} />
      <AnnualPlanTray state={state} setState={setState} />

      <section className="score-footer">
        <span>Current score projection</span>
        <strong>{score.score}</strong>
        <span>
          Win target: {WIN_SCORE} and {MIN_DEMAND_TO_WIN}% final compute
          coverage
        </span>
      </section>

      {state.report && (
        <TurnReportModal
          state={state}
          onContinue={continueReport}
          onReviewFinal={reviewFinalScore}
          onRestart={restart}
        />
      )}
      {displaySummary && (
        <div className="summary-overlay">
          <RunSummary state={state} onRestart={restart} />
        </div>
      )}
      {tutorialOpen && (
        <OnboardingOverlay onStart={() => setTutorialOpen(false)} />
      )}
    </main>
  );
}

function LeaderboardPage() {
  const { entries, clearEntries } = useLeaderboard();

  return (
    <main className="leaderboard-page">
      <section className="leaderboard-header">
        <div>
          <p className="eyebrow">Hall of operators</p>
          <h1>Leaderboard</h1>
        </div>
        <div className="leaderboard-actions">
          <Link className="primary-action" to="/play">
            <Play size={18} />
            Play again
          </Link>
          <button className="ghost-button" type="button" onClick={clearEntries}>
            Reset
          </button>
        </div>
      </section>

      <section className="leaderboard-table" aria-label="Leaderboard entries">
        {entries.map((entry, index) => (
          <article key={entry.id} className="leaderboard-row">
            <div className="rank-badge">{index + 1}</div>
            <div className="leaderboard-main">
              <h2>{entry.playerName}</h2>
              <p>{entry.sites.join(" / ") || "No markets completed"}</p>
            </div>
            <div className="leaderboard-stats">
              <span>
                <strong>{entry.score}</strong>
                score
              </span>
              <span>
                <strong>{formatLargeNumber(entry.capacity)}</strong>
                MW
              </span>
              <span>
                <strong>{entry.demandCoverage}%</strong>
                coverage
              </span>
              <span>
                <strong>{formatBudget(entry.budgetRemaining)}</strong>
                left
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="not-found">
      <h1>Route not found</h1>
      <Link className="primary-action" to="/">
        Go home
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
