import { useCallback, useEffect, useMemo, useState } from "react";
import { ScoreBreakdown } from "../lib/gameEngine";

const LEADERBOARD_KEY = "data-center-game-leaderboard-v1";

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  score: number;
  capacity: number;
  demandCoverage: number;
  budgetRemaining: number;
  sites: string[];
  createdAt: string;
};

const starterEntries: LeaderboardEntry[] = [
  {
    id: "seed-1",
    playerName: "Grid Hawk",
    score: 731,
    capacity: 173,
    demandCoverage: 96,
    budgetRemaining: 21,
    sites: ["Ashburn", "Chicago", "Dallas", "Hillsboro", "Columbus", "Quincy"],
    createdAt: new Date("2026-05-01T12:00:00.000Z").toISOString(),
  },
  {
    id: "seed-2",
    playerName: "Cool Roof",
    score: 704,
    capacity: 165,
    demandCoverage: 89,
    budgetRemaining: 28,
    sites: ["Des Moines", "Dallas", "Atlanta", "Quincy", "Raleigh", "Omaha"],
    createdAt: new Date("2026-05-02T12:00:00.000Z").toISOString(),
  },
  {
    id: "seed-3",
    playerName: "Latency Desk",
    score: 682,
    capacity: 156,
    demandCoverage: 92,
    budgetRemaining: 16,
    sites: ["Secaucus", "Ashburn", "Chicago", "Atlanta", "Dallas", "Omaha"],
    createdAt: new Date("2026-05-03T12:00:00.000Z").toISOString(),
  },
];

function readEntries(): LeaderboardEntry[] {
  if (typeof window === "undefined") return starterEntries;

  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);
    if (!stored) return starterEntries;
    const parsed = JSON.parse(stored) as LeaderboardEntry[];
    if (!Array.isArray(parsed)) return starterEntries;
    return parsed;
  } catch {
    return starterEntries;
  }
}

function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, 12);
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => rankEntries(readEntries()));

  useEffect(() => {
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback(
    (playerName: string, breakdown: ScoreBreakdown, sites: string[]) => {
      const cleanName = playerName.trim() || "Operator";
      const nextEntry: LeaderboardEntry = {
        id: crypto.randomUUID(),
        playerName: cleanName,
        score: breakdown.score,
        capacity: breakdown.capacity,
        demandCoverage: breakdown.demandCoverage,
        budgetRemaining: breakdown.budgetRemaining,
        sites,
        createdAt: new Date().toISOString(),
      };
      setEntries((current) => rankEntries([nextEntry, ...current]));
      return nextEntry;
    },
    [],
  );

  const clearEntries = useCallback(() => {
    setEntries(starterEntries);
  }, []);

  const bestScore = useMemo(() => entries[0]?.score ?? 0, [entries]);

  return {
    entries,
    addEntry,
    clearEntries,
    bestScore,
  };
}
