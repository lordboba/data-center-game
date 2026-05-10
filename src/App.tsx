import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  Award,
  BatteryCharging,
  BookOpen,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  Play,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import { UnitedStatesMap } from "./components/UnitedStatesMap";
import {
  DATA_CENTER_SITES,
  DEFAULT_GAME_MODE_ID,
  GAME_MODES,
  MAX_BUILDS,
  MIN_DEMAND_TO_WIN,
  WIN_SCORE,
} from "./data/gameData";
import type { GameModeId } from "./data/gameData";
import { useLeaderboard } from "./hooks/useLeaderboard";
import {
  advancePeriod,
  buildSite,
  calculateScore,
  canBuildSite,
  finishRun,
  formatBudget,
  GameState,
  getAffordableSites,
  getBuiltSites,
  getCurrentPeriodLabel,
  getGameMode,
  getRunOutcome,
  initialGameState,
  restartRun,
  selectNextCandidate,
} from "./lib/gameEngine";

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
          <p className="eyebrow">Grid strategy simulator</p>
          <h1>Data Center Game</h1>
          <p className="lede">
            Pick a six-site US footprint, balance latency against power and climate risk, then post
            the run to the leaderboard.
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
              <span>Build slots</span>
              <strong>{MAX_BUILDS}</strong>
            </div>
            <div>
              <span>Pace</span>
              <strong>Month/Qtr</strong>
            </div>
          </div>
        </div>
        <div className="home-map-panel" aria-label="United States map preview">
          <UnitedStatesMap compact />
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "good" | "warning";
}) {
  return (
    <div className={`metric-card ${tone ? `metric-card--${tone}` : ""}`}>
      <span className="metric-card__icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SitePanel({
  state,
  setState,
  mode,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  mode: ReturnType<typeof getGameMode>;
}) {
  const selectedSite = DATA_CENTER_SITES.find((site) => site.id === state.selectedSiteId)!;
  const score = calculateScore(state.builtSiteIds, state.missedPeriods);
  const affordable = getAffordableSites(state);
  const builtSet = new Set(state.builtSiteIds);
  const canBuild = canBuildSite(state, selectedSite.id);

  const buildSelected = () => {
    setState((current) => {
      const next = buildSite(current, current.selectedSiteId, mode);
      if (next === current) return current;
      return { ...next, selectedSiteId: selectNextCandidate(next) };
    });
  };

  return (
    <aside className="decision-panel" aria-label="Site decision panel">
      <div className="turn-strip">
        <span>{mode.shortLabel} {Math.min(state.turn, mode.maxPeriods)} of {mode.maxPeriods}</span>
        <small>{state.builtSiteIds.length}/{MAX_BUILDS} builds</small>
        <button className="ghost-button" type="button" onClick={() => setState(restartRun())}>
          <RotateCcw size={16} />
          Restart
        </button>
      </div>

      <div className="selected-site">
        <p className="eyebrow">Selected market</p>
        <h2>
          {selectedSite.metro}
          <span>{selectedSite.state}</span>
        </h2>
        <p>{selectedSite.note}</p>
        <div className="site-metrics">
          <span>Build {formatBudget(selectedSite.capex)}</span>
          <span>{selectedSite.capacity} MW</span>
          <span>{selectedSite.region}</span>
        </div>
      </div>

      <div className="site-score-grid">
        <MetricCard icon={<Zap size={15} />} label="Latency" value={selectedSite.latency} />
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

      <button className="build-button" type="button" disabled={!canBuild} onClick={buildSelected}>
        {builtSet.has(selectedSite.id)
          ? "Already built"
          : selectedSite.capex > score.budgetRemaining
            ? "Insufficient budget"
            : "Build this site"}
        <ChevronRight size={18} />
      </button>

      <div className="site-list" aria-label="Candidate markets">
        {DATA_CENTER_SITES.map((site) => {
          const isBuilt = builtSet.has(site.id);
          const isSelected = site.id === selectedSite.id;
          const isAffordable = affordable.some((candidate) => candidate.id === site.id);

          return (
            <button
              key={site.id}
              type="button"
              className={[
                "site-list-item",
                isSelected ? "site-list-item--active" : "",
                isBuilt ? "site-list-item--built" : "",
              ].join(" ")}
              onClick={() => setState((current) => ({ ...current, selectedSiteId: site.id }))}
            >
              <span>
                {site.metro}
                <small>{site.state}</small>
              </span>
              <strong>{isBuilt ? "Built" : isAffordable ? formatBudget(site.capex) : "Locked"}</strong>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function RunSummary({
  state,
  onResume,
  onRestart,
}: {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const { addEntry } = useLeaderboard();
  const [playerName, setPlayerName] = useState("");
  const [saved, setSaved] = useState(false);
  const builtSites = getBuiltSites(state);
  const score = calculateScore(state.builtSiteIds, state.missedPeriods);
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
    <div className="summary-card" role="dialog" aria-modal="true" aria-label="Run summary">
      <div>
        <p className={`eyebrow outcome-${outcome.status}`}>{outcome.title}</p>
        <h2>{score.score}</h2>
        <p>
          {builtSites.length} {builtSites.length === 1 ? "market" : "markets"}, {score.capacity} MW, {score.demandCoverage}% demand coverage.
          {" "}
          {outcome.description}
        </p>
      </div>
      <div className="summary-metrics">
        <MetricCard icon={<MapPin size={16} />} label="Sites" value={builtSites.length} />
        <MetricCard icon={<Zap size={16} />} label="Latency" value={score.avgLatency} />
        <MetricCard icon={<Waves size={16} />} label="Water" value={score.avgWaterSecurity} />
        <MetricCard
          icon={<CircleDollarSign size={16} />}
          label="Budget left"
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
        <button className="primary-action" type="button" onClick={saveRun} disabled={saved}>
          <Trophy size={18} />
          {saved ? "Saved" : "Save score"}
        </button>
        <button className="secondary-action" type="button" onClick={() => navigate("/leaderboard")}>
          Leaderboard
        </button>
        <button className="ghost-button" type="button" onClick={onRestart}>
          New run
        </button>
        {!state.isFinished && (
          <button className="ghost-button" type="button" onClick={onResume}>
            Resume
          </button>
        )}
      </div>
    </div>
  );
}

function OnboardingOverlay({
  modeId,
  onModeChange,
  onStart,
}: {
  modeId: GameModeId;
  onModeChange: (modeId: GameModeId) => void;
  onStart: () => void;
}) {
  const selectedMode = getGameMode(modeId);

  return (
    <div className="summary-overlay">
      <section className="tutorial-card" role="dialog" aria-modal="true" aria-label="Game tutorial">
        <div className="tutorial-kicker">
          <BookOpen size={18} />
          Tutorial
        </div>
        <h2>Plan the footprint before the market moves past you.</h2>
        <div className="mode-picker" aria-label="Game pace">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={mode.id === modeId ? "mode-option mode-option--active" : "mode-option"}
              onClick={() => onModeChange(mode.id)}
            >
              <strong>{mode.label}</strong>
              <span>
                {mode.maxPeriods} {mode.shortLabel.toLowerCase()}s, {formatClock(mode.secondsPerPeriod)} each
              </span>
              <small>{mode.description}</small>
            </button>
          ))}
        </div>
        <button className="primary-action tutorial-start" type="button" onClick={onStart}>
          <Clock3 size={18} />
          Start {selectedMode.shortLabel.toLowerCase()} clock
        </button>
        <div className="tutorial-grid">
          <article>
            <span>1</span>
            <h3>Pick markets</h3>
            <p>
              Click real US candidate markets on the atlas. Each build spends budget and adds MW,
              latency reach, clean power, water security, and resilience.
            </p>
          </article>
          <article>
            <span>2</span>
            <h3>Watch the clock</h3>
            <p>
              After this screen, each {selectedMode.shortLabel.toLowerCase()} advances automatically
              every {formatClock(selectedMode.secondsPerPeriod)}. If the timer expires, that window is
              missed and your final score takes a penalty.
            </p>
          </article>
          <article>
            <span>3</span>
            <h3>Win or lose</h3>
            <p>
              Win by finishing with {MAX_BUILDS} builds, at least {WIN_SCORE} points, and{" "}
              {MIN_DEMAND_TO_WIN}% demand coverage. Lose if the planning window closes below either
              threshold or you strand the budget.
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
  const [modeId, setModeId] = useState<GameModeId>(DEFAULT_GAME_MODE_ID);
  const mode = getGameMode(modeId);
  const [secondsLeft, setSecondsLeft] = useState(mode.secondsPerPeriod);
  const score = calculateScore(state.builtSiteIds, state.missedPeriods);
  const builtSites = getBuiltSites(state);
  const displaySummary = showSummary || state.isFinished;
  const timerActive = !tutorialOpen && !displaySummary;
  const currentPeriodLabel = getCurrentPeriodLabel(state, mode);

  useEffect(() => {
    setSecondsLeft(mode.secondsPerPeriod);
  }, [mode.secondsPerPeriod, state.turn]);

  useEffect(() => {
    if (!timerActive) return undefined;

    const id = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setState((existing) => advancePeriod(existing, mode));
          return mode.secondsPerPeriod;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [mode, timerActive]);

  const finish = () => {
    setState((current) => finishRun(current));
    setShowSummary(true);
  };

  const restart = () => {
    setState(restartRun());
    setShowSummary(false);
    setTutorialOpen(true);
    setSecondsLeft(mode.secondsPerPeriod);
  };

  const manuallyAdvancePeriod = () => {
    setState((current) => advancePeriod(current, mode));
    setSecondsLeft(mode.secondsPerPeriod);
  };

  const progress = Math.round((Math.min(state.turn - 1, mode.maxPeriods) / mode.maxPeriods) * 100);

  return (
    <main className="play-page">
      <section className="game-header">
        <div>
          <p className="eyebrow">Operator console</p>
          <h1>Build a national AI compute footprint</h1>
        </div>
        <div className="run-controls">
          <button className="ghost-button" type="button" onClick={manuallyAdvancePeriod}>
            <Clock3 size={16} />
            Advance {mode.shortLabel.toLowerCase()}
          </button>
          <button className="secondary-action" type="button" onClick={finish}>
            End run
          </button>
        </div>
      </section>

      <section className="score-band" aria-label="Run metrics">
        <MetricCard
          icon={<Clock3 size={16} />}
          label={`${currentPeriodLabel} clock`}
          value={formatClock(secondsLeft)}
        />
        <MetricCard icon={<MapPin size={16} />} label="Builds" value={`${builtSites.length}/${MAX_BUILDS}`} />
        <MetricCard icon={<Award size={16} />} label="Score" value={score.score} />
        <MetricCard
          icon={<CircleDollarSign size={16} />}
          label="Budget"
          value={formatBudget(score.budgetRemaining)}
          tone={score.budgetRemaining < 20 ? "warning" : undefined}
        />
        <MetricCard icon={<Zap size={16} />} label="Demand" value={`${score.demandCoverage}%`} />
        <MetricCard
          icon={<BatteryCharging size={16} />}
          label="Clean power"
          value={score.avgCleanPower || "-"}
        />
      </section>

      <div className="turn-progress" aria-label="Turn progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="game-layout">
        <div className="map-stage">
          <div className="map-topline">
            <div>
              <p className="eyebrow">US atlas</p>
              <h2>Click a market on the map</h2>
            </div>
            <span>{builtSites.length} built</span>
          </div>
          <UnitedStatesMap
            builtSiteIds={state.builtSiteIds}
            selectedSiteId={state.selectedSiteId}
            onSelectSite={(siteId) => setState((current) => ({ ...current, selectedSiteId: siteId }))}
          />
        </div>
        <SitePanel state={state} setState={setState} mode={mode} />
      </section>

      {displaySummary && (
        <div className="summary-overlay">
          <RunSummary
            state={state}
            onResume={() => setShowSummary(false)}
            onRestart={restart}
          />
        </div>
      )}
      {tutorialOpen && (
        <OnboardingOverlay
          modeId={modeId}
          onModeChange={(nextModeId) => {
            setModeId(nextModeId);
            setState(restartRun());
            setShowSummary(false);
            setSecondsLeft(getGameMode(nextModeId).secondsPerPeriod);
          }}
          onStart={() => setTutorialOpen(false)}
        />
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
              <p>{entry.sites.join(" / ")}</p>
            </div>
            <div className="leaderboard-stats">
              <span>
                <strong>{entry.score}</strong>
                score
              </span>
              <span>
                <strong>{entry.capacity}</strong>
                MW
              </span>
              <span>
                <strong>{entry.demandCoverage}%</strong>
                demand
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
