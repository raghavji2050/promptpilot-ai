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
| 6 | 2 Nov | Rate limiting on /api/enhance + /api/card (in-memory + Supabase fallback); 🔑 apply run-quota.sql | 429 after limit; quota table exists |
| 7 | 3 Nov | DB migrations into `supabase/migrations/` with ordered files; 🔑 Raghav runs seed-library, fix-function-grants, festivals in SQL editor | Library shows items; keep-alive count > 0 |
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

## Final production checklist (Day 15)
- [ ] CI green, e2e green, Lighthouse ≥ 90, axe clean
- [ ] /api/health ok, runEnabled true (needs keys)
- [ ] CSP enforced, rate limits active, RLS tested
- [ ] All SQL migrations applied; keep-alive cron returning ok
- [ ] Privacy/terms current; README/RUNBOOK current
- [ ] No secrets in repo (gitleaks)
