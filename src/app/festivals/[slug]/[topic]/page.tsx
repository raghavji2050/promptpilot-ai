import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatRange, getFestival, istToday, nextInstance } from "@/lib/festivals";
import { loadFestivals } from "@/lib/festivals/server";
import { festiveStyle } from "@/lib/festivals/ui";
import { buildUniversal, festivalGoalLabel, festivalGoalSentence, type UniversalInput } from "@/lib/engine";
import { ShareCard } from "@/components/ShareCard";
import { FESTIVAL_TOPICS, getTopic } from "@/content/festival-topics";
import { CopyButton } from "@/components/CopyButton";
import { TryInButtons } from "@/components/TryInButtons";
import { JsonLd } from "@/components/JsonLd";
import { FestivalCountdown } from "@/components/FestivalCountdown";
import { absoluteUrl, SITE } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return FESTIVAL_TOPICS.map((t) => ({ slug: t.festival, topic: t.topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; topic: string }> }): Promise<Metadata> {
  const { slug, topic } = await params;
  const t = getTopic(slug, topic);
  if (!t) return {};
  const url = absoluteUrl(`/festivals/${slug}/${topic}`);
  return {
    title: { absolute: `${t.title} | ${SITE.name}` },
    description: t.description,
    alternates: { canonical: url },
    openGraph: { type: "article", title: t.title, description: t.description, url },
    twitter: { card: "summary_large_image", title: t.title, description: t.description },
  };
}

function studioLink(slug: string, goal: string, platform?: string, lang?: string) {
  const p = new URLSearchParams({ goal });
  if (platform) p.set("platform", platform);
  if (lang) p.set("lang", lang);
  return `/festivals/${slug}?${p.toString()}#builder`;
}

export default async function FestivalTopicPage({ params }: { params: Promise<{ slug: string; topic: string }> }) {
  const { slug, topic } = await params;
  const t = getTopic(slug, topic);
  const festivals = await loadFestivals();
  const f = getFestival(slug, festivals);
  if (!t || !f) notFound();
  const today = istToday();
  const inst = nextInstance(f, today);
  const o = inst?.occurrence;
  const s = t.sample;
  const extra: Record<string, string> = { festival: f.slug, fgoal: s.goal, ...(s.platform ? { platform: s.platform } : {}), ...(s.extra ?? {}) };
  const lang = s.language && s.language !== "English" ? s.language : undefined;
  const sampleInput: UniversalInput = {
    goal: festivalGoalSentence({ festivalName: f.name, goal: s.goal, audience: s.audience, language: lang, platform: s.platform, extra }),
    targetId: s.targetId ?? "chatgpt", language: lang, audience: s.audience, mode: "standard", extra,
  };
  const sample = buildUniversal(sampleInput);
  const related = FESTIVAL_TOPICS.filter((x) => x !== t).sort((a, b) => Number(b.festival === slug) - Number(a.festival === slug)).slice(0, 4);
  const url = absoluteUrl(`/festivals/${slug}/${topic}`);

  return (
    <div style={festiveStyle(f)} className="festive">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Festivals", item: absoluteUrl("/festivals") },
        { "@type": "ListItem", position: 3, name: f.name, item: absoluteUrl(`/festivals/${f.slug}`) },
        { "@type": "ListItem", position: 4, name: t.h1, item: url },
      ] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.faqs.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: t.title, description: t.description, url, dateModified: "2026-10-18", inLanguage: "en-IN", publisher: { "@type": "Organization", name: SITE.name, url: SITE.url }, about: { "@type": "Thing", name: f.name } }} />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-6 text-sm text-subtle">
        <Link href="/" className="link">Home</Link> <span aria-hidden>›</span> <Link href="/festivals" className="link">Festivals</Link> <span aria-hidden>›</span> <Link href={`/festivals/${f.slug}`} className="link">{f.name}</Link> <span aria-hidden>›</span> <span aria-current="page">{festivalGoalLabel(s.goal)}</span>
      </nav>

      <article className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow festive-text">{f.name} prompts</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{t.h1}</h1>
            {o && <p className="mt-3 text-sm text-muted">{f.name}: <strong className="text-fg">{o.start === o.end ? formatDate(o.primary) : `${formatRange(o.start, o.end)} (main day ${formatDate(o.primary, { year: false })})`}</strong> in India{o.status === "provisional" ? " · provisional, may vary by region" : ""}.</p>}
          </div>
          <div className="shrink-0"><FestivalCountdown festival={f} serverToday={today} /></div>
        </header>

        <p className="mt-6 text-lg text-muted">{t.intro}</p>

        <section className="mt-10" aria-labelledby="tips-h">
          <h2 id="tips-h" className="h2">What makes it work</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">{t.tips.map((x) => <li key={x}>{x}</li>)}</ol>
        </section>

        <section className="mt-10" aria-labelledby="sample-h">
          <h2 id="sample-h" className="h2">A ready-to-use prompt</h2>
          <p className="mt-2 text-sm text-muted">Generated by our festival engine from an example input ({[s.extra?.business ?? s.extra?.recipient, s.extra?.location, s.platform, s.language].filter(Boolean).join(" · ")}). Change the details in the studio to make it yours. It is a prompt, not an AI response.</p>
          {sample.warnings.length > 0 && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm text-muted">{sample.warnings.join(" ")}</p>}
          <pre className="output mt-4 !max-h-[28rem]" tabIndex={0} aria-label="Sample prompt">{sample.text}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={sample.text} label="Copy prompt" toastMessage="Prompt copied" />
            <Link href={studioLink(f.slug, s.goal, s.platform, s.language)} className="btn-secondary">Customise in the {f.name} studio</Link>
          </div>
          <TryInButtons text={sample.text} />
          <ShareCard input={sampleInput} festivalName={f.name} />
        </section>

        <section className="mt-10" aria-labelledby="var-h">
          <h2 id="var-h" className="h2">Try a variation</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {t.variations.map((v) => (
              <li key={v.label}><Link href={studioLink(f.slug, v.goal, v.platform, v.lang)} className="card card-hover festive-card block p-4 font-medium text-fg">{v.label}</Link></li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="faq-h">
          <h2 id="faq-h" className="h2">Questions</h2>
          <div className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-line">
            {t.faqs.map((q) => (
              <details key={q.q} className="group p-4">
                <summary className="cursor-pointer font-medium text-fg">{q.q}</summary>
                <p className="mt-2 text-sm text-muted">{q.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="rel-h">
          <h2 id="rel-h" className="h2">Related guides</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r) => {
              const rf = getFestival(r.festival, festivals);
              return <li key={`${r.festival}/${r.topic}`}><Link href={`/festivals/${r.festival}/${r.topic}`} className="card card-hover block p-4"><span className="block text-xs text-subtle">{rf?.name}</span><span className="block font-medium text-fg">{r.h1}</span></Link></li>;
            })}
          </ul>
          <p className="mt-6 text-sm"><Link href={`/festivals/${f.slug}`} className="link">All {f.name} prompts →</Link> · <Link href="/festivals" className="link">All festivals →</Link></p>
        </section>
      </article>
    </div>
  );
}
