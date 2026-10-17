import Link from "next/link";
import { ALL_PROMPTS, searchLibrary } from "@/content";
import { USE_CASES } from "@/content/use-cases";
import { CATEGORIES } from "@/lib/categories";
import { TARGETS } from "@/lib/engine";
import { PromptCard } from "@/components/PromptCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE, builderHref } from "@/lib/site";

const QUICK = [
  { goal: "Help me grow my Instagram account", label: "Grow my Instagram" },
  { goal: "Help me prepare for a job interview", label: "Prepare for an interview" },
  { goal: "Validate my business idea for a tiffin service", label: "Validate a business idea" },
  { goal: "Make a 4-week study plan to learn Excel", label: "Make a study plan" },
  { goal: "Write a polite email asking for a deadline extension", label: "Write a professional email" },
  { goal: "Plan a 5-day trip to Kerala on a budget", label: "Plan a trip" },
];

const TOOLS = [
  { href: "/builder", title: "Prompt Builder", body: "Describe your goal, pick an AI, get a structured prompt. Improve, simplify, change tone or convert to another platform in one click." },
  { href: "/library", title: "Prompt Library", body: `${ALL_PROMPTS.length} free prompts across 10 categories, searchable by category, platform, language and output type.` },
  { href: "/enhancer", title: "Prompt Enhancer", body: "Paste any prompt for a checklist of what's missing and rule-based fixes. Optional AI polish with your own API key." },
  { href: "/instagram-studio", title: "Instagram Studio", body: "Photo-edit prompts for Gemini and ChatGPT that keep your face unchanged. English and Hindi." },
];

export default function Home() {
  const examples = ALL_PROMPTS.filter((p) => p.exampleOutput).slice(0, 3);
  const recent = searchLibrary(ALL_PROMPTS.filter((p) => p.kind === "general"), { sort: "newest" }).filter((p) => !examples.includes(p)).slice(0, 6);
  const trending = ALL_PROMPTS.filter((p) => p.trend?.status === "current").slice(0, 3);
  const chatTargets = TARGETS.filter((t) => t.family !== "coding_agent");
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: SITE.name, applicationCategory: "UtilitiesApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: SITE.description, url: SITE.url }} />

      {/* Hero with the universal input */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:py-20">
          <p className="inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">Free · No sign-up · No API key needed</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Create Better AI Prompts for Anything</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">Say what you want in plain words. PromptPilot turns it into a clear, structured prompt for ChatGPT, Claude, Gemini, Grok, Perplexity, image and video tools.</p>

          <form action="/builder" method="get" className="card mx-auto mt-8 max-w-3xl p-4 text-left sm:p-5">
            <label htmlFor="home-goal" className="label !text-base">What do you want AI to help you with?</label>
            <textarea id="home-goal" name="goal" required maxLength={1500} rows={3} className="input text-base" placeholder="e.g. Help me grow my Instagram account, plan a trip, prepare for an interview…" />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-64">
                <label htmlFor="home-platform" className="label">AI platform</label>
                <select id="home-platform" name="platform" className="input" defaultValue="chatgpt">
                  {chatTargets.map((t) => <option key={t.id} value={t.id}>{t.name.split(" (")[0]}</option>)}
                  <option value="cursor">Cursor / coding agents</option>
                </select>
              </div>
              <button type="submit" className="btn-primary !px-6 !py-2.5 text-base sm:ml-auto">Generate my prompt →</button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Try an example">
            {QUICK.map((q) => <Link key={q.goal} href={builderHref(q.goal)} className="chip bg-white !text-xs sm:!text-sm">{q.label}</Link>)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold text-slate-900">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Describe your goal", "In plain language, any language. That's the only required field."],
            ["Pick your AI", "ChatGPT, Claude, Gemini, Grok, Perplexity, Midjourney, video tools and more."],
            ["Get a structured prompt", "Role, context, objective, steps, constraints and output format, matched to your task."],
            ["Copy, refine, save", "Improve, simplify, change tone or convert to another AI without retyping."],
          ].map(([t, b], i) => (
            <li key={t} className="card p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white" aria-hidden>{i + 1}</span><h3 className="mt-3 font-semibold text-slate-900">{t}</h3><p className="mt-1 text-sm text-slate-600">{b}</p></li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600">Generating a prompt does not call any AI; it runs on templates in your browser. You then paste the prompt into the AI tool you use.</p>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="cats">
        <div className="flex items-end justify-between"><h2 id="cats" className="text-2xl font-bold text-slate-900">Popular categories</h2><Link href="/categories" className="text-sm text-indigo-700">All categories →</Link></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/categories/${c.id}`} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none">
              <span className="text-2xl" aria-hidden>{c.icon}</span>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{c.name}</h3>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">{c.subcategories.slice(0, 3).map((s) => s.name).join(" · ")}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Examples with outputs */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="examples">
        <h2 id="examples" className="text-2xl font-bold text-slate-900">Example prompts and what they produce</h2>
        <p className="mt-1 text-sm text-slate-600">Example outputs are short illustrative samples written by us to show the shape of a good answer, not real AI responses.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {examples.map((p) => (
            <article key={p.slug} className="card flex flex-col p-5">
              <h3 className="font-semibold text-slate-900"><Link href={`/p/${p.slug}`} className="hover:text-indigo-700">{p.title}</Link></h3>
              <p className="mt-1 text-xs text-slate-500">{p.audience}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Prompt (excerpt)</p>
              <pre className="output mt-1 !max-h-40 !text-xs">{p.body.split("\n").slice(0, 8).join("\n")}…</pre>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Example output (illustrative)</p>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">{p.exampleOutput}</pre>
              <Link href={`/p/${p.slug}`} className="mt-auto pt-3 text-sm font-medium text-indigo-700">Use this prompt →</Link>
            </article>
          ))}
        </div>
      </section>

      {/* Use cases by audience */}
      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="audiences">
        <h2 id="audiences" className="text-2xl font-bold text-slate-900">Made for everyone</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((u) => <Link key={u.slug} href={`/prompts-for/${u.slug}`} className="card p-4 transition hover:shadow-md"><h3 className="font-semibold text-slate-900">{u.short} →</h3><p className="mt-1 text-sm text-slate-600">{u.starters.map((s) => s.goal).slice(0, 2).join(" · ")}</p></Link>)}
        </div>
      </section>

      {/* Free tools */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="tools">
        <h2 id="tools" className="text-2xl font-bold text-slate-900">Free tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((f) => <Link key={f.href} href={f.href} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none"><h3 className="font-semibold text-slate-900">{f.title} →</h3><p className="mt-2 text-sm text-slate-600">{f.body}</p></Link>)}
        </div>
      </section>

      {/* Recent + trending */}
      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="recent">
        <div className="flex items-end justify-between"><h2 id="recent" className="text-2xl font-bold text-slate-900">Recently added</h2><Link href="/library" className="text-sm text-indigo-700">Browse the library →</Link></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
      </section>
      {trending.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="trending">
          <div className="flex items-end justify-between"><h2 id="trending" className="text-2xl font-bold text-slate-900">Trending photo prompts</h2><Link href="/trending" className="text-sm text-indigo-700">See all →</Link></div>
          <p className="mt-1 text-sm text-slate-600">Formats a dated third-party source reported as trending. We link the source; we don&apos;t have view counts.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trending.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
        </section>
      )}

      {/* Trust + CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="card grid gap-6 p-6 md:grid-cols-3">
          <div><h3 className="font-semibold text-slate-900">Works without AI APIs</h3><p className="mt-1 text-sm text-slate-600">Prompts are built from templates in your browser. Same inputs, same output. Optional AI polish uses your own key.</p></div>
          <div><h3 className="font-semibold text-slate-900">Private by default</h3><p className="mt-1 text-sm text-slate-600">Nothing is stored unless you press Save. No account needed to save in your browser.</p></div>
          <div><h3 className="font-semibold text-slate-900">Honest by design</h3><p className="mt-1 text-sm text-slate-600">No fake stats, testimonials or user counts. Health, legal and money prompts include responsible guardrails.</p></div>
        </div>
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Ready to write a better prompt?</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3"><Link href="/builder" className="btn-primary !px-5 !py-3 text-base">Open the Prompt Builder</Link><Link href="/library" className="btn-secondary !px-5 !py-3 text-base">Explore prompts</Link></div>
        </div>
      </section>
    </>
  );
}
