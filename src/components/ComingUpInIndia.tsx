"use client";
import Link from "next/link";
import {
  activeCampaign, countdown, formatDate, formatRange, sourceList, upcomingInstances,
  type Festival, type FestivalInstance,
} from "@/lib/festivals";
import { festivalHref, quickGoals } from "@/lib/festivals/links";
import { useISTToday } from "@/lib/festivals/useISTToday";
import { festiveStyle } from "@/lib/festivals/ui";


export function StatusLabel({ inst }: { inst: FestivalInstance }) {
  const o = inst.occurrence;
  return o.status === "verified" ? (
    <p className="text-xs text-subtle">Date checked {formatDate(o.lastVerified, { weekday: false })} against {sourceList(o.sources).slice(0, 2).map((s) => s.label.split(" (")[0]).join(" and ")}.</p>
  ) : (
    <p className="text-xs text-subtle"><span className="badge festive-badge mr-1">Provisional</span>Date may vary by region or panchang. {o.note}</p>
  );
}

export function ComingUpInIndia({ festivals, serverToday }: { festivals: Festival[]; serverToday: string }) {
  const today = useISTToday(serverToday);
  const upcoming = upcomingInstances(festivals, today);
  const featured = activeCampaign(festivals, today) ?? upcoming[0];
  if (!featured) return null;
  const f = featured.festival;
  const cd = countdown(featured, today);
  const next = upcoming.filter((i) => i !== featured && !(i.festival.slug === f.slug && i.occurrence.year === featured.occurrence.year)).slice(0, 4);

  return (
    <section className="festive border-b border-line" style={festiveStyle(f)} aria-labelledby="coming-up">
      <div className="section">
        <p className="eyebrow festive-text">Coming up in India</p>
        <h2 id="coming-up" className="h2 mt-2">Celebrate Every Festival With Better AI.</h2>
        <p className="mt-3 max-w-2xl text-muted">Festival prompts for greetings, reels, posters and small-business campaigns, in English, Hindi, Hinglish and regional languages. Dates are shown in IST.</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="card festive-card p-6 sm:p-7" aria-labelledby="featured-festival">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium festive-text">{cd.phase === "upcoming" ? "Next festival" : cd.phase === "today" ? "Today" : "Happening now"}</p>
                <h3 id="featured-festival" className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{f.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {featured.occurrence.start === featured.occurrence.end ? formatDate(featured.occurrence.primary) : `${formatRange(featured.occurrence.start, featured.occurrence.end)} · main day ${formatDate(featured.occurrence.primary, { year: false })}`}
                </p>
              </div>
              <p className="festive-count rounded-xl px-4 py-3 text-center" aria-label={`Countdown: ${cd.label} (India time)`}>
                {cd.phase === "upcoming" ? (
                  <><span className="block text-3xl font-semibold tabular-nums">{cd.days}</span><span className="text-xs">{cd.days === 1 ? "day to go" : "days to go"}</span></>
                ) : (
                  <span className="block text-sm font-semibold">{cd.label}</span>
                )}
                <span className="mt-0.5 block text-[11px] opacity-80">IST</span>
              </p>
            </div>
            <p className="mt-4 text-sm text-muted">{f.summary}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Regions">
              {f.regions.slice(0, 4).map((r) => <li key={r} className="badge">{r}</li>)}
            </ul>
            <div className="mt-4"><StatusLabel inst={featured} /></div>
            <h4 className="mt-5 text-sm font-semibold text-fg">Start with</h4>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {quickGoals(f).map((q) => (
                <li key={q.goal}><Link href={festivalHref(f, q.goal)} className="festive-link block rounded-lg border border-line px-3 py-2 text-sm text-fg">{q.label}</Link></li>
              ))}
            </ul>
            <Link href={festivalHref(f)} className="btn-primary festive-btn mt-5">Create Festival Content</Link>
          </article>

          <div>
            <h3 className="text-sm font-semibold text-fg">Also coming up</h3>
            <ol className="mt-3 grid gap-2">
              {next.map((i) => {
                const c = countdown(i, today);
                return (
                  <li key={`${i.festival.slug}-${i.occurrence.year}`} style={festiveStyle(i.festival)}>
                    <Link href={festivalHref(i.festival)} className="card card-hover flex items-center justify-between gap-3 px-4 py-3">
                      <span>
                        <span className="block font-medium text-fg">{i.festival.name}</span>
                        <span className="block text-xs text-subtle">{formatDate(i.occurrence.primary)}{i.occurrence.status === "provisional" ? " · provisional" : ""}</span>
                      </span>
                      <span className="festive-text shrink-0 text-sm font-medium tabular-nums">{c.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-subtle">Lunar festival dates can differ by a day between regions. We list the date from central government holiday lists and Drik Panchang (New Delhi) and mark disagreements as provisional.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
