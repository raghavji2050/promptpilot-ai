# PromptPilot AI — 15-day Production Plan (28 Oct → 11 Nov 2026)

Free-tier only (GitHub Actions free, Vercel Hobby, Supabase free). 🔑 = needs Raghav (keys / SQL / dashboard).

## Audit (27 Oct 2026)
- Next.js 16 + React 19, TS `strict: true`, `tsc` clean, ESLint clean, Vitest 288 tests passing.
- Existing: /privacy, /terms, sitemap.ts, robots.ts, /api/run (Groq/Workers/Turnstile; "coming soon" without keys), /api/keep-alive cron.
- Gaps: no CI, no e2e, no health endpoint, SQL lives as loose files (not applied), no error monitoring, no rate limit on /api/enhance, no OG per page audit, README thin.

| Day | Date | Tasks | Acceptance checks |
|---|---|---|---|
| ✅ 1 | 28 Oct | GitHub Actions CI (typecheck, lint, test, build); `/api/health` status endpoint (booleans only); npm scripts | CI green on main; `/api/health` 200 live, no secret values; live smoke test passes |
| ✅ 2 | 28 Oct (planned 29 Oct) | Stricter TS (`noUncheckedIndexedAccess`), ESLint rules tightened; fix fallout | tsc+lint clean, CI green |
| ✅ 3 | 29 Oct (planned 30 Oct) | Playwright e2e: home → build prompt → copy; /pricing; /festivals (run in CI) | e2e green locally + CI |
| ✅ 4 | 30 Oct (planned 31 Oct) | Error handling: `error.tsx`/`global-error.tsx`, structured JSON logger for API routes (Vercel logs, free) | Forced error shows friendly page; logs have request id |
| ✅ 5 | 31 Oct (planned 1 Nov) | Security headers + CSP in next.config (report-only first), zod validation on all API inputs | securityheaders grade A-; bad payload → 400 |
| 🟡 6 | 1 Nov (planned 2 Nov) | Rate limiting on /api/enhance + /api/card (in-memory + Supabase fallback); 🔑 apply run-quota.sql | 429 after limit; quota table exists |
| 🟡 7 | 2 Nov (planned 3 Nov) | DB migrations into `supabase/migrations/` with ordered files; 🔑 Raghav runs seed-library, fix-function-grants, festivals in SQL editor | Library shows items; keep-alive count > 0 |
| ✅ 7b | 2 Nov (planned 3 Nov; extra, Raghav OK 1 Nov) | Agensi-inspired: "Export as SKILL.md" button on builder result; "Use in ChatGPT / Claude / Cursor" tabs with copy snippet per prompt | Download gives valid SKILL.md (name+description frontmatter); tabs copy correct text; e2e covers both |
| 8 | 4 Nov | RLS review + `schema_rls_test.sql` run; secrets hygiene (gitleaks in CI, `.env.example`) | RLS tests pass; gitleaks clean |
| 9 | 5 Nov | Auth + saved prompts hardening (session expiry, ownership checks, empty/error states) + tests | Other user can't read saved prompt; tests green |
| 10 | 6 Nov | Run executor robustness: timeouts, provider fallback, clear "coming soon" UX; 🔑 Groq, Cloudflare ID+token, Turnstile site+secret, Supabase service role in Vercel env | Without keys: graceful msg; with keys: text run works live |
| 11 | 7 Nov | Performance: Lighthouse CI (free), image/font optimisation, bundle check | Lighthouse perf ≥ 90 mobile on / |
| 12 | 8 Nov | Accessibility: axe in Playwright, labels, focus, contrast | 0 serious axe issues |
| 13 | 9 Nov | SEO: per-page metadata, OG images via /api/card, sitemap completeness, canonical; 🔑 enable Vercel Web Analytics toggle | All pages have title/desc/OG; sitemap lists all routes |
| 14 | 10 Nov | Legal pages review (privacy/terms updated for Run + analytics), README + docs/RUNBOOK (deploy, rollback, keys) | Pages live; README setup works from scratch |
| 15 | 11 Nov | Final production checklist + full live smoke test (10+ requests), backup export of Supabase schema/data (free) | Checklist all ticked; smoke test 100% |

## Progress log
- Day 1 (28 Oct): done. CI run 40557779959 green on main; live /api/health 200 (booleans only, commit f9d6db0); /, /pricing, /festivals 200; 8-request intent smoke test routed correctly.
- Day 2 (28 Oct, one day early): `noUncheckedIndexedAccess` + `noFallthroughCasesInSwitch` on; ESLint tightened (eqeqeq, no-explicit-any, consistent-type-imports, unused-vars, no-console, `--max-warnings 0`); ~113 type errors fixed; intent routing fixed (resume summary → career/resume, Laravel bug fix → coding/debugging) with regression tests. **Plan is now one day ahead of schedule.**

- Day 3 (29 Oct, one day early): Playwright e2e added (`e2e/smoke.spec.ts`, `npm run e2e`): home → generate prompt → copy (clipboard verified), empty-goal guard, /pricing (no payment buttons), /festivals, /api/health. 5/5 green locally; runs in CI after build.
- Day 4 (30 Oct, one day early): `src/app/error.tsx` + `global-error.tsx` (friendly message, error reference, Try again); `src/lib/log.ts` structured JSON logger + `withLogging` wrapper on /api/run, /api/enhance, /api/keep-alive (x-request-id header, one access line per request, secret-looking fields redacted, uncaught errors → safe 500 with requestId). Unit tests for logger + error page (297 passing).
- Day 5 (31 Oct, one day early): `src/lib/security-headers.ts` — CSP as `Content-Security-Policy-Report-Only` (self + Turnstile, Supabase, Vercel Analytics; frame-ancestors/object-src none), HSTS, COOP, tighter Permissions-Policy; new `/api/csp-report` (zod-validated, 8 KB cap, logs violations as JSON). zod already validated /api/run and /api/enhance bodies (bad payload → 400). 301 tests passing.

- Day 6 (1 Nov, one day early, code done, 🔑 pending): `src/lib/ratelimit` shared limiter used by /api/enhance (10/min + 200/day per IP), /api/card (30/min + 1000/day) and /api/run (6/min, plus its existing daily quota). It uses in-memory burst windows. When `SUPABASE_SERVICE_ROLE_KEY` is set and run-quota.sql is applied it also enforces a daily cap via `consume_run_quota` (hashed IP, kinds `enhance`/`card` added to run-quota.sql). If the table, RPC or role is missing or failing it falls back to in-memory with a 10-minute DB backoff and never returns a 500. Over the limit it returns 429 JSON `RATE_LIMITED` with Retry-After; X-RateLimit-Limit/Remaining are on every /api/enhance response. Tests: 314 passing (13 new). e2e 5/5 local; CI runs 41261594008 green (004afb3) and 41261797693 (a8fa81b). Live at a8fa81b: health ok, serviceRole false. /, /pricing, /festivals and /api/card are 200, and /api/enhance without a key gives 400 VALIDATION as expected. **No 429 was seen live after about 90 requests**, because Vercel spread them over many instances (X-RateLimit-Remaining jumped around 9→0→9), so in-memory limits are per instance only. 🔑 To get real shared limits: paste `supabase/PASTE_ME_pending.sql` in the Supabase SQL editor and add `SUPABASE_SERVICE_ROLE_KEY` in Vercel env. Until then Day 6 stays 🟡.

- Day 7 (2 Nov, one day early, code done, 🔑 pending Raghav paste): `supabase/migrations/0001_schema.sql` … `0007_seed_library.sql` (schema, function grants, festivals, run quota, Pro waitlist, builder share, library seed) generated from the loose files by `scripts/gen-migrations.py`, made idempotent (`drop policy/trigger if exists` added before every create) + `migrations/README.md` (run in order in the SQL editor). Tested locally on Postgres 17 with test-stubs.sql: all 7 applied twice with no errors (10 categories, 91 library items, 12 targets). `supabase/PASTE_ME_pending.sql` regenerated as 0002–0007 combined (one paste). Commit c00c40e. Live check: /api/keep-alive count 0, so library_items is still empty in Supabase. 🔑 Raghav: paste `supabase/PASTE_ME_pending.sql` once in Supabase SQL editor (and add `SUPABASE_SERVICE_ROLE_KEY` in Vercel env for Day 6 shared limits). Stays 🟡 until keep-alive count > 0.
- Day 7b (2 Nov, one day early): `src/lib/export-formats.ts` (SKILL.md with `name` kebab-case ≤64 chars + JSON-escaped one-line `description`; ChatGPT plain, Claude `<instructions>` wrap, Cursor `.mdc` rule with `alwaysApply: false`) and `ExportTabs` on both builder results (home + /builder): "Export as SKILL.md" download + ChatGPT/Claude/Cursor tablist (roles, aria-selected, arrow keys) with "Copy for …". Tests: 327 passing (13 new); e2e 6/6 local and 6/6 against live (new test checks the download frontmatter and all three clipboard snippets). Commit 7c5e6aa; CI run 41372922646 green; deployed, live /api/health at 7c5e6aa. Screenshot: /workspace/proof/2026-11-02/day7b-export-tabs-live.png.

## Final production checklist (Day 15)
- [ ] CI green, e2e green, Lighthouse ≥ 90, axe clean
- [ ] /api/health ok, runEnabled true (needs keys)
- [ ] CSP enforced, rate limits active, RLS tested
- [ ] All SQL migrations applied; keep-alive cron returning ok
- [ ] Privacy/terms current; README/RUNBOOK current
- [ ] No secrets in repo (gitleaks)
