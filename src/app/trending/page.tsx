import type { Metadata } from "next";
import Link from "next/link";
import { SOCIAL_PROMPTS, type TrendStatus } from "@/content";
import { PromptCard } from "@/components/PromptCard";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trending AI Photo Prompts (Dated & Sourced)",
  description: "AI photo and video prompt formats labelled honestly: dated reported trends with sources, seasonal themes, and evergreen formats. No invented view counts.",
  alternates: { canonical: "/trending" },
};

const GROUPS: { status: TrendStatus; title: string; blurb: string }[] = [
  { status: "current", title: "Reported recently", blurb: "A third-party publication reported these as trending around the date shown. We link the source; we have not measured views or reach ourselves." },
  { status: "seasonal", title: "Seasonal", blurb: "Tied to a time of year or festival. No popularity claim." },
  { status: "evergreen", title: "Evergreen formats", blurb: "Formats that keep working. Not claimed to be trending right now." },
];

export default function TrendingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Trending prompts</h1>
      <p className="lead">Social trends move weekly. Each prompt shows when we last checked it and where the trend claim comes from.</p>
      <p className="mt-2 text-sm text-slate-500">Last reviewed: {SITE.lastReviewed}</p>
      {GROUPS.map((g) => {
        const items = SOCIAL_PROMPTS.filter((p) => p.trend?.status === g.status);
        return (
          <section key={g.status} className="mt-10">
            <h2 className="text-2xl font-bold text-slate-900">{g.title} <span className="text-base font-normal text-slate-400">({items.length})</span></h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{g.blurb}</p>
            {g.status === "current" && (
              <ul className="mt-3 space-y-1 text-sm">
                {[...new Map(items.flatMap((i) => i.trend!.sources).map((s) => [s.url, s])).values()].map((s) => (
                  <li key={s.url}>Source: <a className="text-indigo-700 underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
          </section>
        );
      })}
      <p className="mt-12 text-sm text-slate-500">Want your own style? Use the <Link href="/instagram-studio" className="text-indigo-700 underline">Instagram Studio</Link> composer.</p>
    </div>
  );
}
