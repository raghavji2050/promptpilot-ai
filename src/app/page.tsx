import Link from "next/link";
import { DEVELOPER_PROMPTS, SOCIAL_PROMPTS } from "@/content";
import { PromptCard } from "@/components/PromptCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const FEATURES = [
  { href: "/agent-templates", title: "Agent context kit", body: "Answer a few questions about your Laravel, Node.js or Next.js project. Download AGENTS.md, CLAUDE.md, Cursor .mdc rules, a reviewer subagent and slash commands as a ZIP." },
  { href: "/builder", title: "Prompt Builder", body: "Guided form → structured prompt formatted for ChatGPT, Claude, Gemini, Grok, Perplexity, coding agents, image and video models. Improve, shorten, expand or adapt in one click." },
  { href: "/developer-prompts", title: "Developer prompts", body: "Task prompts for bug fixes, refactors, tests, migrations and reviews. Each one names the failure mode it prevents." },
  { href: "/instagram-studio", title: "Instagram Studio", body: "Photo-edit prompts for Gemini and ChatGPT in English and Hindi, with identity-preservation built in." },
  { href: "/enhancer", title: "Enhancer", body: "Paste any prompt for a rule-based analysis and fixes. Optionally polish it with your own OpenAI, Anthropic, xAI or compatible API key." },
  { href: "/trending", title: "Trending, honestly labelled", body: "Every social prompt is marked as a dated reported trend (with sources), seasonal, or evergreen. No made-up virality numbers." },
];

export default function Home() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: SITE.name, applicationCategory: "DeveloperApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: SITE.description, url: SITE.url }} />
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">Free · No sign-up · Works without API keys</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Agent rules for your stack in minutes. Better prompts for every model.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            PromptPilot generates AGENTS.md, CLAUDE.md and Cursor rules for Laravel, Node.js and Next.js projects, and builds structured prompts for ChatGPT, Claude, Gemini, Grok, Perplexity, image and video models. Everything runs on deterministic templates in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/agent-templates" className="btn-primary !px-5 !py-3 text-base">Generate agent rules</Link>
            <Link href="/builder" className="btn-secondary !px-5 !py-3 text-base">Open Prompt Builder</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="font-semibold text-slate-900">{f.title} →</h2>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Developer prompts</h2>
          <Link href="/developer-prompts" className="text-sm text-indigo-700">See all →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEVELOPER_PROMPTS.slice(0, 6).map((p) => <PromptCard key={p.slug} item={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Social photo prompts</h2>
          <Link href="/trending" className="text-sm text-indigo-700">Trending →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_PROMPTS.slice(0, 6).map((p) => <PromptCard key={p.slug} item={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="card grid gap-6 p-6 md:grid-cols-3">
          <div><h3 className="font-semibold text-slate-900">Deterministic</h3><p className="mt-1 text-sm text-slate-600">Same inputs produce the same output. No randomness, no hidden API calls.</p></div>
          <div><h3 className="font-semibold text-slate-900">Private by default</h3><p className="mt-1 text-sm text-slate-600">Prompts are built in your browser. Nothing is stored unless you choose to save.</p></div>
          <div><h3 className="font-semibold text-slate-900">Honest content</h3><p className="mt-1 text-sm text-slate-600">No invented stats or testimonials. Trend claims link to their sources and dates.</p></div>
        </div>
      </section>
    </>
  );
}
