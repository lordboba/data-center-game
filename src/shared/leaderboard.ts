export const LEADERBOARD_API_PATH = "/api/leaderboard";
export const LEADERBOARD_DISPLAY_LIMIT = 12;

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

export type LeaderboardSubmission = {
  playerName: string;
  score: number;
  capacity: number;
  demandCoverage: number;
  budgetRemaining: number;
  sites: string[];
};

export type LeaderboardListResponse = {
  entries: LeaderboardEntry[];
};

export type LeaderboardCreateResponse = LeaderboardListResponse & {
  entry: LeaderboardEntry;
};

export function rankLeaderboardEntries(
  entries: LeaderboardEntry[],
  limit = LEADERBOARD_DISPLAY_LIMIT,
): LeaderboardEntry[] {
  return [...entries]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    })
    .slice(0, limit);
}
