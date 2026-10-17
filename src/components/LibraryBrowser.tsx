"use client";
import { useMemo, useState } from "react";
import { searchLibrary, outputTypes, type LibraryItem, type LibraryQuery } from "@/content";
import { TARGETS } from "@/lib/engine";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { PromptCard } from "./PromptCard";

export function LibraryBrowser({ items, showStack = false, showTrend = false, showLocale = true, showCategory = true, initial = {} }: {
  items: LibraryItem[]; showStack?: boolean; showTrend?: boolean; showLocale?: boolean; showCategory?: boolean; initial?: LibraryQuery;
  /** @deprecated kept for older callers */ showKind?: boolean;
}) {
  const [q, setQ] = useState(initial.q ?? "");
  const [cat, setCat] = useState(initial.cat ?? "");
  const [sub, setSub] = useState(initial.sub ?? "");
  const [target, setTarget] = useState(initial.target ?? "");
  const [stack, setStack] = useState("");
  const [trend, setTrend] = useState("");
  const [locale, setLocale] = useState("");
  const [outputType, setOutputType] = useState("");
  const [tier, setTier] = useState<LibraryQuery["tier"]>("");
  const [sort, setSort] = useState<LibraryQuery["sort"]>("");

  const usedCats = useMemo(() => CATEGORIES.filter((c) => items.some((i) => i.cat === c.id)), [items]);
  const usedSubs = useMemo(() => {
    const c = getCategory(cat);
    return c ? c.subcategories.filter((s) => items.some((i) => i.sub === s.id)) : [];
  }, [cat, items]);
  const usedTargets = useMemo(() => TARGETS.filter((t) => items.some((i) => i.targets.includes(t.id))), [items]);
  const outs = useMemo(() => outputTypes(items), [items]);
  const results = useMemo(() => searchLibrary(items, { q, cat, sub, target, stack, trend, locale, outputType, tier, sort }), [items, q, cat, sub, target, stack, trend, locale, outputType, tier, sort]);
  const reset = () => { setQ(""); setCat(""); setSub(""); setTarget(""); setStack(""); setTrend(""); setLocale(""); setOutputType(""); setTier(""); setSort(""); };

  return (
    <div>
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="sr-only" htmlFor="lib-q">Search prompts</label>
          <input id="lib-q" className="input !py-3 text-base" type="search" placeholder="Search prompts: interview, budget, reel, email, logo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {showCategory && (
          <select className="input" value={cat} onChange={(e) => { setCat(e.target.value); setSub(""); }} aria-label="Category">
            <option value="">All categories</option>{usedCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        )}
        {showCategory && (
          <select className="input" value={sub} onChange={(e) => setSub(e.target.value)} aria-label="Use case" disabled={!usedSubs.length}>
            <option value="">{cat ? "All use cases" : "Use case (pick a category)"}</option>{usedSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select className="input" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="AI platform">
          <option value="">Any AI platform</option>{usedTargets.map((t) => <option key={t.id} value={t.id}>{t.name.split(" (")[0]}</option>)}
        </select>
        <select className="input" value={outputType} onChange={(e) => setOutputType(e.target.value)} aria-label="Output type">
          <option value="">Any output type</option>{outs.map((o) => <option key={o}>{o}</option>)}
        </select>
        {showLocale && (
          <select className="input" value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language">
            <option value="">Any language</option><option value="en">English</option><option value="hi">हिन्दी (Hindi)</option>
          </select>
        )}
        <select className="input" value={tier} onChange={(e) => setTier(e.target.value as LibraryQuery["tier"])} aria-label="Free or premium">
          <option value="">Free & premium</option><option value="free">Free</option><option value="premium">Premium (coming soon)</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as LibraryQuery["sort"])} aria-label="Sort">
          <option value="">Sort: featured</option><option value="newest">Newest first</option><option value="az">A–Z</option>
        </select>
        {showStack && (
          <select className="input" value={stack} onChange={(e) => setStack(e.target.value)} aria-label="Stack">
            <option value="">Any stack</option><option value="laravel">Laravel</option><option value="node">Node.js</option><option value="nextjs">Next.js</option>
          </select>
        )}
        {showTrend && (
          <select className="input" value={trend} onChange={(e) => setTrend(e.target.value)} aria-label="Trend status">
            <option value="">Any status</option><option value="current">Reported trend (dated)</option><option value="seasonal">Seasonal</option><option value="evergreen">Evergreen</option>
          </select>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <span role="status">{results.length} of {items.length} prompts</span>
        <span className="text-xs">No popularity ranking yet: we don&apos;t show usage numbers until we collect real data.</span>
        <button type="button" className="underline" onClick={reset}>Reset filters</button>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => <PromptCard key={p.slug} item={p} />)}
      </div>
      {results.length === 0 && (
        <p className="mt-8 text-center text-slate-500">{tier === "premium" ? "No premium prompts yet. Premium packs are coming soon; every prompt here is free." : "No prompts match. Try fewer words or reset filters."}</p>
      )}
    </div>
  );
}
