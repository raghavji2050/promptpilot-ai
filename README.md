# PromptPilot AI (MVP)

A general-purpose AI prompt builder for everyone, built with Next.js App Router, TypeScript and Tailwind v4. Users describe a goal in plain language, pick an AI platform, and get a structured prompt. It runs fully with **no API keys and no database**.

Key pieces:
- `src/lib/categories/` — data-driven goal registry (10 categories A–J, subcategories with keywords, role, workflow, output, conditional fields, medical/legal/financial guardrails). Add a category or subcategory here and it appears in the builder, category pages and intent detection.
- `src/lib/engine/universal.ts` — deterministic generator: keyword intent detection, platform formatting (markdown / XML / search / image / video), Improve, Simplify, More detailed, Add missing context, variations, explanations, share-link params.
- `src/content/` — static prompt library (also the fallback when the Supabase seed isn't applied) and SEO use-case pages (`use-cases.ts`).
- Coding tools (agent kit, developer prompts) live under the Coding category.

## Quick start
```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest (engine, analyzer, agent kit, LLM layer, content)
npm run build && npm start
```

## Environment variables (all optional)
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical / sitemap / OG base URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables magic-link login and cloud-saved prompts. Apply `supabase/schema.sql` first. Without these, saves go to localStorage. |

### Supabase setup
1. Apply `supabase/schema.sql` (tables, RLS, functions). If you applied an older copy, also run `supabase/fix-function-grants.sql`. Then apply `supabase/seed-library.sql` (10 categories + all library prompts, needed for **favorites**). Regenerate the seed with `npx tsx scripts/gen-library-seed.ts` after editing `src/content`.
2. Put the URL and publishable key in `.env.local` (this file is gitignored).
3. Verify the live project with the publishable key only:
   ```bash
   node scripts/verify-supabase.mjs        # anon RLS checks
   VERIFY_EMAIL_A=… VERIFY_PASSWORD_A=… VERIFY_EMAIL_B=… VERIFY_PASSWORD_B=… node scripts/verify-supabase.mjs
   ```
   The authenticated checks cover save/list/delete, cross-user isolation, share links, quotas and favorites. Add `VERIFY_SIGNUP=1` to try signups first; it reports when email confirmation is enabled.

Account features when Supabase is configured: magic-link login, saved prompts, favorites (☆ on prompt pages), unlisted share links at `/s/<slug>` (`create_share` / `get_shared_prompt`, limited by the daily `share_create` quota), and today's usage on `/dashboard`.

The server never stores LLM keys. The Enhancer sends a user's own key per request in the `x-llm-key` header to `/api/enhance`, which proxies it to OpenAI, Anthropic, xAI or an OpenAI-compatible base URL (with an SSRF guard).

## Layout
- `src/lib/engine/`: pure template engine (targets, templates, render, analyzer, agent kit, studio)
- `src/lib/llm/`: provider abstraction, zod schema, rate limiter
- `src/content/`: prompt library (developer, social, general). Social items are labelled reported trend (with sources), seasonal, or evergreen.
- `src/app/`: routes, sitemap, robots and JSON-LD
- `tests/`: vitest suites

## Known gaps
- The rate limit is in memory and per instance. The SSRF guard checks hostnames and IPs but does not resolve DNS.
- There are no payments yet. Pro is shown as "planned".
- Supabase auth and saves have not been tested against a live project. Quota checks run from the browser, so they are a soft limit; the `/api/enhance` route does not check them on the server.
- No OG images, no E2E tests, and no Cloudflare adapter yet (OpenNext/vinext).
- Privacy and Terms are drafts and need legal review.
