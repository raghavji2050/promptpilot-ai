import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-semibold text-slate-900">{SITE.name}</p>
          <p className="mt-2 text-slate-600">Deterministic prompt tools. Works without sign-up or API keys.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Build</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/builder">Prompt Builder</Link></li>
            <li><Link href="/agent-templates">Agent Templates</Link></li>
            <li><Link href="/enhancer">Enhancer</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Libraries</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/developer-prompts">Developer Prompts</Link></li>
            <li><Link href="/instagram-studio">Instagram Studio</Link></li>
            <li><Link href="/trending">Trending</Link></li>
            <li><Link href="/library">Search all prompts</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Company</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-slate-400">Content last reviewed {SITE.lastReviewed}. Not affiliated with OpenAI, Anthropic, Google, xAI, Perplexity, Cursor or Midjourney.</p>
    </footer>
  );
}
