"use client";
import { useMemo, useState } from "react";
import { searchLibrary, outputTypes, type LibraryItem, type LibraryQuery } from "@/content";
import { TARGETS } from "@/lib/engine";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { PromptCard } from "./PromptCard";
import { EmptyState } from "./ui/EmptyState";
import type { ReactNode } from "react";

/** Cards rendered per step; the rest load on "Show more". Every prompt stays crawlable via /p/[slug] links in the sitemap and the server-rendered index on /library. */
const PAGE_SIZE = 24;

export function LibraryBrowser({ items, showStack = false, showTrend = false, showLocale = true, showCategory = true, initial = {}, sections }: {
  items: LibraryItem[]; showStack?: boolean; showTrend?: boolean; showLocale?: boolean; showCategory?: boolean; initial?: LibraryQuery;
  /** Extra sections (e.g. Recently added, Instagram Studio) shown only while no filter is active. */ sections?: ReactNode;
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
  const [shown, setShown] = useState(PAGE_SIZE);

  const usedCats = useMemo(() => CATEGORIES.filter((c) => items.some((i) => i.cat === c.id)), [items]);
  const usedSubs = useMemo(() => {
    const c = getCategory(cat);
    return c ? c.subcategories.filter((s) => items.some((i) => i.sub === s.id)) : [];
  }, [cat, items]);
  const usedTargets = useMemo(() => TARGETS.filter((t) => items.some((i) => i.targets.includes(t.id))), [items]);
  const outs = useMemo(() => outputTypes(items), [items]);
  const results = useMemo(() => searchLibrary(items, { q, cat, sub, target, stack, trend, locale, outputType, tier, sort }), [items, q, cat, sub, target, stack, trend, locale, outputType, tier, sort]);
  const reset = () => { setQ(""); setCat(""); setSub(""); setTarget(""); setStack(""); setTrend(""); setLocale(""); setOutputType(""); setTier(""); setSort(""); };

  const filtered = Boolean(q || cat || sub || target || stack || trend || locale || outputType || tier || sort);
  const advancedCount = [sub, outputType, locale, tier, sort, stack, trend].filter(Boolean).length;

  return (
    <div>
      <div className="card p-4 sm:p-5">
        <label className="sr-only" htmlFor="lib-q">Search prompts</label>
        <div className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input id="lib-q" className="input !min-h-14 !rounded-xl !pl-12 text-base" type="search" placeholder="Search prompts: interview, budget, reel, email, logo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {showCategory && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button type="button" className={`chip ${!cat ? "chip-active" : ""}`} aria-pressed={!cat} onClick={() => { setCat(""); setSub(""); }}>All</button>
            {usedCats.map((c) => (
              <button key={c.id} type="button" className={`chip ${cat === c.id ? "chip-active" : ""}`} aria-pressed={cat === c.id} onClick={() => { setCat(cat === c.id ? "" : c.id); setSub(""); }}>
                <span aria-hidden>{c.icon}</span> {c.short}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="input" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="AI platform">
            <option value="">Any AI platform</option>{usedTargets.map((t) => <option key={t.id} value={t.id}>{t.name.split(" (")[0]}</option>)}
          </select>
          {showCategory && (
            <select className="input" value={sub} onChange={(e) => setSub(e.target.value)} aria-label="Use case" disabled={!usedSubs.length}>
              <option value="">{cat ? "All use cases" : "Use case (pick a category)"}</option>{usedSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="input" value={tier} onChange={(e) => setTier(e.target.value as LibraryQuery["tier"])} aria-label="Free or premium">
            <option value="">Free & premium</option><option value="free">Free</option><option value="premium">Premium (coming soon)</option>
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as LibraryQuery["sort"])} aria-label="Sort">
            <option value="">Sort: featured</option><option value="newest">Newest first</option><option value="az">A–Z</option>
          </select>
        </div>
        <details className="mt-3" open={advancedCount > 0 && Boolean(outputType || locale || stack || trend)}>
          <summary className="inline-flex min-h-9 items-center text-sm font-medium text-muted hover:text-fg">More filters</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select className="input" value={outputType} onChange={(e) => setOutputType(e.target.value)} aria-label="Output type">
              <option value="">Any output type</option>{outs.map((o) => <option key={o}>{o}</option>)}
            </select>
            {showLocale && (
              <select className="input" value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language">
                <option value="">Any language</option><option value="en">English</option><option value="hi">हिन्दी (Hindi)</option>
              </select>
            )}
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
        </details>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span role="status" aria-live="polite">{results.length} of {items.length} prompts</span>
        {filtered && <button type="button" className="btn-ghost btn-sm" onClick={reset}>Reset filters</button>}
      </div>

      {!filtered && sections}

      {!filtered && sections && <h2 className="h2 mt-12 text-xl">All prompts</h2>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.slice(0, shown).map((p) => <PromptCard key={p.slug} item={p} />)}
      </div>
      {results.length > shown && (
        <div className="mt-6 text-center">
          <button type="button" className="btn-secondary" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more prompts ({results.length - shown} left)</button>
        </div>
      )}
      {results.length === 0 && (
        <div className="mt-4">
          <EmptyState icon="⌕" title={tier === "premium" ? "No premium prompts yet" : "No prompts match"}
            action={<><button type="button" className="btn-secondary" onClick={reset}>Reset filters</button><a className="btn-primary" href={q ? `/builder#goal=${encodeURIComponent(q)}` : "/builder"}>Build a custom prompt</a></>}>
            {tier === "premium" ? "Premium packs are coming soon; every prompt here is free." : "Try fewer words or a different category, or build a prompt for exactly what you need."}
          </EmptyState>
        </div>
      )}
      <p className="mt-6 text-xs text-subtle">No popularity ranking yet: we don&apos;t show “popular” or usage numbers until we collect real data.</p>
    </div>
  );
}
