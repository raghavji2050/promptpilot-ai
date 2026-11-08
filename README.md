# PromptPilot AI

A free AI prompt builder. Describe a goal in plain English, Hindi or Hinglish, pick a platform, and get a structured prompt. The public builder, library, packs and showcase work with no account and no API key. Sign-in, saved prompts and the optional Run button turn on only when their environment variables are set.

Live site: [promptpilot-ai-psi.vercel.app](https://promptpilot-ai-psi.vercel.app)

## What is in the app

- **Prompt Builder** (`/builder`) — deterministic templates for ChatGPT, Claude, Gemini, Grok, Perplexity, Cursor, image and video tools. Anonymous visitors can use it without signing in. Shareable `?goal=` links and a classic field-by-field builder (`/builder/classic`) are included.
- **Library, categories and use cases** — static prompt library in `src/content/` (also the fallback when the Supabase seed is not applied), category pages and `/prompts-for` guides.
- **Prompt packs** (`/packs`) — Job Hunting, Students, Small Business, Freelancers and App Builder. Each template tells the model not to invent facts.
- **Showcase** (`/showcase`) — the same idea as a one-line prompt and as a PromptPilot prompt, with Try links into the builder. Example outputs on that page are written by us, not captured model responses.
- **Image & Reel builder** (`/image-reel-builder`) — festival posters, shop ads, WhatsApp status, shaadi invites and reels, formatted for Midjourney, Gemini, DALL·E or a video shot list.
- **Festival studios** (`/festivals`) — greetings, posts, reels and small-business campaigns, with dates in IST.
- **Enhancer** (`/enhancer`) — rule-based checks in the browser. Optional LLM polish sends the visitor's own key in the `x-llm-key` header to `/api/enhance` for that request only. The server does not store it.
- **Smart mode** (`/api/smart`) — provider chain when server keys exist, otherwise the same deterministic improve. The unpacked Chrome extension (`/extension`, source in `extension/`) calls this. It is not on the Chrome Web Store.
- **Exports** — copy, `SKILL.md`, ChatGPT custom instructions, Claude project instructions and Cursor rules (`src/lib/export-formats.ts`).
- **Accounts** — when Supabase env vars are set: magic-link login, saved prompts, favorites and unlisted `/s/<slug>` share links. Without them, saves stay in this browser's localStorage. Dashboard list and delete also filter on `user_id`.
- **SEO** — `sitemap.ts`, canonical URLs, Open Graph images (`opengraph-image.tsx` and `/api/card`) and JSON-LD for packs and showcase.
- **Pricing** — everything shipped is free. Pro is labelled coming soon. There is no checkout.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest
npm run check        # typecheck, lint, vitest
npm run e2e          # Playwright
npm run build && npm start
```

## Environment variables

Copy `.env.example` to `.env.local`. Every variable is optional. The template builder runs with none of them. Do not commit real values. Server secrets must not use the `NEXT_PUBLIC_` prefix.

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical, sitemap and OG base URL |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Magic-link login, cloud saves, favorites, share links |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Shared daily rate-limit counters via `consume_run_quota` |
| `GROQ_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY` | Server only. Optional free Run providers. Gemini stays off unless `RUN_ENABLE_GEMINI=1` |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional bot check on Run. Leave unset to skip it |
| `CRON_SECRET` | Protects `/api/keep-alive` when set |

### Supabase

1. Apply `supabase/migrations/` in numeric order (`0001` through `0007`). See `supabase/migrations/README.md`. If `0001` is already applied, `supabase/PASTE_ME_pending.sql` is `0002`–`0007` combined. Regenerate the library seed with `npx tsx scripts/gen-library-seed.ts` after editing `src/content`, then `python3 scripts/gen-migrations.py`.
2. Put the project URL and publishable (anon) key in `.env.local`.
3. `node scripts/verify-supabase.mjs` checks anon RLS. Authenticated checks need `VERIFY_EMAIL_A`, `VERIFY_PASSWORD_A`, `VERIFY_EMAIL_B` and `VERIFY_PASSWORD_B`. `supabase/schema_rls_test.sql` is for local Postgres, not the hosted project.

The publishable key is meant for the browser. The service-role key stays on the server. `/api/health` reports whether Supabase and the service role are configured, and does not return secret values.

## Layout

- `src/lib/engine/` — template engine (targets, render, analyzer, agent kit, universal builder, image/reel)
- `src/lib/llm/` and `src/lib/run/` — optional provider calls, quotas and rate limits
- `src/lib/seo.ts` — page metadata. The root title template is `%s | PromptPilot AI`. Titles that already end with the brand are marked `absolute` so the suffix is not repeated
- `src/content/` — library, packs and use cases
- `src/app/` — routes, sitemap, robots and JSON-LD
- `tests/` — vitest. `e2e/` — Playwright, including axe

## Known gaps

- Daily API caps are shared across instances only when `SUPABASE_SERVICE_ROLE_KEY` is set and `0004_run_quota.sql` is applied. Otherwise the limiter is in memory, per instance. A production response of 429 for the 200-run daily cap has not been recorded in the project notes.
- The SSRF guard on enhancer base URLs checks hostnames and IP literals. It does not resolve DNS.
- Payments are not implemented.
- Turnstile is implemented and off unless its env vars are set.
- There is no Cloudflare Workers adapter (OpenNext or vinext).
- Privacy and Terms are drafts and need legal review.
- The logger redacts field names that look like keys, tokens, secrets or passwords. It does not scan free-text error messages.
