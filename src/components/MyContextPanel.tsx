"use client";
import { useState, useSyncExternalStore } from "react";
import { readContext, serverContext, subscribeContext, writeContext, hasContext, type MyContext } from "@/lib/my-context";

export function useMyContext(): MyContext {
  return useSyncExternalStore(subscribeContext, readContext, serverContext);
}

/** Collapsible form to save business, audience and voice on this device. Nothing is sent to our servers. */
export function MyContextPanel() {
  const ctx = useMyContext();
  const [draft, setDraft] = useState<MyContext | null>(null);
  const [msg, setMsg] = useState("");
  const d = draft ?? ctx;
  const set = (p: Partial<MyContext>) => setDraft({ ...d, ...p });
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  return (
    <details className="mt-4 rounded-lg border border-line p-3">
      <summary className="cursor-pointer text-sm font-medium text-fg">
        My context {hasContext(ctx) ? (ctx.enabled ? "· added to this prompt" : "· saved, off") : "· fill once, reuse in every prompt"}
      </summary>
      <p className="mt-2 text-xs text-subtle">Saved only in this browser (no account, not sent to our servers). It is added at the top of each prompt and fills [NICHE]-style blanks.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-subtle">About me / my business
          <input className="input mt-1 w-full" maxLength={300} value={d.business} onChange={(e) => set({ business: e.target.value })} placeholder="e.g. Home bakery in Mohali" />
        </label>
        <label className="text-xs text-subtle">My audience
          <input className="input mt-1 w-full" maxLength={300} value={d.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="e.g. Young families, Hindi + English" />
        </label>
        <label className="text-xs text-subtle">My voice and tone
          <input className="input mt-1 w-full" maxLength={300} value={d.voice} onChange={(e) => set({ voice: e.target.value })} placeholder="e.g. Warm, simple Hinglish" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary text-sm" onClick={() => { writeContext({ ...d, enabled: true }); setDraft(null); flash("Context saved on this device"); }}>Save my context</button>
        {hasContext(ctx) && (
          <>
            <button type="button" className="chip" aria-pressed={ctx.enabled} onClick={() => writeContext({ ...ctx, enabled: !ctx.enabled })}>{ctx.enabled ? "Turn off for now" : "Turn on"}</button>
            <button type="button" className="btn-ghost text-sm" onClick={() => { writeContext(null); setDraft(null); flash("Context cleared"); }}>Clear</button>
          </>
        )}
        {msg && <span className="text-xs text-subtle" role="status">{msg}</span>}
      </div>
    </details>
  );
}
