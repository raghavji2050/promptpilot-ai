"use client";
import { useMemo, useState } from "react";
import { searchLibrary, categories, type LibraryItem } from "@/content";
import { TARGETS } from "@/lib/engine";
import { PromptCard } from "./PromptCard";

export function LibraryBrowser({ items, showKind = false, showStack = false, showTrend = false, showLocale = false, initialQuery = "" }: {
  items: LibraryItem[]; showKind?: boolean; showStack?: boolean; showTrend?: boolean; showLocale?: boolean; initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [kind, setKind] = useState("");
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [stack, setStack] = useState("");
  const [trend, setTrend] = useState("");
  const [locale, setLocale] = useState("");
  const cats = useMemo(() => categories(items), [items]);
  const usedTargets = useMemo(() => TARGETS.filter((t) => items.some((i) => i.targets.includes(t.id))), [items]);
  const results = useMemo(() => searchLibrary(items, { q, kind, category, target, stack, trend, locale }), [items, q, kind, category, target, stack, trend, locale]);
  const reset = () => { setQ(""); setKind(""); setCategory(""); setTarget(""); setStack(""); setTrend(""); setLocale(""); };

  return (
    <div>
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="sr-only" htmlFor="lib-q">Search prompts</label>
          <input id="lib-q" className="input" type="search" placeholder="Search prompts (e.g. laravel migration, polaroid, citations)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {showKind && (
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
            <option value="">All types</option><option value="developer">Developer</option><option value="social">Social</option><option value="general">General</option>
          </select>
        )}
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target model">
          <option value="">Any model</option>{usedTargets.map((t) => <option key={t.id} value={t.id}>{t.name.split(" (")[0]}</option>)}
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
        {showLocale && (
          <select className="input" value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language">
            <option value="">Any language</option><option value="en">English</option><option value="hi">हिन्दी (Hindi)</option>
          </select>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>{results.length} of {items.length} prompts</span>
        <button type="button" className="underline" onClick={reset}>Reset filters</button>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => <PromptCard key={p.slug} item={p} />)}
      </div>
      {results.length === 0 && <p className="mt-8 text-center text-slate-500">No prompts match. Try fewer words or reset filters.</p>}
    </div>
  );
}
