"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { CopyButton } from "./CopyButton";

type Row = { title: string; target_id: string | null; output: string; created_at: string };

export function SharedPrompt({ slug }: { slug: string }) {
  const sb = getSupabase();
  const valid = /^[a-f0-9]{8,64}$/.test(slug);
  const [state, setState] = useState<{ row: Row | null; done: boolean; error: string | null }>({ row: null, done: !sb || !valid, error: null });
  useEffect(() => {
    if (!sb || !valid) return;
    let cancelled = false;
    sb.rpc("get_shared_prompt", { p_slug: slug }).then(({ data, error }) => {
      if (cancelled) return;
      const rows = (data ?? []) as Row[];
      setState({ row: rows[0] ?? null, done: true, error: error?.message ?? null });
    });
    return () => { cancelled = true; };
  }, [sb, slug, valid]);

  if (!sb) return <p className="text-slate-600">Sharing is not configured on this deployment.</p>;
  if (!state.done) return <p className="text-slate-500">Loading…</p>;
  if (!state.row) return (
    <div>
      <h1 className="h1">Link not found</h1>
      <p className="lead">This share link doesn&apos;t exist or the owner stopped sharing it.</p>
      {state.error && <p className="mt-2 text-xs text-slate-400">{state.error}</p>}
      <Link className="btn-primary mt-6 inline-block" href="/builder">Build your own prompt</Link>
    </div>
  );
  return (
    <div>
      <p className="text-sm text-slate-500">Shared prompt{state.row.target_id ? ` · for ${state.row.target_id}` : ""} · {new Date(state.row.created_at).toLocaleDateString()}</p>
      <h1 className="h1 mt-2">{state.row.title}</h1>
      <div className="card mt-6 p-5">
        <pre className="output">{state.row.output}</pre>
        <div className="mt-3"><CopyButton text={state.row.output} label="Copy prompt" /></div>
      </div>
      <p className="mt-6 text-sm text-slate-600">Made with <Link className="text-indigo-700 underline" href="/builder">PromptPilot Prompt Builder</Link>.</p>
    </div>
  );
}
