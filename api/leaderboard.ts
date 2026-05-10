import { Redis } from "@upstash/redis/cloudflare";
import { DEFAULT_DIFFICULTY_ID, isDifficultyId } from "../src/data/difficulty";
import {
  LEADERBOARD_DISPLAY_LIMIT,
  LeaderboardEntry,
  LeaderboardSubmission,
  rankLeaderboardEntries,
} from "../src/shared/leaderboard";

export const config = {
  runtime: "edge",
};

const RANKING_KEY = "data-center-game:leaderboard:v1:ranking";
const ENTRY_KEY_PREFIX = "data-center-game:leaderboard:v1:entry:";
const RATE_LIMIT_KEY_PREFIX = "data-center-game:leaderboard:v1:rate:";
const STORED_ENTRY_LIMIT = 250;
const SUBMISSION_LIMIT_PER_MINUTE = 10;

type Environment = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  LEADERBOARD_ADMIN_TOKEN?: string;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let redisClient: Redis | null = null;

function environment(): Environment {
  const globalProcess = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;

  return globalProcess?.env ?? {};
}

function redis(): Redis {
  if (redisClient) return redisClient;

  const env = environment();
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new ApiError("Leaderboard storage is not configured.", 503);
  }

  redisClient = new Redis({
    url,
    token,
    automaticDeserialization: false,
  });
  return redisClient;
}

function entryKey(id: string): string {
  return `${ENTRY_KEY_PREFIX}${id}`;
}

function jsonResponse(
  body: Record<string, unknown>,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers,
    },
  });
}

function numberField(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) {
    throw new ApiError(`${fieldName} must be a finite number.`, 400);
  }

  const numberValue = Number(value);
  if (numberValue < minimum || numberValue > maximum) {
    throw new ApiError(`${fieldName} is outside the allowed range.`, 400);
  }

  return Math.round(numberValue);
}

function textField(value: unknown, fallback: string, maximumLength: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return fallback;
  return trimmed.slice(0, maximumLength);
}

function siteList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const uniqueSites = new Set<string>();
  for (const site of value) {
    if (typeof site !== "string") continue;
    const cleanSite = textField(site, "", 64);
    if (cleanSite) uniqueSites.add(cleanSite);
    if (uniqueSites.size >= 24) break;
  }

  return [...uniqueSites];
}

function submissionFromBody(body: unknown): LeaderboardSubmission {
  if (!body || typeof body !== "object") {
    throw new ApiError("Submission must be a JSON object.", 400);
  }

  const input = body as Record<string, unknown>;
  return {
    playerName: textField(input.playerName, "Operator", 22),
    difficultyId: isDifficultyId(input.difficultyId)
      ? input.difficultyId
      : DEFAULT_DIFFICULTY_ID,
    score: numberField(input.score, "score", 0, 1_000_000),
    capacity: numberField(input.capacity, "capacity", 0, 1_000_000),
    demandCoverage: numberField(input.demandCoverage, "demandCoverage", 0, 100),
    budgetRemaining: numberField(
      input.budgetRemaining,
      "budgetRemaining",
      -1_000,
      1_000,
    ),
    sites: siteList(input.sites),
  };
}

function parseStoredEntry(value: unknown): LeaderboardEntry | null {
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value) as LeaderboardEntry;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.playerName !== "string" ||
      !isDifficultyId(parsed.difficultyId) ||
      typeof parsed.score !== "number" ||
      typeof parsed.capacity !== "number" ||
      typeof parsed.demandCoverage !== "number" ||
      typeof parsed.budgetRemaining !== "number" ||
      !Array.isArray(parsed.sites) ||
      !parsed.sites.every((site) => typeof site === "string") ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isStoredEntry(
  entry: LeaderboardEntry | null,
): entry is LeaderboardEntry {
  return entry !== null;
}

async function readEntries(client: Redis): Promise<LeaderboardEntry[]> {
  const ids = await client.zrange<string[]>(
    RANKING_KEY,
    0,
    LEADERBOARD_DISPLAY_LIMIT - 1,
    { rev: true },
  );

  if (ids.length === 0) return [];

  const values = await client.mget<(string | null)[]>(
    ...ids.map((id) => entryKey(id)),
  );
  return rankLeaderboardEntries(
    values.map(parseStoredEntry).filter(isStoredEntry),
  );
}

async function trimStoredEntries(client: Redis): Promise<void> {
  const idsToRemove = await client.zrange<string[]>(
    RANKING_KEY,
    0,
    -(STORED_ENTRY_LIMIT + 1),
  );
  if (idsToRemove.length === 0) return;

  const pipeline = client.pipeline();
  pipeline.zrem(RANKING_KEY, ...idsToRemove);
  pipeline.del(...idsToRemove.map(entryKey));
  await pipeline.exec();
}

async function saveEntry(
  client: Redis,
  submission: LeaderboardSubmission,
): Promise<LeaderboardEntry> {
  const entry: LeaderboardEntry = {
    id: crypto.randomUUID(),
    ...submission,
    createdAt: new Date().toISOString(),
  };

  const pipeline = client.pipeline();
  pipeline.set(entryKey(entry.id), JSON.stringify(entry));
  pipeline.zadd<string>(RANKING_KEY, {
    score: entry.score,
    member: entry.id,
  });
  await pipeline.exec();
  await trimStoredEntries(client);

  return entry;
}

function clientAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedAddress = forwardedFor?.split(",")[0]?.trim();
  if (firstForwardedAddress) return firstForwardedAddress;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function enforceSubmissionRateLimit(
  client: Redis,
  request: Request,
): Promise<void> {
  const key = `${RATE_LIMIT_KEY_PREFIX}${clientAddress(request)}`;
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, 60);
  }

  if (count > SUBMISSION_LIMIT_PER_MINUTE) {
    throw new ApiError(
      "Too many leaderboard submissions. Try again later.",
      429,
    );
  }
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? request.headers.get("x-leaderboard-admin-token");
}

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const leftDigest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(left)),
  );
  const rightDigest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(right)),
  );

  let difference = leftDigest.length ^ rightDigest.length;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index] ^ rightDigest[index];
  }

  return difference === 0;
}

async function resetEntries(
  client: Redis,
  request: Request,
): Promise<Response> {
  const adminToken = environment().LEADERBOARD_ADMIN_TOKEN;
  if (!adminToken) {
    throw new ApiError("Leaderboard reset is not configured.", 503);
  }

  const suppliedToken = bearerToken(request);
  if (!suppliedToken || !(await timingSafeEqual(suppliedToken, adminToken))) {
    throw new ApiError("Unauthorized leaderboard reset.", 401);
  }

  const ids = await client.zrange<string[]>(RANKING_KEY, 0, -1);
  if (ids.length === 0) return jsonResponse({ entries: [] });

  await client.del(RANKING_KEY, ...ids.map(entryKey));
  return jsonResponse({ entries: [] });
}

async function requestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON.", 400);
  }
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const client = redis();

    if (request.method === "GET") {
      return jsonResponse({ entries: await readEntries(client) });
    }

    if (request.method === "POST") {
      await enforceSubmissionRateLimit(client, request);
      const submission = submissionFromBody(await requestBody(request));
      const entry = await saveEntry(client, submission);
      return jsonResponse(
        { entry, entries: await readEntries(client) },
        { status: 201 },
      );
    }

    if (request.method === "DELETE") {
      return await resetEntries(client, request);
    }

    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  } catch (caught) {
    if (caught instanceof ApiError) {
      return jsonResponse({ error: caught.message }, { status: caught.status });
    }

    return jsonResponse(
      { error: "Leaderboard request failed." },
      { status: 500 },
    );
  }
}
