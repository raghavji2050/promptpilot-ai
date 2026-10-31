import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, istToday, nextInstance, type FestivalInstance } from "@/lib/festivals";
import { loadFestivals } from "@/lib/festivals/server";
import { festiveStyle, festivalOptions } from "@/lib/festivals/ui";
import { ComingUpInIndia } from "@/components/ComingUpInIndia";
import { FestivalBuilderWithParams } from "@/components/FestivalBuilder";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/site";

export const revalidate = 3600;

const title = "Indian Festival AI Prompt Builder: Diwali, Holi, Eid, Christmas & More";
const description = "Free festival prompts for India: greetings in Hindi, Hinglish and regional languages, Instagram posts, Reel scripts, poster image prompts and honest small-business campaigns. Dates in IST, checked against official holiday lists.";
export const metadata: Metadata = { title, description, alternates: { canonical: absoluteUrl("/festivals") }, openGraph: { images: [DEFAULT_OG_IMAGE], title, description, url: absoluteUrl("/festivals") } };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function FestivalsIndex() {
  const festivals = await loadFestivals();
  const today = istToday();
  const dated: FestivalInstance[] = [];
  const undated = [];
  for (const f of festivals) {
    const i = nextInstance(f, today);
    if (i) dated.push(i); else undated.push(f);
  }
  dated.sort((a, b) => a.occurrence.primary.localeCompare(b.occurrence.primary));
  const groups = new Map<string, FestivalInstance[]>();
  for (const i of dated) {
    const key = `${MONTHS[Number(i.occurrence.primary.slice(5, 7)) - 1]} ${i.occurrence.primary.slice(0, 4)}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:py-16">
          <p className="badge badge-accent">Free · Seasonal layer on the universal builder</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Festival prompts for India</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">Pick a festival, say what you want to create, choose the language and platform. You get an expert-level prompt for ChatGPT, Claude, Gemini, Grok or an image tool.</p>
        </div>
      </section>

      <ComingUpInIndia festivals={festivals} serverToday={today} />

      <section id="builder" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12" aria-label="Festival prompt builder">
        <FestivalBuilderWithParams festivals={festivalOptions(festivals, today)} />
      </section>

      <section className="border-t border-line" aria-labelledby="all-h">
        <div className="section">
          <h2 id="all-h" className="h2">All festival studios</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">Upcoming dates in India (IST). Provisional means sources disagree or the date depends on the moon; check locally.</p>
          {[...groups.entries()].map(([month, items]) => (
            <div key={month} className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">{month}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((i) => (
                  <li key={i.festival.slug} style={festiveStyle(i.festival)}>
                    <Link href={`/festivals/${i.festival.slug}`} className="card card-hover festive-card block p-4">
                      <span className="block font-medium text-fg">{i.festival.name}</span>
                      <span className="mt-0.5 block text-xs text-subtle">{formatDate(i.occurrence.primary)}{i.occurrence.status === "provisional" ? " · provisional" : ""}</span>
                      <span className="mt-2 block text-sm text-muted line-clamp-2">{i.festival.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {undated.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">Next date to be confirmed</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {undated.map((f) => <li key={f.slug}><Link href={`/festivals/${f.slug}`} className="card card-hover block p-4 font-medium text-fg">{f.name}</Link></li>)}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
