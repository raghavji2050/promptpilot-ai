"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { useSession, friendlyDbError } from "./saved";

const LS_KEY = "promptpilot.favorites.v1";
const readLocal = (): string[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]") as string[]; } catch { return []; }
};
const writeLocal = (slugs: string[]) => localStorage.setItem(LS_KEY, JSON.stringify([...new Set(slugs)].slice(0, 500)));

/**
 * Favorites keyed by library slug. Signed in: public.favorites (RLS, own rows only),
 * joined to public.library_items — requires seed-library.sql to have been applied.
 * Otherwise: localStorage.
 */
export function useFavorites() {
  const { session, ready } = useSession();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const remote = Boolean(getSupabase() && session);

  const load = useCallback(async (): Promise<{ slugs: string[]; error: string | null }> => {
    const sb = getSupabase();
    if (sb && session) {
      const { data, error } = await sb.from("favorites").select("item_id, library_items(slug)").order("created_at", { ascending: false });
      if (error) return { slugs: [], error: friendlyDbError(error.message) };
      const rows = (data ?? []) as unknown as { library_items: { slug: string } | { slug: string }[] | null }[];
      return { slugs: rows.flatMap((r) => (Array.isArray(r.library_items) ? r.library_items : r.library_items ? [r.library_items] : []).map((x) => x.slug)), error: null };
    }
    return { slugs: readLocal(), error: null };
  }, [session]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    load().then((r) => { if (!cancelled) { setSlugs(r.slugs); setError(r.error); } });
    return () => { cancelled = true; };
  }, [ready, load]);

  const toggle = useCallback(async (slug: string) => {
    const sb = getSupabase();
    const on = slugs.includes(slug);
    if (sb && session) {
      const { data: item, error: le } = await sb.from("library_items").select("id").eq("slug", slug).maybeSingle();
      if (le) throw new Error(friendlyDbError(le.message));
      if (!item) throw new Error("This prompt isn't in the database yet (seed-library.sql not applied).");
      const { error } = on
        ? await sb.from("favorites").delete().eq("item_id", item.id)
        : await sb.from("favorites").insert({ item_id: item.id });
      if (error) throw new Error(friendlyDbError(error.message));
    } else {
      writeLocal(on ? readLocal().filter((s) => s !== slug) : [slug, ...readLocal()]);
    }
    const r = await load();
    setSlugs(r.slugs); setError(r.error);
  }, [slugs, session, load]);

  return { slugs, toggle, remote, ready, error };
}

/** Today's usage counters for the signed-in user (public.usage_counters, own rows via RLS). */
export function useUsage() {
  const { session } = useSession();
  const [rows, setRows] = useState<{ action: string; count: number }[] | null>(null);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !session) return;
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    sb.from("usage_counters").select("action,count").eq("day", today).then(({ data }) => { if (!cancelled) setRows((data ?? []) as { action: string; count: number }[]); });
    return () => { cancelled = true; };
  }, [session]);
  return rows;
}
