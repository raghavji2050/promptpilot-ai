"use client";
import { useState } from "react";
import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({ slug }: { slug: string }) {
  const { slugs, toggle, ready } = useFavorites();
  const [msg, setMsg] = useState<string | null>(null);
  const on = slugs.includes(slug);
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="btn-secondary" disabled={!ready} aria-pressed={on}
        onClick={async () => { setMsg(null); try { await toggle(slug); } catch (e) { setMsg((e as Error).message); } }}>
        {on ? "★ Favorited" : "☆ Favorite"}
      </button>
      {msg && <span className="text-xs text-rose-700">{msg}</span>}
    </span>
  );
}
