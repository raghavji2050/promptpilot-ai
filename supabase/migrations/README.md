# Supabase migrations

Ordered, idempotent SQL for the PromptPilot database. **Run them in numeric order** in the Supabase dashboard → SQL Editor (New query → paste file → Run). Every file is safe to re-run (`if not exists`, `create or replace`, `drop policy/trigger if exists`, upserts).

| File | What it does |
|---|---|
| `0001_schema.sql` | Core schema: enums, tables, RLS policies, functions, `targets` seed |
| `0002_fix_function_grants.sql` | Removes anon EXECUTE on auth-only functions |
| `0003_festivals.sql` | Optional festival date overrides (public read) |
| `0004_run_quota.sql` | Run quota + daily API rate-limit caps (`consume_run_quota`, service role only) |
| `0005_pro_waitlist.sql` | Pro waitlist (insert-only) |
| `0006_builder_share.sql` | Short builder share links `/s/q12345678` |
| `0007_seed_library.sql` | Seeds 10 categories + 91 library items and bodies (upserts) |

Shortcut: if `0001` is already applied, paste `supabase/PASTE_ME_pending.sql` once — it is 0002–0007 combined.

The loose files in `supabase/` (`schema.sql`, `run-quota.sql`, …) are the editable sources. After editing one, regenerate with `python3 scripts/gen-migrations.py` (rewrites `migrations/` and `PASTE_ME_pending.sql`). `schema_rls_test.sql` and `test-stubs.sql` are for local Postgres testing only — never run them on Supabase.

Checked locally on Postgres 17 with `test-stubs.sql`: all 7 files applied twice in a row with no errors, then `PASTE_ME_pending.sql` re-applied cleanly (10 categories, 91 library items, 12 targets).
