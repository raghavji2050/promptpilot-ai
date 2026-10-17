import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { promptsForCategory } from "@/content";
import { PromptCard } from "@/components/PromptCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, builderHref } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return CATEGORIES.map((c) => ({ id: c.id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = getCategory((await params).id);
  if (!c) return {};
  return { title: `${c.name} AI Prompts`, description: `${c.description} Free prompt builder and ready-made prompts for ChatGPT, Claude, Gemini and Grok.`, alternates: { canonical: `/categories/${c.id}` } };
}

const EXTRA: Partial<Record<string, { href: string; title: string; body: string }[]>> = {
  coding: [
    { href: "/agent-templates", title: "Coding agent context kit", body: "Generate AGENTS.md, CLAUDE.md and Cursor rules for Laravel, Node.js or Next.js projects and download them as a ZIP." },
    { href: "/developer-prompts", title: "Developer prompt library", body: "Task prompts for bug fixes, refactors, tests, migrations and reviews, each naming the failure mode it prevents." },
  ],
  design: [
    { href: "/instagram-studio", title: "Instagram Studio", body: "Photo-edit prompts for Gemini and ChatGPT in English and Hindi, with identity preservation built in." },
    { href: "/trending", title: "Trending photo prompts", body: "Photo prompt formats labelled honestly as dated reported trends, seasonal or evergreen." },
  ],
};

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const c = getCategory((await params).id);
  if (!c) notFound();
  const prompts = promptsForCategory(c.id).slice(0, 9);
  const total = promptsForCategory(c.id).length;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Categories", item: absoluteUrl("/categories") },
        { "@type": "ListItem", position: 2, name: c.name, item: absoluteUrl(`/categories/${c.id}`) },
      ] }} />
      <p className="text-sm text-slate-500"><Link className="text-indigo-700" href="/categories">Categories</Link> / {c.name}</p>
      <h1 className="h1 mt-2"><span aria-hidden>{c.icon}</span> {c.name}</h1>
      <p className="lead">{c.description} For: {c.audience.toLowerCase()}.</p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">Task types</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.subcategories.map((s) => (
          <div key={s.id} className="card flex flex-col p-4">
            <h3 className="font-semibold text-slate-900">{s.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.blurb}</p>
            {s.sensitive && <p className="mt-1 text-xs text-amber-800">Includes {s.sensitive} guardrails: reliable sources and a reminder to consult a professional.</p>}
            <div className="mt-auto flex flex-wrap gap-3 pt-3 text-sm">
              <Link className="font-medium text-indigo-700" href={`/builder?cat=${c.id}&sub=${s.id}`}>Build a prompt →</Link>
              <Link className="text-slate-600 underline" href={builderHref(s.example, { cat: c.id, sub: s.id, platform: s.visual === "image" ? "image-generic" : s.visual === "video" ? "video" : undefined })}>Try: “{s.example}”</Link>
            </div>
          </div>
        ))}
      </div>

      {EXTRA[c.id] && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {EXTRA[c.id]!.map((x) => <Link key={x.href} href={x.href} className="card p-5 transition hover:shadow-md"><h3 className="font-semibold text-slate-900">{x.title} →</h3><p className="mt-1 text-sm text-slate-600">{x.body}</p></Link>)}
        </div>
      )}

      {prompts.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between"><h2 className="text-2xl font-bold text-slate-900">Ready-made prompts</h2><Link className="text-sm text-indigo-700" href={`/library?cat=${c.id}`}>All {total} →</Link></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{prompts.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
        </section>
      )}
    </div>
  );
}
