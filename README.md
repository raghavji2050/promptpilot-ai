# PromptPilot AI (MVP)

A deterministic prompt builder and coding-agent context kit generator, built with Next.js App Router, TypeScript and Tailwind v4. It runs fully with **no API keys and no database**.

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
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables magic-link login and cloud-saved prompts. Apply `../schema.sql` first. Without these, saves go to localStorage. |

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
- Supabase auth and saves have not been tested against a live project. Share links and quotas from the schema are not wired into the UI.
- No OG images, no E2E tests, and no Cloudflare adapter yet (OpenNext/vinext).
- Privacy and Terms are drafts and need legal review.
