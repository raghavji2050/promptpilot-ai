import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FESTIVALS, formatDate, formatRange, getFestival, istToday, nextInstance, sourceList, upcomingInstances } from "@/lib/festivals";
import { loadFestivals } from "@/lib/festivals/server";
import { STUDIO_SECTIONS } from "@/lib/festivals/studio";
import { festivalHref } from "@/lib/festivals/links";
import { festivalBlock } from "@/lib/engine";
import { festiveStyle, festivalOptions } from "@/lib/festivals/ui";
import { FestivalCountdown } from "@/components/FestivalCountdown";
import { FestivalBuilderWithParams } from "@/components/FestivalBuilder";
import { absoluteUrl } from "@/lib/site";
import { topicsFor } from "@/content/festival-topics";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = getFestival(slug);
  if (!f) return {};
  const title = `${f.name} AI Prompts: Greetings, Reels, Posts & Business Campaigns`;
  const description = `Free ${f.name} prompt builder for ChatGPT, Claude, Gemini and image tools: greetings in Hindi, Hinglish and regional languages, Instagram posts, Reel scripts, posters and honest small-business campaigns.`;
  return { title, description, alternates: { canonical: absoluteUrl(`/festivals/${f.slug}`) }, openGraph: { title, description, url: absoluteUrl(`/festivals/${f.slug}`) }, twitter: { card: "summary_large_image", title, description } };
}

export default async function FestivalStudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const festivals = await loadFestivals();
  const f = getFestival(slug, festivals);
  if (!f) notFound();
  const today = istToday();
  const inst = nextInstance(f, today);
  const o = inst?.occurrence;
  const options = festivalOptions(festivals, today);
  const others = upcomingInstances(festivals, today).filter((i) => i.festival.slug !== f.slug).filter((i, idx, arr) => arr.findIndex((x) => x.festival.slug === i.festival.slug) === idx).slice(0, 6);

  return (
    <div style={festiveStyle(f)} className="festive">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Festivals", item: absoluteUrl("/festivals") },
        { "@type": "ListItem", position: 3, name: f.name, item: absoluteUrl(`/festivals/${f.slug}`) },
      ] }} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-6 text-sm text-subtle">
        <Link href="/" className="link">Home</Link> <span aria-hidden>›</span> <Link href="/festivals" className="link">Festivals</Link> <span aria-hidden>›</span> <span aria-current="page">{f.name}</span>
      </nav>

      <header className="mx-auto max-w-6xl px-4 pb-8 pt-6">
        <div className="card festive-card flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="max-w-3xl">
            <p className="eyebrow festive-text">Festival prompt studio</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{f.name} AI prompts</h1>
            <p className="mt-3 text-muted">{f.summary}</p>
            {o ? (
              <p className="mt-4 text-sm text-fg"><strong>{o.start === o.end ? formatDate(o.primary) : `${formatRange(o.start, o.end)} · main day ${formatDate(o.primary)}`}</strong> <span className="text-subtle">(India)</span></p>
            ) : <p className="mt-4 text-sm text-fg">Next date not confirmed yet. We add dates once official holiday lists or panchangs publish them.</p>}
            {o?.status === "provisional" && <p className="mt-2 text-sm text-muted"><span className="badge festive-badge mr-1">Provisional</span>{o.note}</p>}
            {o?.status === "verified" && o.note && <p className="mt-2 text-sm text-muted">{o.note}</p>}
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Where it's celebrated">{f.regions.map((r) => <li key={r} className="badge">{r}</li>)}</ul>
          </div>
          <div className="shrink-0"><FestivalCountdown festival={f} serverToday={today} /></div>
        </div>
      </header>

      {topicsFor(f.slug).length > 0 && (
        <nav aria-label={`${f.name} guides`} className="mx-auto max-w-6xl px-4 pb-6">
          <p className="text-sm font-medium text-fg">{f.name} guides</p>
          <ul className="mt-2 flex flex-wrap gap-2">{topicsFor(f.slug).map((t) => <li key={t.topic}><Link href={`/festivals/${f.slug}/${t.topic}`} className="chip">{t.h1}</Link></li>)}</ul>
        </nav>
      )}

      <section id="builder" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-12" aria-label="Festival prompt builder">
        <FestivalBuilderWithParams festivals={options} fallbackSlug={f.slug} />
      </section>

      {STUDIO_SECTIONS.map((sec) => {
        const starters = sec.starters.filter((st) => f.goals.includes(st.goal));
        if (!starters.length) return null;
        return (
          <section key={sec.id} id={sec.id} className="border-t border-line" aria-labelledby={`${sec.id}-h`}>
            <div className="mx-auto max-w-6xl px-4 py-10">
              <h2 id={`${sec.id}-h`} className="h2">{f.name}: {sec.title}</h2>
              <p className="mt-2 max-w-3xl text-muted">{sec.intro}</p>
              {sec.note && <p className="mt-3 max-w-3xl rounded-lg bg-surface-2 p-3 text-sm text-muted">{sec.note}</p>}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {starters.map((st) => {
                  const block = festivalBlock({ festival: f, goal: st.goal, instance: inst });
                  return (
                    <article key={st.title} className="card p-5">
                      <h3 className="font-semibold text-fg">{st.title}</h3>
                      <p className="mt-1 text-sm text-muted">{st.desc}</p>
                      {block.steps.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-subtle">The prompt asks the AI to</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{block.steps.slice(0, 3).map((x) => <li key={x}>{x}</li>)}</ul>
                        </>
                      )}
                      <Link href={festivalHref(f, st.goal, st.platform)} className="btn-secondary mt-4">Build this prompt</Link>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      <section className="border-t border-line bg-surface" aria-labelledby="care-h">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2">
          <div>
            <h2 id="care-h" className="h2">How these prompts stay respectful</h2>
            <p className="mt-2 text-sm text-muted">Every {f.name} prompt includes these rules for the AI:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">{f.care.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div>
            <h2 className="h2">Date sources</h2>
            {o ? (
              <>
                <p className="mt-2 text-sm text-muted">Checked on {formatDate(o.lastVerified)}. Lunar dates can differ by region; we mark disagreements as provisional.</p>
                <ul className="mt-3 space-y-1.5 text-sm">{sourceList(o.sources).map((s) => <li key={s.label}><a className="link" href={s.url} rel="noopener noreferrer" target="_blank">{s.label}</a></li>)}</ul>
              </>
            ) : <p className="mt-2 text-sm text-muted">No confirmed upcoming date yet.</p>}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="more-h">
          <h2 id="more-h" className="h2">More festivals coming up</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((i) => (
              <li key={i.festival.slug} style={festiveStyle(i.festival)}>
                <Link href={`/festivals/${i.festival.slug}`} className="card card-hover block px-4 py-3">
                  <span className="block font-medium text-fg">{i.festival.name} prompts</span>
                  <span className="block text-xs text-subtle">{formatDate(i.occurrence.primary)}{i.occurrence.status === "provisional" ? " · provisional" : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
