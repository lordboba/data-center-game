import { useCallback, useEffect, useMemo, useState } from "react";
import { ScoreBreakdown } from "../lib/gameEngine";
import {
  LEADERBOARD_API_PATH,
  LeaderboardCreateResponse,
  LeaderboardEntry,
  LeaderboardListResponse,
  LeaderboardSubmission,
  rankLeaderboardEntries,
} from "../shared/leaderboard";

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.playerName === "string" &&
    typeof entry.score === "number" &&
    typeof entry.capacity === "number" &&
    typeof entry.demandCoverage === "number" &&
    typeof entry.budgetRemaining === "number" &&
    Array.isArray(entry.sites) &&
    entry.sites.every((site) => typeof site === "string") &&
    typeof entry.createdAt === "string"
  );
}

function parseLeaderboardList(value: unknown): LeaderboardEntry[] {
  if (!value || typeof value !== "object") return [];
  const entries = (value as LeaderboardListResponse).entries;
  if (!Array.isArray(entries)) return [];
  return rankLeaderboardEntries(entries.filter(isLeaderboardEntry));
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const value = (await response.json()) as { error?: unknown };
    if (typeof value.error === "string" && value.error.trim()) {
      return value.error;
    }
  } catch {
    // The API should return JSON errors, but a generic message is clearer than
    // exposing an HTML fallback body from local dev servers.
  }

  return "Leaderboard is unavailable.";
}

function buildSubmission(
  playerName: string,
  breakdown: ScoreBreakdown,
  sites: string[],
): LeaderboardSubmission {
  return {
    playerName,
    score: breakdown.score,
    capacity: breakdown.capacity,
    demandCoverage: breakdown.demandCoverage,
    budgetRemaining: breakdown.budgetRemaining,
    sites,
  };
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshEntries = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(LEADERBOARD_API_PATH, {
        headers: { accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as LeaderboardListResponse;
      setEntries(parseLeaderboardList(payload));
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return;
      }
      const message =
        caught instanceof Error
          ? caught.message
          : "Leaderboard is unavailable.";
      setEntries([]);
      setError(message);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshEntries(controller.signal);
    return () => controller.abort();
  }, [refreshEntries]);

  const addEntry = useCallback(
    async (playerName: string, breakdown: ScoreBreakdown, sites: string[]) => {
      const response = await fetch(LEADERBOARD_API_PATH, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(buildSubmission(playerName, breakdown, sites)),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as LeaderboardCreateResponse;
      if (!isLeaderboardEntry(payload.entry)) {
        throw new Error("Leaderboard returned an invalid saved score.");
      }

      const nextEntries = parseLeaderboardList(payload);
      setEntries(nextEntries.length > 0 ? nextEntries : [payload.entry]);
      setError(null);
      return payload.entry;
    },
    [],
  );

  const bestScore = useMemo(() => entries[0]?.score ?? null, [entries]);

  return {
    entries,
    addEntry,
    refreshEntries,
    bestScore,
    loading,
    error,
  };
}
