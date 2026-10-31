import Link from "next/link";
import { ALL_PROMPTS, searchLibrary } from "@/content";
import { CATEGORIES } from "@/lib/categories";
import { TARGETS } from "@/lib/engine";
import { PromptCard } from "@/components/PromptCard";
import { JsonLd } from "@/components/JsonLd";
import { HeroBuilder } from "@/components/HeroBuilder";
import { BeforeAfterShowcase } from "@/components/BeforeAfterShowcase";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";
import { ComingUpInIndia } from "@/components/ComingUpInIndia";
import { istToday } from "@/lib/festivals";
import { loadFestivals } from "@/lib/festivals/server";

// Re-render hourly so the festival section never shows an expired campaign (the client also recomputes in IST).
export const revalidate = 3600;

const TOOLS = [
  { href: "/builder", icon: "✦", title: "Prompt Builder", body: "Describe your goal, pick an AI and get a structured prompt. Refine tone, length, language and format." },
  { href: "/library", icon: "▤", title: "Prompt Library", body: `${ALL_PROMPTS.length} free, ready-to-use prompts across ${CATEGORIES.length} categories.` },
  { href: "/enhancer", icon: "◎", title: "Prompt Enhancer", body: "Paste any prompt to see what's missing and get rule-based fixes. Optional AI polish with your own key." },
  { href: "/instagram-studio", icon: "◐", title: "Instagram Studio", body: "Photo-edit prompts for Gemini and ChatGPT that keep your face unchanged. English and Hindi." },
];

const STEPS = [
  { t: "Describe your idea", b: "Type what you want in plain words, in English or any language, including Hindi and Hinglish. That's the only required field." },
  { t: "Pick your AI", b: "ChatGPT, Claude, Gemini, Grok, Perplexity, image and video tools, or coding assistants." },
  { t: "Copy, try and refine", b: "Copy the prompt or open it in your AI. Make it shorter, more detailed or regenerate a new structure." },
];

const FAQ = [
  { q: "Is PromptPilot free?", a: "Yes. The builder, library and enhancer checklist are free and don't need an account. A Pro plan is coming soon; there is no price and no way to pay today." },
  { q: "Does PromptPilot send my text to an AI?", a: "No. Prompts are built from templates in your browser, so the same inputs always give the same prompt. Nothing reaches an AI unless you paste it into one yourself, or choose the optional Enhancer polish with your own API key." },
  { q: "Which AI tools does it support?", a: "ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot-style assistants, Midjourney and other image tools, video generators, and coding agents like Cursor. Each platform gets formatting it handles well (for example XML sections for Claude)." },
  { q: "Do I need to sign up?", a: "No. You can build, copy and try prompts without an account. Signing in lets you save prompts to your account; without it you can still save in this browser from the full builder." },
  { q: "Why does \"Try in ChatGPT\" ask me to paste?", a: "None of these sites offer an official, documented way to pre-fill a prompt from a link, so we copy the prompt to your clipboard and open the site. You paste it with Ctrl/⌘ + V." },
  { q: "Are the example outputs real AI responses?", a: "No. They are short illustrative samples we wrote to show the shape of a good answer. Real results vary by model." },
];

export default async function Home() {
  const festivals = await loadFestivals();
  const recent = searchLibrary(ALL_PROMPTS.filter((p) => p.kind === "general"), { sort: "newest" }).slice(0, 6);
  const platforms = [
    ...TARGETS.filter((t) => t.family === "chat" || t.family === "search").map((t) => ({ id: t.id, name: t.name.split(" (")[0] ?? t.name })),
    ...TARGETS.filter((t) => t.family === "image" || t.family === "video").map((t) => ({ id: t.id, name: t.name.split(" (")[0] ?? t.name })),
    { id: "cursor", name: "Cursor / coding agents" },
  ];
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, ALL_PROMPTS.filter((p) => p.cat === c.id).length]));
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: SITE.name, applicationCategory: "UtilitiesApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: SITE.description, url: SITE.url }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-line" aria-labelledby="hero-title">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-12 text-center sm:pb-20 sm:pt-20">
          <p className="badge badge-accent">Free · No sign-up · No API key needed</p>
          <h1 id="hero-title" className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">Type your idea in plain words. Get a prompt that actually works.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted sm:text-xl">Free prompt builder for ChatGPT, Claude, Gemini, Grok, Midjourney and more. Write in English, Hindi or Hinglish. No sign-up, no API key.</p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-fg" lang="hi-Latn">Apna idea Hinglish mein likho, perfect prompt hum bana denge. Bilkul free.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/builder" size="lg">Build my prompt, free</ButtonLink>
            <ButtonLink href="/festivals" variant="secondary" size="lg">Festival prompts</ButtonLink>
            <ButtonLink href="/library" variant="secondary" size="lg">Browse ready prompts</ButtonLink>
          </div>
          <HeroBuilder platforms={platforms} />
          <p className="mt-6 text-xs text-subtle">Works with ChatGPT · Claude · Gemini · Grok · Perplexity · Copilot · Midjourney · video tools · Cursor. Not affiliated with any of them.</p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- seasonal layer (below the universal hero) */}
      <ComingUpInIndia festivals={festivals} serverToday={istToday()} />

      {/* ---------------------------------------------------------------- how it works */}
      <section className="section" aria-labelledby="how">
        <p className="eyebrow">How it works</p>
        <h2 id="how" className="h2 mt-2">From rough idea to a clear prompt in seconds</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="card p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text" aria-hidden>{i + 1}</span>
              <h3 className="mt-4 font-semibold text-fg">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- before vs after */}
      <section className="border-y border-line bg-surface" aria-labelledby="examples">
        <div className="section">
          <p className="eyebrow">Before vs after</p>
          <h2 id="examples" className="h2 mt-2">Same request, two prompts. See the difference.</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">Left: the one-liner most people type. Right: the prompt PromptPilot builds, generated live by the same engine as the builder. Sample responses on both sides are written by us for illustration; they are not live AI responses.</p>
          <div className="mt-8"><BeforeAfterShowcase /></div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- categories */}
      <section className="section" aria-labelledby="cats">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="eyebrow">Categories</p><h2 id="cats" className="h2 mt-2">Prompts for every part of life and work</h2></div>
          <Link href="/categories" className="link text-sm font-medium">All categories →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => <CategoryCard key={c.id} category={c} count={counts[c.id]} />)}
        </div>
      </section>

      {/* ---------------------------------------------------------------- tools */}
      <section className="section !pt-0" aria-labelledby="tools">
        <p className="eyebrow">AI tools</p>
        <h2 id="tools" className="h2 mt-2">Free tools</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((f) => (
            <Link key={f.href} href={f.href} className="card card-hover group p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-text" aria-hidden>{f.icon}</span>
              <h3 className="mt-4 font-semibold text-fg group-hover:text-accent-text">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- recent */}
      <section className="section !pt-0" aria-labelledby="recent">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="eyebrow">Library</p><h2 id="recent" className="h2 mt-2">Recently added prompts</h2></div>
          <Link href="/library" className="link text-sm font-medium">Browse all {ALL_PROMPTS.length} →</Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- privacy + external APIs */}
      <section className="border-y border-line bg-surface" aria-labelledby="privacy">
        <div className="section grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Privacy & data</p>
            <h2 id="privacy" className="h2 mt-2">What happens to what you type</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              <li><strong className="text-fg">Built in your browser.</strong> Generating, refining and regenerating prompts runs on templates on your device. No AI is called.</li>
              <li><strong className="text-fg">Nothing stored unless you save.</strong> Saving while signed out stays in this browser. Signed-in saves go to your account, protected by row-level security.</li>
              <li><strong className="text-fg">Links contain your text.</strong> If you share a builder link or submit the form without JavaScript, your goal is in the URL and can appear in hosting logs.</li>
              <li><strong className="text-fg">No third-party analytics or advertising.</strong> <Link className="link" href="/privacy">Read the privacy policy</Link>.</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">External services</p>
            <h2 className="h2 mt-2">Which features use an outside API</h2>
            <div className="mt-6 overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs text-subtle"><tr><th scope="col" className="px-4 py-2.5 font-medium">Feature</th><th scope="col" className="px-4 py-2.5 font-medium">External API?</th></tr></thead>
                <tbody className="divide-y divide-[var(--border)] text-muted">
                  <tr><td className="px-4 py-3 text-fg">Prompt Builder, library, enhancer checklist</td><td className="px-4 py-3">None. Runs on templates.</td></tr>
                  <tr><td className="px-4 py-3 text-fg">Try in ChatGPT / Claude / Gemini / Grok</td><td className="px-4 py-3">None. Copies to your clipboard and opens the official site.</td></tr>
                  <tr><td className="px-4 py-3 text-fg">Enhancer “AI polish” (optional)</td><td className="px-4 py-3">Yes: the provider you choose, with your own API key, billed by them. Your key isn&apos;t stored.</td></tr>
                  <tr><td className="px-4 py-3 text-fg">Sign-in, account saves, favourites, share links</td><td className="px-4 py-3">Yes: Supabase (our database and auth provider).</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="section max-w-3xl" aria-labelledby="faq">
        <p className="eyebrow text-center">FAQ</p>
        <h2 id="faq" className="h2 mt-2 text-center">Questions, answered honestly</h2>
        <div className="mt-8 divide-y divide-[var(--border)] rounded-2xl border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="details-clean group px-5">
              <summary className="flex min-h-14 items-center justify-between gap-4 py-4 font-medium text-fg">
                {f.q}<span aria-hidden className="text-subtle transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- CTA */}
      <section className="section !pt-0 text-center">
        <div className="card px-6 py-12">
          <h2 className="h2">Ready to write a better prompt?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">It takes one sentence. No account, no API key.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/builder" size="lg">Build my prompt, free</ButtonLink>
            <ButtonLink href="/festivals" variant="secondary" size="lg">Festival prompts</ButtonLink>
            <ButtonLink href="/library" variant="secondary" size="lg">Browse ready prompts</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
