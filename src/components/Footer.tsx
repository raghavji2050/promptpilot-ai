import Link from "next/link";
import { SITE } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";
import { USE_CASES } from "@/content/use-cases";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-semibold text-slate-900">{SITE.name}</p>
          <p className="mt-2 text-slate-600">Create better AI prompts for anything. Free, works in your browser, no API key needed.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Tools</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/builder">Prompt Builder</Link></li>
            <li><Link href="/library">Prompt Library</Link></li>
            <li><Link href="/enhancer">Prompt Enhancer</Link></li>
            <li><Link href="/instagram-studio">Instagram Studio</Link></li>
            <li><Link href="/agent-templates">Coding agent kit</Link></li>
            <li><Link href="/trending">Trending photo prompts</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-2">
          <p className="font-semibold text-slate-900">Categories</p>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-slate-600 sm:grid-cols-2">
            {CATEGORIES.map((c) => <li key={c.id}><Link href={`/categories/${c.id}`}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Prompts for…</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            {USE_CASES.map((u) => <li key={u.slug}><Link href={`/prompts-for/${u.slug}`}>{u.short}</Link></li>)}
            <li className="pt-2"><Link href="/pricing">Pricing</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <p className="px-4 pb-8 text-center text-xs text-slate-500">Content last reviewed {SITE.lastReviewed}. Not affiliated with OpenAI, Anthropic, Google, xAI, Perplexity, Cursor or Midjourney.</p>
    </footer>
  );
}
