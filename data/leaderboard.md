# Leaderboard Persistence

The leaderboard is stored through the same-origin `/api/leaderboard` Vercel
Edge Function and an Upstash Redis database. The client does not seed scores
and does not write browser-local leaderboard state.

## Required Environment

Provision an Upstash Redis resource through the Vercel Marketplace and connect
it to this project. Vercel should inject:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The API also accepts the legacy `KV_REST_API_URL` and `KV_REST_API_TOKEN`
variable names for migrated Vercel KV projects.

## API Contract

- `GET /api/leaderboard` returns the current top real submissions.
- `POST /api/leaderboard` validates and stores a submitted score.
- `DELETE /api/leaderboard` resets the leaderboard only when the request uses
  `Authorization: Bearer $LEADERBOARD_ADMIN_TOKEN`.

Set `LEADERBOARD_ADMIN_TOKEN` in Vercel when reset access is needed. Do not
expose that value to the browser.
