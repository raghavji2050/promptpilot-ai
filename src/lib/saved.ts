"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export interface SavedPrompt {
  id: string;
  title: string;
  source: "builder" | "enhancer" | "studio" | "library" | "developer";
  target_id: string | null;
  output: string;
  created_at: string;
  visibility?: "private" | "unlisted" | "public";
  share_slug?: string | null;
}

/** Target ids seeded in public.targets (schema.sql §13). Others (image-generic, video) are stored as null to satisfy the FK. */
export const DB_TARGET_IDS = new Set(["chatgpt", "claude", "gemini", "grok", "perplexity", "cursor", "claude-code", "codex", "midjourney", "flux", "veo", "kling"]);
export const dbTargetId = (id: string | null | undefined) => (id && DB_TARGET_IDS.has(id) ? id : null);

/** Maps Postgres/PostgREST errors raised by schema.sql functions to readable text. */
export function friendlyDbError(msg: string): string {
  if (msg.includes("FREE_SAVE_LIMIT")) return "Free plan save limit reached (25 prompts).";
  if (msg.includes("AUTH_REQUIRED")) return "Please sign in first.";
  if (msg.includes("NOT_FOUND")) return "Item not found (or not yours).";
  return msg;
}

const LS_KEY = "promptpilot.saved.v1";
const FREE_LOCAL_CAP = 100;

function readLocal(): SavedPrompt[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]") as SavedPrompt[]; } catch { return []; }
}
function writeLocal(items: SavedPrompt[]) { localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, FREE_LOCAL_CAP))); }

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  // Without Supabase there is no session to wait for.
  const [ready, setReady] = useState(() => getSupabase() === null);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

/**
 * Saved prompts: Supabase (table saved_prompts, RLS) when configured and signed in,
 * otherwise this browser's localStorage.
 */
export function useSavedPrompts() {
  const { session, ready } = useSession();
  const [items, setItems] = useState<SavedPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const remote = Boolean(getSupabase() && session);

  const load = useCallback(async (): Promise<{ items: SavedPrompt[]; error: string | null }> => {
    const sb = getSupabase();
    if (sb && session) {
      const { data, error } = await sb.from("saved_prompts").select("id,title,source,target_id,output,created_at,visibility,share_slug").order("created_at", { ascending: false }).limit(200);
      return error ? { items: [], error: error.message } : { items: (data ?? []) as SavedPrompt[], error: null };
    }
    return { items: readLocal(), error: null };
  }, [session]);

  const refresh = useCallback(async () => {
    const r = await load();
    setItems(r.items); setError(r.error);
  }, [load]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    load().then((r) => { if (!cancelled) { setItems(r.items); setError(r.error); } });
    return () => { cancelled = true; };
  }, [ready, load]);

  const save = useCallback(async (p: Omit<SavedPrompt, "id" | "created_at"> & { builder_input?: unknown; template_key?: string }) => {
    const sb = getSupabase();
    if (sb && session) {
      const { error } = await sb.from("saved_prompts").insert({
        title: p.title.slice(0, 140), source: p.source, target_id: dbTargetId(p.target_id), output: p.output.slice(0, 40000),
        builder_input: p.builder_input ?? {}, template_key: p.template_key ?? null,
      });
      if (error) throw new Error(friendlyDbError(error.message));
    } else {
      const item: SavedPrompt = { id: `local-${Date.now()}`, created_at: new Date().toISOString(), title: p.title.slice(0, 140), source: p.source, target_id: dbTargetId(p.target_id), output: p.output };
      writeLocal([item, ...readLocal()]);
    }
    await refresh();
  }, [session, refresh]);

  const remove = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (sb && session && !id.startsWith("local-")) {
      const { error } = await sb.from("saved_prompts").delete().eq("id", id);
      if (error) setError(error.message);
    } else {
      writeLocal(readLocal().filter((x) => x.id !== id));
    }
    await refresh();
  }, [session, refresh]);

  /** Create/revoke an unlisted share link. Consumes the daily share_create quota first. */
  const share = useCallback(async (id: string, visibility: "private" | "unlisted"): Promise<string | null> => {
    const sb = getSupabase();
    if (!sb || !session) throw new Error("Sign in to share prompts.");
    if (visibility !== "private") {
      const { data: left, error: qe } = await sb.rpc("consume_quota", { p_action: "share_create" });
      if (qe) throw new Error(friendlyDbError(qe.message));
      if (left === -1) throw new Error("Daily share limit reached. Try again tomorrow (UTC).");
    }
    const { data, error } = await sb.rpc("create_share", { p_kind: "prompt", p_id: id, p_visibility: visibility });
    if (error) throw new Error(friendlyDbError(error.message));
    await refresh();
    return (data as string | null) ?? null;
  }, [session, refresh]);

  return { items, save, remove, share, remote, session, ready, error, refresh };
}
