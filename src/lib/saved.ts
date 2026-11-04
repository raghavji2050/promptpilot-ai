"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { assertAffected, friendlyDbError, isSessionExpiredError, isSessionLive, ownedOnly, SESSION_EXPIRED_MSG, type DbErrorLike } from "./saved-guards";

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

export { friendlyDbError };

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
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    sb.auth.getSession()
      .then(({ data, error }) => {
        if (cancelled) return;
        const s = data?.session ?? null;
        // A stored session past expires_at that could not be refreshed: treat as signed out.
        if (error || (s && !isSessionLive(s))) { setSession(null); setExpired(Boolean(s) || isSessionExpiredError(error)); }
        else setSession(s);
      })
      .catch(() => { if (!cancelled) setSession(null); })
      .finally(() => { if (!cancelled) setReady(true); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      const live = s && isSessionLive(s) ? s : null;
      setSession(live);
      if (live) setExpired(false);
    });
    return () => { cancelled = true; data.subscription.unsubscribe(); };
  }, []);
  /** Called when a DB request fails with an expired/invalid JWT: drop the local session and show a sign-in prompt. */
  const markExpired = useCallback(() => {
    setExpired(true); setSession(null);
    getSupabase()?.auth.signOut({ scope: "local" }).catch(() => {});
  }, []);
  return { session, ready, expired, markExpired };
}

/**
 * Saved prompts: Supabase (table saved_prompts, RLS) when configured and signed in,
 * otherwise this browser's localStorage.
 */
export function useSavedPrompts() {
  const { session, ready, expired, markExpired } = useSession();
  const [items, setItems] = useState<SavedPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const remote = Boolean(getSupabase() && session);
  const uid = session?.user?.id ?? null;

  /** Turns a DB error into a thrown friendly Error, signing out locally on an expired session. */
  const fail = useCallback((e: DbErrorLike): never => {
    if (isSessionExpiredError(e)) { markExpired(); throw new Error(SESSION_EXPIRED_MSG); }
    throw new Error(friendlyDbError(e?.message ?? "Something went wrong."));
  }, [markExpired]);

  const load = useCallback(async (): Promise<{ items: SavedPrompt[]; error: string | null }> => {
    const sb = getSupabase();
    if (sb && uid) {
      try {
        // Ownership filter on top of RLS: the select policy also matches visibility = 'public' rows of other users.
        const { data, error } = await sb.from("saved_prompts").select("id,user_id,title,source,target_id,output,created_at,visibility,share_slug").eq("user_id", uid).order("created_at", { ascending: false }).limit(200);
        if (error) fail(error);
        return { items: ownedOnly((data ?? []) as (SavedPrompt & { user_id?: string })[], uid), error: null };
      } catch (e) {
        return { items: [], error: (e as Error).message || "Couldn't load your saved prompts." };
      }
    }
    return { items: readLocal(), error: null };
  }, [uid, fail]);

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
      if (error) fail(error);
    } else {
      const item: SavedPrompt = { id: `local-${Date.now()}`, created_at: new Date().toISOString(), title: p.title.slice(0, 140), source: p.source, target_id: dbTargetId(p.target_id), output: p.output };
      writeLocal([item, ...readLocal()]);
    }
    await refresh();
  }, [session, refresh, fail]);

  /** Deletes one saved prompt; throws a friendly error when it fails or matched no row you own. */
  const remove = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (sb && uid && !id.startsWith("local-")) {
      const { data, error } = await sb.from("saved_prompts").delete().eq("id", id).eq("user_id", uid).select("id");
      if (error) fail(error);
      assertAffected(data);
    } else {
      writeLocal(readLocal().filter((x) => x.id !== id));
    }
    await refresh();
  }, [uid, refresh, fail]);

  /** Create/revoke an unlisted share link. Consumes the daily share_create quota first. create_share() checks ownership. */
  const share = useCallback(async (id: string, visibility: "private" | "unlisted"): Promise<string | null> => {
    const sb = getSupabase();
    if (!sb || !session) throw new Error(expired ? SESSION_EXPIRED_MSG : "Sign in to share prompts.");
    if (!items.some((x) => x.id === id)) throw new Error(friendlyDbError("NOT_FOUND"));
    if (visibility !== "private") {
      const { data: left, error: qe } = await sb.rpc("consume_quota", { p_action: "share_create" });
      if (qe) fail(qe);
      if (left === -1) throw new Error("Daily share limit reached. Try again tomorrow (UTC).");
    }
    const { data, error } = await sb.rpc("create_share", { p_kind: "prompt", p_id: id, p_visibility: visibility });
    if (error) fail(error);
    await refresh();
    return (data as string | null) ?? null;
  }, [session, expired, items, refresh, fail]);

  return { items, save, remove, share, remote, session, ready, expired, error, refresh };
}
