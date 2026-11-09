# PromptPilot AI — Runbook

Production: https://promptpilot-ai-psi.vercel.app (Vercel Hobby project `promptpilot-ai`). Database: Supabase free tier (Mumbai). Everything here uses free tiers only.

## 1. Health check (first thing to run)

```bash
curl -s https://promptpilot-ai-psi.vercel.app/api/health
```

Returns booleans only, never secret values:

| Field | Meaning |
|---|---|
| `commit` | First 7 chars of the deployed git SHA. Compare with `git rev-parse --short HEAD` on `main`. |
| `checks.supabase` | Public Supabase URL + anon key are set (login, cloud saves, library). |
| `checks.serviceRole` | `SUPABASE_SERVICE_ROLE_KEY` set: shared daily caps via `consume_run_quota`. |
| `checks.runProviders` / `runEnabled` | How many free Run providers have keys (Groq, Workers AI, Gemini if enabled). |
| `checks.turnstile` | Turnstile secret set (bot check on Run). |

Other quick checks: `/api/keep-alive` (cron, returns library `count`), `POST /api/enhance` with `{}` must return 400 `VALIDATION`.

## 2. Deploy

Normal path: push to `main`. GitHub Actions runs `check` (typecheck, lint, vitest, build, bundle-check, Playwright + axe), `secrets-scan` (gitleaks), `rls` (scratch Postgres) and `lighthouse` (continue-on-error, see `docs/PERFORMANCE.md`).

Manual production deploy from a clean checkout of `main`:

```bash
npm ci && npm run check && npm run build   # same gates as CI
npx vercel@latest --prod --yes             # needs `vercel login` / linked .vercel/project.json
curl -s https://promptpilot-ai-psi.vercel.app/api/health   # confirm commit
```

Before pushing UI changes: update hard-counted e2e asserts (pack cards, template counts) in the same commit.

## 3. Rollback

Fastest (no rebuild): Vercel dashboard → Project `promptpilot-ai` → Deployments → pick the last good deployment → **Promote to Production** (Instant Rollback). CLI equivalent:

```bash
npx vercel@latest ls promptpilot-ai              # find the previous good deployment URL
npx vercel@latest rollback <deployment-url> --yes
```

Then fix forward with `git revert <sha>` on `main` and push, so the next deploy does not re-ship the bad commit. Confirm with `/api/health` `commit`.

Database changes are not rolled back by Vercel. Migrations in `supabase/migrations/` are idempotent (`create … if not exists`, `drop policy if exists`); write a new forward migration instead of editing an applied one.

## 4. Keys and environment variables

Set in Vercel → Project → Settings → Environment Variables (Production), then redeploy. Never commit values; `.env.example` lists names only. Server secrets must not start with `NEXT_PUBLIC_`.

| Feature | Vars | Where to get it (free) |
|---|---|---|
| Login, saves, library | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| Shared daily caps | `SUPABASE_SERVICE_ROLE_KEY`, `RUN_IP_SALT` (long random string) | Supabase → API (service role); salt: `openssl rand -hex 32` |
| Run (text) | `GROQ_API_KEY`; optional `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (Workers AI) | console.groq.com; Cloudflare dashboard → AI |
| Gemini (off by default) | `GEMINI_API_KEY` + `RUN_ENABLE_GEMINI=1` | Google AI Studio |
| Bot check on Run | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile → Add widget (domain `promptpilot-ai-psi.vercel.app`) |
| Cron auth | `CRON_SECRET` | Any random string; Vercel cron sends it automatically |
| Call metadata log | `RUN_LOG_CALLS=1` (optional) | Logs provider/model/latency only to `llm_calls`, never prompt text |

### Rotating a leaked key
1. Revoke/regenerate it at the provider (Groq, Cloudflare, Supabase).
2. Update the Vercel env var, redeploy, check `/api/health`.
3. If it was committed: gitleaks in CI will fail; rewrite is not enough, the key must be rotated.

## 5. Common incidents

| Symptom | Check | Fix |
|---|---|---|
| Run says "coming soon" | `runEnabled false` in health | Add `GROQ_API_KEY` in Vercel, redeploy |
| Run returns 504 / "took too long" | Vercel function logs for `api/run` (search by `x-request-id`) | Provider slow; fallback chain retries Workers AI. Runs that time out are refunded |
| Many 429s | `X-RateLimit-Store` header (`supabase` or `memory`) | Limits in `src/lib/ratelimit`; daily caps need service role + `0004_run_quota.sql` |
| Library empty / keep-alive `count: 0` | `/api/keep-alive` | Apply `supabase/migrations/0007_seed_library.sql` in the SQL editor |
| Supabase paused (free tier idles after inactivity) | Supabase dashboard | Restore project; keep-alive cron (`vercel.json`, daily 03:00 UTC) prevents this |
| CSP violations | Logs for `api/csp-report` | CSP is report-only; add the origin in `src/lib/security-headers.ts` |

## 6. Logs

Vercel → Project → Logs. Every API route writes one JSON line per request (`route`, `requestId`, `method`, `path`, `status`, `durationMs`); users see the same id in error pages and the `x-request-id` header. Prompt text and secret-looking fields are not logged.

## 7. Backups (Day 15)

Don't rely on dashboard backups on the free tier. Export manually: `pg_dump --schema-only` and a data dump of public tables using the connection string from Supabase → Connect. Store outside the repo.
