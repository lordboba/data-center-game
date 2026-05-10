import { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
  MapPin,
  Plus,
  Play,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Trophy,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { UnitedStatesMap } from "./components/UnitedStatesMap";
import {
  CAMPAIGN_PERIODS,
  DATA_CENTER_SITES,
  END_YEAR,
  INITIAL_SITE_IDS,
  MAX_BUILDS,
  MIN_DEMAND_TO_WIN,
  TUTORIAL_STEPS,
  WIN_SCORE,
} from "./data/gameData";
import type { ActionCard, DataCenterSite } from "./data/gameData";
import { useLeaderboard } from "./hooks/useLeaderboard";
import {
  calculateScore,
  continueFromReport,
  findAction,
  formatBudget,
  formatLargeNumber,
  GameState,
  getActionLockReason,
  getAnnualBudget,
  getBudgetRemaining,
  getBuiltSites,
  getCurrentPeriod,
  getCurrentPeriodLabel,
  getDynamicActionCost,
  getPlannedCost,
  getPeriodLabel,
  getRecommendedActionIds,
  getRunOutcome,
  getSelectableSites,
  getSupplySummary,
  getUnlockedActions,
  getVisibleMetrics,
  initialGameState,
  isUnlockStageAvailable,
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
  const starterSites = DATA_CENTER_SITES.filter((site) =>
    INITIAL_SITE_IDS.includes(site.id as (typeof INITIAL_SITE_IDS)[number]),
  );

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
            Plan an AI infrastructure campaign from 2022 to 2030. Start with
            siting and compute, then manage power, cooling, water, public
            support, and political support as the calendar accelerates.
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
              <span>Starter choices</span>
              <strong>{starterSites.length}</strong>
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
          <UnitedStatesMap compact sites={starterSites} />
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
  tutorialTarget,
  warningText,
}: {
  icon?: React.ReactNode;
  asset?: string;
  label: string;
  value: string | number;
  tone?: "good" | "warning";
  tutorialTarget?: string;
  warningText?: string;
}) {
  const showWarning = tone === "warning";
  const warningLabel =
    warningText ?? "Low statistic. Consequences may apply if ignored.";

  return (
    <div
      className={`metric-card ${tone ? `metric-card--${tone}` : ""}`}
      data-tutorial={tutorialTarget}
    >
      <span className="metric-card__icon">
        {asset ? <img src={asset} alt="" aria-hidden="true" /> : icon}
      </span>
      <span className="metric-card__label-row">
        <span>{label}</span>
        {showWarning && (
          <span
            className="metric-card__warning"
            aria-label={warningLabel}
            title={warningLabel}
          >
            <TriangleAlert size={15} />
          </span>
        )}
      </span>
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
  sites,
  onSelectSite,
}: {
  state: GameState;
  sites: DataCenterSite[];
  onSelectSite: (siteId: string) => void;
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
        <small>
          {state.builtSiteIds.length === 0
            ? `${sites.length} starter choices`
            : `${sites.length} available markets`}
        </small>
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
          warningText="Low water security can create permit and support pressure."
        />
        <MetricCard
          icon={<ShieldCheck size={15} />}
          label="Climate"
          value={selectedSite.climateResilience}
          tone={selectedSite.climateResilience < 60 ? "warning" : undefined}
          warningText="Low climate resilience can raise operating risk."
        />
      </div>

      <div className="site-list" aria-label="Candidate markets">
        {sites.map((site, index) => {
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
              onClick={() => onSelectSite(site.id)}
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

function SelectedMarketSummary({
  state,
  siteCount,
  onOpenMarket,
}: {
  state: GameState;
  siteCount: number;
  onOpenMarket: () => void;
}) {
  const selectedSite = DATA_CENTER_SITES.find(
    (site) => site.id === state.selectedSiteId,
  )!;

  return (
    <section className="selected-market-card">
      <div>
        <p className="eyebrow">Selected market</p>
        <h2>
          {selectedSite.metro}
          <span>{selectedSite.state}</span>
        </h2>
      </div>
      <div className="selected-market-card__stats">
        <span>{selectedSite.region}</span>
        <span>{selectedSite.capacity} MW</span>
        <span>{selectedSite.cleanPower} clean</span>
      </div>
      <button
        className="ghost-button"
        type="button"
        onClick={onOpenMarket}
        data-tutorial="market-picker"
      >
        <MapPin size={16} />
        {siteCount === INITIAL_SITE_IDS.length
          ? "Choose market"
          : "Change market"}
      </button>
    </section>
  );
}

function CommandModal({
  eyebrow,
  title,
  children,
  onClose,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="command-modal-backdrop">
      <section
        className={`command-modal ${wide ? "command-modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="command-modal__heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button
            className="ghost-button command-modal__close"
            type="button"
            onClick={onClose}
          >
            <X size={16} />
            Close
          </button>
        </div>
        <div className="command-modal__body">{children}</div>
      </section>
    </div>
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
  initialSiteConfirmed,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  initialSiteConfirmed: boolean;
}) {
  const recommended = getRecommendedActionIds(state);
  const budgetRemaining = getBudgetRemaining(state);
  const visibleCards = getUnlockedActions(state);

  return (
    <section className="action-card-grid" aria-label="Period action cards">
      {visibleCards.map((card) => {
        const selected = state.selectedActionIds.includes(card.id);
        const cost = getDynamicActionCost(state, card);
        const lockReason =
          !initialSiteConfirmed && state.periodIndex === 0 && card.requiresSite
            ? "Choose a market first"
            : getActionLockReason(state, card);
        const disabled =
          state.phase !== "planning" ||
          lockReason !== null ||
          budgetRemaining < cost;
        const isRecommended = recommended.has(card.id);

        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            data-tutorial={`action-${card.id}`}
            className={[
              "action-card",
              selected ? "action-card--selected" : "",
              isRecommended ? "action-card--recommended" : "",
              lockReason ? "action-card--blocked" : "",
            ].join(" ")}
            onClick={() =>
              setState((current) => selectAction(current, card.id))
            }
          >
            <span className="action-card__topline">
              <span>{categoryIcon(card)}</span>
              <b>{formatBudget(cost)}</b>
            </span>
            <strong>{card.title}</strong>
            <small>
              {`${
                card.durationMonths === 0
                  ? "Instant"
                  : `${card.durationMonths} months`
              } · ${card.requiresSite ? "uses selected market" : "national"}`}
            </small>
            <p>{card.benefitText}</p>
            <em>{card.riskText}</em>
            {isRecommended && (
              <span className="recommended-chip">Recommended</span>
            )}
            {lockReason && !selected && (
              <span className="blocked-chip">{lockReason}</span>
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
  compact = false,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  compact?: boolean;
}) {
  const planned = state.projects.filter(
    (project) => project.selectedPeriodIndex === state.periodIndex,
  );
  const queued = state.projects.filter(
    (project) =>
      project.selectedPeriodIndex < state.periodIndex &&
      project.readyPeriodIndex > state.periodIndex,
  );

  return (
    <section
      className={`plan-grid ${compact ? "plan-grid--compact" : ""}`}
      data-tutorial="annual-plan"
    >
      <div className="annual-plan-tray">
        <div className="panel-heading">
          <p className="eyebrow">Period plan</p>
          <h2>{planned.length} selected</h2>
        </div>
        {planned.length === 0 ? (
          compact ? null : (
            <p className="empty-copy">
              Choose cards above to fund this period.
            </p>
          )
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
                <strong>{formatBudget(project.cost)}</strong>
              </button>
            );
          })
        )}
      </div>

      {(!compact || queued.length > 0) && (
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
              const readyPeriod = CAMPAIGN_PERIODS[project.readyPeriodIndex];
              return (
                <div key={project.id} className="queue-row">
                  <span>{card.title}</span>
                  <strong>{readyPeriod?.label ?? "Queued"}</strong>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

function AdvisorPanel({
  state,
  compact = false,
}: {
  state: GameState;
  compact?: boolean;
}) {
  const supply = getSupplySummary(state);
  const visibleMetrics = getVisibleMetrics(state);

  return (
    <section
      className={`advisor-panel ${compact ? "advisor-panel--compact" : ""}`}
    >
      <div className="panel-heading">
        <p className="eyebrow">Period briefing</p>
        <h2>{supply.mainBottleneck}</h2>
      </div>
      {!compact && (
        <p>
          Demand this period is {formatLargeNumber(supply.demand.h100e)} H100e
          and {formatLargeNumber(supply.demand.powerMW)} MW. Recommended cards
          are based on the lowest coverage or support score.
        </p>
      )}
      <div className="support-breakdown">
        {compact && (
          <span>{formatLargeNumber(supply.demand.h100e)} H100e demand</span>
        )}
        {visibleMetrics.has("peopleSupport") && (
          <span>People {supply.peopleSupport}</span>
        )}
        {visibleMetrics.has("politicalSupport") && (
          <span>Political {supply.politicalSupport}</span>
        )}
        <span>Emissions {state.emissionsIndex}</span>
        <span>Outlook {state.outlook}</span>
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
  const visibleMetrics = getVisibleMetrics(state);

  return (
    <div className="summary-overlay">
      <section
        className="turn-report"
        role="dialog"
        aria-modal="true"
        aria-label="Turn report"
        data-tutorial="turn-report"
      >
        <div className="panel-heading">
          <p className="eyebrow">{report.periodLabel} report</p>
          <h2>{final ? getRunOutcome(state).title : report.summary}</h2>
        </div>
        <div className="turn-report-grid">
          <article>
            <h3>Coverage deltas</h3>
            <span>
              Compute {report.metricDeltas.computeCoverage >= 0 ? "+" : ""}
              {report.metricDeltas.computeCoverage}
            </span>
            {visibleMetrics.has("power") && (
              <span>
                Power {report.metricDeltas.powerCoverage >= 0 ? "+" : ""}
                {report.metricDeltas.powerCoverage}
              </span>
            )}
            {visibleMetrics.has("cooling") && (
              <span>
                Cooling {report.metricDeltas.coolingCoverage >= 0 ? "+" : ""}
                {report.metricDeltas.coolingCoverage}
              </span>
            )}
            {visibleMetrics.has("water") && (
              <span>
                Water {report.metricDeltas.waterCoverage >= 0 ? "+" : ""}
                {report.metricDeltas.waterCoverage}
              </span>
            )}
          </article>
          <article>
            <h3>Support deltas</h3>
            {visibleMetrics.has("peopleSupport") && (
              <span>
                People {report.metricDeltas.peopleSupport >= 0 ? "+" : ""}
                {report.metricDeltas.peopleSupport}
              </span>
            )}
            {visibleMetrics.has("politicalSupport") && (
              <span>
                Political {report.metricDeltas.politicalSupport >= 0 ? "+" : ""}
                {report.metricDeltas.politicalSupport}
              </span>
            )}
            <span>
              Outlook {report.metricDeltas.outlook >= 0 ? "+" : ""}
              {report.metricDeltas.outlook}
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
              Continue to{" "}
              {CAMPAIGN_PERIODS[state.periodIndex + 1]?.label ?? "final score"}
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

type TutorialOverlayProps = {
  active: boolean;
  step: (typeof TUTORIAL_STEPS)[number] | undefined;
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

function TutorialOverlay({
  active,
  step,
  stepIndex,
  stepCount,
  onNext,
  onBack,
  onSkip,
}: TutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!active || !step) return;

    const updateTarget = () => {
      const element = document.querySelector<HTMLElement>(
        `[data-tutorial="${step.target}"]`,
      );
      setTargetRect(element?.getBoundingClientRect() ?? null);
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [active, step]);

  if (!active || !step) return null;

  const fallbackTop = 118;
  const fallbackLeft = 24;
  const popoverHeight = Math.min(300, window.innerHeight - 36);
  const panelTop = targetRect
    ? Math.min(
        window.innerHeight - popoverHeight - 18,
        Math.max(18, targetRect.bottom + 14),
      )
    : fallbackTop;
  const panelLeft = targetRect
    ? Math.max(18, Math.min(window.innerWidth - 360, targetRect.left))
    : fallbackLeft;

  return (
    <div className="tutorial-layer" aria-live="polite">
      {targetRect && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}
      <section
        className="tutorial-popover"
        role="dialog"
        aria-label="Active tutorial"
        style={{ top: panelTop, left: panelLeft }}
      >
        <div className="tutorial-kicker">
          <BookOpen size={18} />
          Tutorial {stepIndex + 1}/{stepCount}
        </div>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="tutorial-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button className="primary-action" type="button" onClick={onNext}>
            <CheckCircle2 size={18} />
            {step.nextLabel}
          </button>
          <button className="ghost-button" type="button" onClick={onSkip}>
            Skip
          </button>
        </div>
      </section>
    </div>
  );
}

function PlayPage() {
  const [state, setState] = useState<GameState>(initialGameState);
  const [showSummary, setShowSummary] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(true);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [siteTouched, setSiteTouched] = useState(false);
  const [activePanel, setActivePanel] = useState<"market" | "actions" | null>(
    null,
  );
  const supply = getSupplySummary(state);
  const builtSites = getBuiltSites(state);
  const selectableSites = getSelectableSites(state);
  const budgetRemaining = getBudgetRemaining(state);
  const annualBudget = getAnnualBudget(state);
  const plannedCost = getPlannedCost(state);
  const score = calculateScore(state);
  const visibleMetrics = getVisibleMetrics(state);
  const currentPeriod = getCurrentPeriod(state);
  const availableTutorialSteps = useMemo(
    () =>
      TUTORIAL_STEPS.filter((step) =>
        isUnlockStageAvailable(currentPeriod.unlockStage, step.unlockStage),
      ),
    [currentPeriod.unlockStage],
  );
  const activeTutorialStep = availableTutorialSteps[tutorialStepIndex];
  const displaySummary =
    showSummary || (state.phase === "finished" && !state.report);

  const restart = () => {
    setState(restartRun());
    setShowSummary(false);
    setTutorialActive(true);
    setTutorialStepIndex(0);
    setSiteTouched(false);
    setActivePanel(null);
  };

  const selectSite = (siteId: string) => {
    setSiteTouched(true);
    setState((current) => ({ ...current, selectedSiteId: siteId }));
    setActivePanel(null);
  };

  const runPlan = () => {
    setActivePanel(null);
    setState((current) => runAnnualPlan(current));
  };

  const continueReport = () => {
    setState((current) => continueFromReport(current));
  };

  const reviewFinalScore = () => {
    setState((current) => ({ ...current, report: null }));
    setShowSummary(true);
  };

  const selectedThisPeriod = state.projects.filter(
    (project) => project.selectedPeriodIndex === state.periodIndex,
  );

  useEffect(() => {
    if (!tutorialActive || !activeTutorialStep) return;

    const completed =
      (activeTutorialStep.id === "market" && siteTouched) ||
      (activeTutorialStep.id === "campus" &&
        state.projects.some(
          (project) => project.cardId === "hyperscale-campus",
        )) ||
      (activeTutorialStep.id === "run" && Boolean(state.report)) ||
      (activeTutorialStep.id === "report" && state.phase === "planning");

    if (completed) {
      setTutorialStepIndex((current) => current + 1);
    }
  }, [
    activeTutorialStep,
    availableTutorialSteps.length,
    siteTouched,
    state.phase,
    state.projects,
    state.report,
    tutorialActive,
  ]);

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
            data-tutorial="run-plan"
            disabled={
              state.phase !== "planning" || selectedThisPeriod.length === 0
            }
          >
            <Play size={16} />
            Run period plan
          </button>
        </div>
      </section>

      <section className="score-band" aria-label="Run metrics">
        <MetricCard
          asset={generatedAssets.labels.year}
          label="Turn"
          value={`${getPeriodLabel(state)} / ${END_YEAR}`}
          tutorialTarget="metric-year"
        />
        <MetricCard
          asset={generatedAssets.labels.budget}
          label="Budget"
          value={`${formatBudget(budgetRemaining)} / ${formatBudget(annualBudget)}`}
          tone={budgetRemaining <= 2 ? "warning" : undefined}
          tutorialTarget="metric-budget"
          warningText="Low remaining budget means fewer projects can be funded this period."
        />
        <MetricCard
          icon={<Gauge size={16} />}
          label="Outlook"
          value={state.outlook}
          tone={state.outlook < 45 ? "warning" : undefined}
          tutorialTarget="metric-outlook"
          warningText="Weak outlook tightens next-period budget and project pricing."
        />
        <MetricCard
          asset={generatedAssets.labels.demand}
          label="Compute"
          value={`${supply.computeCoverage}%`}
          tone={supply.computeCoverage < 65 ? "warning" : undefined}
          tutorialTarget="metric-compute"
          warningText="Low compute coverage raises pressure and hurts the final demand test."
        />
        {visibleMetrics.has("power") && (
          <MetricCard
            asset={generatedAssets.labels.power}
            label="Power"
            value={`${supply.powerCoverage}%`}
            tone={supply.powerCoverage < 65 ? "warning" : undefined}
            tutorialTarget="metric-power"
            warningText="Low power coverage can block compute expansion."
          />
        )}
        {visibleMetrics.has("cooling") && (
          <MetricCard
            icon={<Gauge size={16} />}
            label="Cooling"
            value={`${supply.coolingCoverage}%`}
            tone={supply.coolingCoverage < 65 ? "warning" : undefined}
            tutorialTarget="metric-cooling"
            warningText="Low cooling coverage makes capacity less reliable."
          />
        )}
        {visibleMetrics.has("water") && (
          <MetricCard
            icon={<Waves size={16} />}
            label="Water"
            value={`${supply.waterCoverage}%`}
            tone={supply.waterCoverage < 65 ? "warning" : undefined}
            tutorialTarget="metric-water"
            warningText="Low water resilience damages support and permitting."
          />
        )}
        {visibleMetrics.has("peopleSupport") && (
          <MetricCard
            icon={<Flag size={16} />}
            label="People"
            value={supply.peopleSupport}
            tone={supply.peopleSupport < 45 ? "warning" : undefined}
            tutorialTarget="metric-support"
            warningText="Low public support raises review costs and can stop expansion."
          />
        )}
        {visibleMetrics.has("politicalSupport") && (
          <MetricCard
            icon={<Landmark size={16} />}
            label="Politics"
            value={supply.politicalSupport}
            tone={supply.politicalSupport < 45 ? "warning" : undefined}
            tutorialTarget="metric-politics"
            warningText="Low political support can block expansion."
          />
        )}
      </section>

      <div className="budget-meter" aria-label="Period budget used">
        <span
          style={{
            width: `${Math.min(100, (plannedCost / annualBudget) * 100)}%`,
          }}
        />
      </div>
      <InfrastructureStack
        builtCount={Math.min(builtSites.length, MAX_BUILDS)}
      />

      <section className="play-dashboard">
        <div className="map-stage" data-tutorial="market-map">
          <div className="map-topline">
            <div>
              <p className="eyebrow">US atlas</p>
              <h2>Starter slate: {selectableSites.length} markets</h2>
            </div>
            <span>{builtSites.length} built</span>
          </div>
          <UnitedStatesMap
            builtSiteIds={state.builtSiteIds}
            selectedSiteId={state.selectedSiteId}
            sites={selectableSites}
            onSelectSite={selectSite}
          />
          <AdvisorPanel state={state} compact />
        </div>
        <div className="command-column">
          <SelectedMarketSummary
            state={state}
            siteCount={selectableSites.length}
            onOpenMarket={() => setActivePanel("market")}
          />
          <section className="command-panel">
            <div className="panel-heading">
              <p className="eyebrow">Actions</p>
              <h2>{selectedThisPeriod.length} funded</h2>
            </div>
            <p>
              Open the action panel to fund unlocked projects, then run the
              period once your plan is ready.
            </p>
            <div className="command-panel__actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => setActivePanel("actions")}
                data-tutorial="open-actions"
              >
                <Plus size={16} />
                Fund actions
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setActivePanel("market")}
              >
                <MapPin size={16} />
                Markets
              </button>
            </div>
            <div className="command-score">
              <span>Score projection</span>
              <strong>{score.score}</strong>
              <small>
                Target {WIN_SCORE} + {MIN_DEMAND_TO_WIN}% final compute
              </small>
            </div>
          </section>
        </div>
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
      <TutorialOverlay
        active={tutorialActive}
        step={activeTutorialStep}
        stepIndex={tutorialStepIndex}
        stepCount={availableTutorialSteps.length}
        onBack={() =>
          setTutorialStepIndex((current) => Math.max(0, current - 1))
        }
        onNext={() => {
          setTutorialStepIndex((current) => current + 1);
        }}
        onSkip={() => setTutorialActive(false)}
      />
      {activePanel === "market" && (
        <CommandModal
          eyebrow="Market slate"
          title={
            state.builtSiteIds.length === 0
              ? "Choose from 3 starter markets"
              : "Choose a regional market"
          }
          onClose={() => setActivePanel(null)}
        >
          <SitePanel
            state={state}
            sites={selectableSites}
            onSelectSite={selectSite}
          />
        </CommandModal>
      )}
      {activePanel === "actions" && (
        <CommandModal
          eyebrow="Funding panel"
          title="Fund unlocked actions"
          onClose={() => setActivePanel(null)}
          wide
        >
          <ActionCardGrid
            state={state}
            setState={setState}
            initialSiteConfirmed={siteTouched}
          />
          <AnnualPlanTray state={state} setState={setState} />
        </CommandModal>
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
