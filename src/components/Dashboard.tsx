"use client";
import Link from "next/link";
import { useSavedPrompts } from "@/lib/saved";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { CopyButton } from "./CopyButton";

export function Dashboard() {
  const { items, remove, remote, session, ready, error } = useSavedPrompts();
  return (
    <div className="mt-6 space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        {!supabaseConfigured ? (
          <p className="text-slate-600">Accounts are not configured on this deployment. Your saved prompts are stored <strong>in this browser only</strong> (localStorage).</p>
        ) : session ? (
          <>
            <p className="text-slate-600">Signed in as <strong>{session.user.email}</strong>. Saved prompts sync to your account.</p>
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
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Plan</h2>
        <p className="mt-1">Free. Paid plans are not available yet. See <Link className="text-indigo-700 underline" href="/pricing">Pricing</Link>.</p>
      </section>
    </div>
  );
}
