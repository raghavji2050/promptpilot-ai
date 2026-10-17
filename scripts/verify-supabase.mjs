#!/usr/bin/env node
/**
 * End-to-end check of PromptPilot against a real Supabase project using ONLY the
 * publishable/anon key (same as the browser). Never prints keys.
 *
 *   node scripts/verify-supabase.mjs                      # anon-only RLS checks
 *   VERIFY_EMAIL_A=.. VERIFY_PASSWORD_A=.. VERIFY_EMAIL_B=.. VERIFY_PASSWORD_B=.. node scripts/verify-supabase.mjs
 *   VERIFY_SIGNUP=1 (with the vars above) first tries auth.signUp for both users.
 *
 * Test users must be real inboxes you control if email confirmation is enabled.
 * Rows created by the script are deleted at the end.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws"; // Node 20 has no global WebSocket; realtime-js requires a transport even if unused.

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local)"); process.exit(2); }

let pass = 0, fail = 0, skip = 0;
const ok = (name, cond, extra = "") => { if (cond) pass++; else fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`); };
const skipped = (name, why) => { skip++; console.log(`SKIP  ${name}  (${why})`); };
const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } });

// ---------- public auth settings (no signup needed) ----------
try {
  const r = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY } });
  const st = await r.json();
  console.log(`INFO  auth: signups ${st.disable_signup ? "DISABLED" : "enabled"}; email confirmation ${st.mailer_autoconfirm ? "OFF (autoconfirm)" : "ON — signUp sends a real email, no session until confirmed"}; providers: ${Object.entries(st.external ?? {}).filter(([, v]) => v).map(([k]) => k).join(", ")}`);
} catch (e) { console.log(`INFO  could not read auth settings: ${e.message}`); }

// ---------- anon ----------
const anon = client();
{
  const { data, error } = await anon.from("targets").select("id");
  ok("anon can read public targets", !error && data.length > 0, error?.message ?? `${data?.length} rows`);
}
{
  const { data, error } = await anon.from("library_items").select("slug", { count: "exact" }).limit(1);
  const { count } = await anon.from("library_items").select("*", { count: "exact", head: true });
  ok("anon can read published library_items", !error, error?.message ?? `${count ?? 0} published rows${count ? "" : " — run seed-library.sql for favorites"}`);
  void data;
}
for (const t of ["saved_prompts", "agent_kits"]) {
  const { data, error } = await anon.from(t).select("id,visibility");
  ok(`anon sees no private ${t}`, !!error || data.every((r) => r.visibility === "public"), error?.message ?? `${data.length} rows, all public`);
}
for (const t of ["favorites", "usage_counters", "purchases", "llm_calls", "profiles", "waitlist", "reports"]) {
  const { data, error } = await anon.from(t).select("*").limit(5);
  ok(`anon cannot read ${t}`, !!error || data.length === 0, error ? `denied: ${error.code ?? error.message}` : "0 rows");
}
{
  const { error } = await anon.from("saved_prompts").insert({ title: "x", source: "builder", output: "x" });
  ok("anon cannot insert saved_prompts", !!error, error?.code ?? "insert succeeded!");
}
{
  const { error } = await anon.rpc("consume_quota", { p_action: "share_create" });
  ok("anon cannot call consume_quota", !!error, error?.code ?? error?.message ?? "allowed!");
}
// Function EXECUTE grants. On Supabase, default privileges grant EXECUTE to anon directly,
// so "revoke ... from public" alone is not enough. 42501 = no EXECUTE (ideal).
// P0001 AUTH_REQUIRED = executed but failed closed (safe, but grant should be revoked).
// All probes are side-effect free (unknown ids / refs).
for (const [fn, args, mustDeny] of [
  ["grant_pro_from_purchase", { p_provider: "manual", p_ref: "verify-probe-nonexistent" }, true],
  ["create_share", { p_kind: "prompt", p_id: "00000000-0000-0000-0000-000000000000", p_visibility: "unlisted" }, false],
  ["consume_quota", { p_action: "report" }, false],
]) {
  const { error } = await anon.rpc(fn, args);
  const code = error?.code ?? "no error";
  if (code === "42501") ok(`anon has no EXECUTE on ${fn}`, true, code);
  else if (!mustDeny && /AUTH_REQUIRED/.test(error?.message ?? "")) ok(`anon ${fn} fails closed (AUTH_REQUIRED) — EXECUTE grant still present, apply supabase/fix-function-grants.sql`, true, code);
  else ok(`anon blocked from ${fn}`, false, `${code} ${error?.message ?? ""}`);
}
// Trigger functions must not be exposed as RPC (PostgREST hides trigger-returning functions).
for (const fn of ["handle_new_user", "enforce_saved_prompt_cap", "set_updated_at"]) {
  const { error } = await anon.rpc(fn, {});
  ok(`trigger fn ${fn} not callable via RPC`, !!error, error?.code ?? "callable!");
}
{
  const { data, error } = await anon.rpc("get_shared_prompt", { p_slug: "deadbeefdeadbeefde" });
  ok("anon get_shared_prompt(unknown) returns nothing", !error && data.length === 0, error?.message ?? "0 rows");
}

// ---------- authenticated ----------
const EA = process.env.VERIFY_EMAIL_A, PA = process.env.VERIFY_PASSWORD_A, EB = process.env.VERIFY_EMAIL_B, PB = process.env.VERIFY_PASSWORD_B;
if (!EA || !PA || !EB || !PB) {
  skipped("authenticated flows", "set VERIFY_EMAIL_A/PASSWORD_A/EMAIL_B/PASSWORD_B");
} else {
  async function signIn(email, password) {
    const c = client();
    if (process.env.VERIFY_SIGNUP === "1") {
      const { data, error } = await c.auth.signUp({ email, password });
      if (error && !/already registered/i.test(error.message)) console.log(`INFO  signUp ${email.replace(/(.).*@/, "$1***@")}: ${error.message}`);
      else if (data?.user && !data.session) console.log(`INFO  signUp ${email.replace(/(.).*@/, "$1***@")}: no session returned → email confirmation is ENABLED (confirm via inbox, then rerun without VERIFY_SIGNUP)`);
    }
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    return { c, user: data?.user ?? null, error };
  }
  const A = await signIn(EA, PA), B = await signIn(EB, PB);
  ok("user A can sign in", !!A.user, A.error?.message);
  ok("user B can sign in", !!B.user, B.error?.message);
  if (A.user && B.user) {
    const { data: prof } = await A.c.from("profiles").select("id,plan").eq("id", A.user.id).maybeSingle();
    ok("profile auto-created for A (handle_new_user trigger)", !!prof, prof ? `plan=${prof.plan}` : "missing");
    const { data: profB } = await A.c.from("profiles").select("id").eq("id", B.user.id);
    ok("A cannot read B's profile", (profB ?? []).length === 0);

    const ins = await A.c.from("saved_prompts").insert({ title: "verify-script prompt", source: "builder", target_id: "chatgpt", output: "## Task\nVerify." }).select("id").single();
    ok("A can save a prompt", !ins.error, ins.error?.message);
    const id = ins.data?.id;
    const listA = await A.c.from("saved_prompts").select("id").eq("id", id ?? "");
    ok("A can list own prompt", listA.data?.length === 1);
    const listB = await B.c.from("saved_prompts").select("id").eq("id", id ?? "");
    ok("B cannot see A's private prompt", (listB.data ?? []).length === 0);
    const listAnon = await anon.from("saved_prompts").select("id").eq("id", id ?? "");
    ok("anon cannot see A's private prompt", (listAnon.data ?? []).length === 0);
    const delB = await B.c.from("saved_prompts").delete().eq("id", id ?? "").select("id");
    ok("B cannot delete A's prompt", (delB.data ?? []).length === 0);
    const updB = await B.c.from("saved_prompts").update({ title: "hacked" }).eq("id", id ?? "").select("id");
    ok("B cannot update A's prompt", (updB.data ?? []).length === 0);
    const visA = await A.c.from("saved_prompts").update({ visibility: "public" }).eq("id", id ?? "");
    ok("A cannot set visibility directly (column grant; must use create_share)", !!visA.error, visA.error?.code ?? "allowed!");

    // share + quota
    const q = await A.c.rpc("consume_quota", { p_action: "share_create" });
    ok("A consume_quota(share_create)", !q.error && typeof q.data === "number" && q.data >= 0, q.error?.message ?? `remaining=${q.data}`);
    const sh = await A.c.rpc("create_share", { p_kind: "prompt", p_id: id, p_visibility: "unlisted" });
    ok("A create_share(unlisted) returns slug", !sh.error && typeof sh.data === "string", sh.error?.message);
    if (sh.data) {
      const g = await anon.rpc("get_shared_prompt", { p_slug: sh.data });
      ok("anon can open share link by slug", g.data?.length === 1 && g.data[0].output.includes("Verify"), g.error?.message);
      const enumAnon = await anon.from("saved_prompts").select("id").eq("id", id);
      ok("unlisted prompt not listable by anon via table", (enumAnon.data ?? []).length === 0);
      const shB = await B.c.rpc("create_share", { p_kind: "prompt", p_id: id, p_visibility: "public" });
      ok("B cannot share A's prompt", !!shB.error, shB.error?.message);
      const un = await A.c.rpc("create_share", { p_kind: "prompt", p_id: id, p_visibility: "private" });
      const g2 = await anon.rpc("get_shared_prompt", { p_slug: sh.data });
      ok("revoking share hides the link", !un.error && (g2.data ?? []).length === 0);
    }
    const uc = await A.c.from("usage_counters").select("action,count");
    ok("A can read own usage_counters", !uc.error && uc.data.some((r) => r.action === "share_create"), uc.error?.message);
    const ucB = await B.c.from("usage_counters").select("user_id").eq("user_id", A.user.id);
    ok("B cannot read A's usage_counters", (ucB.data ?? []).length === 0);

    // favorites
    const { data: item } = await A.c.from("library_items").select("id,slug").limit(1).maybeSingle();
    if (!item) skipped("favorites", "library_items empty — apply supabase/seed-library.sql");
    else {
      const f = await A.c.from("favorites").insert({ item_id: item.id });
      ok("A can favorite a library item", !f.error || f.error.code === "23505", f.error?.message ?? item.slug);
      const fa = await A.c.from("favorites").select("item_id, library_items(slug)");
      ok("A can list favorites with slug join", !fa.error && fa.data.some((r) => r.item_id === item.id), fa.error?.message);
      const fb = await B.c.from("favorites").select("item_id").eq("user_id", A.user.id);
      ok("B cannot see A's favorites", (fb.data ?? []).length === 0);
      const fx = await B.c.from("favorites").insert({ item_id: item.id, user_id: A.user.id });
      ok("B cannot insert favorites as A", !!fx.error, fx.error?.code ?? "allowed!");
      const fd = await A.c.from("favorites").delete().eq("item_id", item.id).select("item_id");
      ok("A can remove favorite", !fd.error && fd.data.length === 1, fd.error?.message);
    }

    const del = await A.c.from("saved_prompts").delete().eq("id", id ?? "").select("id");
    ok("A can delete own prompt", del.data?.length === 1, del.error?.message);
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`);
process.exit(fail ? 1 : 0);
