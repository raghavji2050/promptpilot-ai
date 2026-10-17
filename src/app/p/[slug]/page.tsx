import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_PROMPTS, getPrompt } from "@/content";
import { TARGETS } from "@/lib/engine";
import { CopyButton } from "@/components/CopyButton";
import { SaveButton } from "@/components/SaveButton";
import { TrendBadge } from "@/components/TrendBadge";
import { PromptCard } from "@/components/PromptCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_PROMPTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (!p) return {};
  return { title: `${p.title} Prompt`, description: p.summary, alternates: { canonical: `/p/${p.slug}` } };
}

const SECTION: Record<string, { href: string; label: string }> = {
  developer: { href: "/developer-prompts", label: "Developer Prompts" },
  social: { href: "/instagram-studio", label: "Instagram Studio" },
  general: { href: "/library", label: "Library" },
};

export default async function PromptDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (!p) notFound();
  const sec = SECTION[p.kind];
  const related = ALL_PROMPTS.filter((x) => x.slug !== p.slug && x.kind === p.kind && (x.category === p.category || x.tags.some((t) => p.tags.includes(t)))).slice(0, 3);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10" lang={p.locale === "hi" ? "hi" : undefined}>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, description: p.summary, text: p.body, inLanguage: p.locale ?? "en", url: absoluteUrl(`/p/${p.slug}`), keywords: p.tags.join(", ") },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: sec.label, item: absoluteUrl(sec.href) },
          { "@type": "ListItem", position: 2, name: p.title, item: absoluteUrl(`/p/${p.slug}`) },
        ] },
      ]} />
      <p className="text-sm text-slate-500"><Link href={sec.href} className="text-indigo-700">{sec.label}</Link> / {p.category}</p>
      <h1 className="h1 mt-2">{p.title}</h1>
      <p className="lead">{p.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {p.trend && <TrendBadge status={p.trend.status} />}
        {p.targets.map((t) => <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{TARGETS.find((x) => x.id === t)?.name.split(" (")[0] ?? t}</span>)}
        {p.stacks?.map((s) => <span key={s} className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">{s}</span>)}
        {p.aspect && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">Aspect {p.aspect}</span>}
        {p.requiresPhoto && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">Upload a photo first</span>}
      </div>

      {p.failureMode && (
        <div className="mt-6 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4 text-sm text-slate-800"><strong>Prevents:</strong> {p.failureMode}</div>
      )}

      <div className="card mt-6 p-5">
        <pre className="output">{p.body}</pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={p.body} label="Copy prompt" />
          <SaveButton title={p.title} output={p.body} source={p.kind === "developer" ? "developer" : "library"} targetId={p.targets[0]} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Replace [bracketed] parts with your own details before sending.</p>
      </div>

      {p.trend && (
        <div className="card mt-6 p-5 text-sm">
          <h2 className="font-semibold text-slate-900">About this label</h2>
          <p className="mt-1 text-slate-700">{p.trend.note}</p>
          {p.trend.sources.length > 0 && (
            <ul className="mt-2 space-y-1">{p.trend.sources.map((s) => <li key={s.url}>Source: <a className="text-indigo-700 underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}</ul>
          )}
          <p className="mt-2 text-xs text-slate-500">Last checked {p.trend.lastVerified}. Prompt text written by PromptPilot.</p>
          {p.requiresPhoto && <p className="mt-2 text-xs text-slate-500">Only edit photos of yourself or people who consented.</p>}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">Related prompts</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <PromptCard key={r.slug} item={r} />)}</div>
        </section>
      )}
    </div>
  );
}
