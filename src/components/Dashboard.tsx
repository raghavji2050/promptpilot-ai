"use client";
import { useState } from "react";
import Link from "next/link";
import { useSavedPrompts, type SavedPrompt } from "@/lib/saved";
import { useFavorites, useUsage } from "@/lib/favorites";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { getPrompt } from "@/content";
import { CopyButton } from "./CopyButton";

// Mirrors the free-plan limits in schema.sql consume_quota() / enforce_saved_prompt_cap().
const FREE_LIMITS: Record<string, { label: string; limit: number }> = {
  share_create: { label: "Share links created", limit: 20 },
  enhance_byok: { label: "AI enhancements (your key)", limit: 100 },
};

function ShareControl({ item, share }: { item: SavedPrompt; share: (id: string, v: "private" | "unlisted") => Promise<string | null> }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const url = item.share_slug && typeof window !== "undefined" ? `${window.location.origin}/s/${item.share_slug}` : null;
  async function run(v: "private" | "unlisted") {
    setBusy(true); setMsg(null);
    try { await share(item.id, v); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {url ? (
        <>
          <a className="break-all text-indigo-700 underline" href={url} target="_blank" rel="noopener noreferrer">{url}</a>
          <CopyButton text={url} label="Copy link" />
          <button className="btn-secondary" disabled={busy} onClick={() => run("private")}>Stop sharing</button>
        </>
      ) : (
        <button className="btn-secondary" disabled={busy} onClick={() => run("unlisted")}>{busy ? "Creating…" : "Create share link"}</button>
      )}
      {msg && <span className="text-rose-700">{msg}</span>}
    </div>
  );
}

export function Dashboard() {
  const { items, remove, share, remote, session, ready, error } = useSavedPrompts();
  const fav = useFavorites();
  const usage = useUsage();
  return (
    <div className="mt-6 space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        {!supabaseConfigured ? (
          <p className="text-slate-600">Accounts are not configured on this deployment. Your saved prompts are stored <strong>in this browser only</strong> (localStorage).</p>
        ) : session ? (
          <>
            <p className="text-slate-600">Signed in as <strong>{session.user.email}</strong>. Saved prompts and favorites sync to your account.</p>
            <button className="btn-secondary" onClick={() => getSupabase()?.auth.signOut()}>Sign out</button>
          </>
        ) : (
          <>
            <p className="text-slate-600">You&apos;re not signed in. Prompts you save are kept in this browser.</p>
            <Link className="btn-primary" href="/login">Sign in to sync</Link>
          </>
        )}
      </div>
      <section>
        <h2 className="text-xl font-semibold text-slate-900">Saved prompts {ready && <span className="text-sm font-normal text-slate-400">({items.length}{remote ? ", account" : ", this browser"})</span>}</h2>
        {error && <p className="mt-2 rounded bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {!ready ? <p className="mt-4 text-slate-500">Loading…</p> : items.length === 0 ? (
          <p className="mt-4 text-slate-500">Nothing saved yet. Use <strong>Save</strong> in the <Link className="text-indigo-700 underline" href="/builder">Builder</Link>, <Link className="text-indigo-700 underline" href="/enhancer">Enhancer</Link> or any prompt page.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li key={it.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{it.title}</p>
                    <p className="text-xs text-slate-500">{it.source}{it.target_id ? ` · ${it.target_id}` : ""} · {new Date(it.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton text={it.output} />
                    <button className="btn-secondary" onClick={() => remove(it.id)}>Delete</button>
                  </div>
                </div>
                <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-700">{it.output}</pre>
                {remote && <ShareControl item={it} share={share} />}
              </li>
            ))}
          </ul>
        )}
        {ready && !remote && supabaseConfigured && items.length > 0 && <p className="mt-2 text-xs text-slate-500">Sign in to create share links.</p>}
      </section>
      <section>
        <h2 className="text-xl font-semibold text-slate-900">Favorites {fav.ready && <span className="text-sm font-normal text-slate-400">({fav.slugs.length}{fav.remote ? ", account" : ", this browser"})</span>}</h2>
        {fav.error && <p className="mt-2 rounded bg-rose-50 p-3 text-sm text-rose-800">{fav.error}</p>}
        {fav.slugs.length === 0 ? <p className="mt-2 text-sm text-slate-500">Use ☆ Favorite on any library prompt.</p> : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {fav.slugs.map((s) => { const p = getPrompt(s); return p ? (
              <li key={s} className="card flex items-center justify-between gap-2 p-3 text-sm">
                <Link className="text-indigo-700 hover:underline" href={`/p/${s}`}>{p.title}</Link>
                <button className="text-xs text-slate-500 underline" onClick={() => fav.toggle(s).catch(() => {})}>Remove</button>
              </li>
            ) : null; })}
          </ul>
        )}
      </section>
      <section className="card p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Plan &amp; today&apos;s usage</h2>
        <p className="mt-1">Free. Paid plans are not available yet. See <Link className="text-indigo-700 underline" href="/pricing">Pricing</Link>.</p>
        {remote && (
          <ul className="mt-3 space-y-1">
            <li>Saved prompts: {items.length} / 25</li>
            {Object.entries(FREE_LIMITS).map(([k, v]) => (
              <li key={k}>{v.label}: {usage?.find((r) => r.action === k)?.count ?? 0} / {v.limit} today (UTC)</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
