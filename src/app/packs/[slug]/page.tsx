import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MORE_PACKS } from "@/content/more-packs";
import { buildUniversal, toShareParams } from "@/lib/engine/universal";
import { PackTemplateCard } from "@/components/PackTemplateCard";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return MORE_PACKS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = MORE_PACKS.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.lead, alternates: { canonical: `/packs/${p.slug}` }, openGraph: { images: [DEFAULT_OG_IMAGE], title: p.title, description: p.lead, url: absoluteUrl(`/packs/${p.slug}`) } };
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = MORE_PACKS.find((x) => x.slug === slug);
  if (!p) notFound();
  const items = p.items.map((t) => ({ ...t, text: buildUniversal(t.input).text, href: `/builder#${toShareParams(t.input).toString()}` }));
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="badge">✔ Work-safe, tested templates</p>
      <h1 className="h1 mt-3">{p.heading}</h1>
      <p className="lead">{p.lead}</p>
      <p className="mt-2 text-fg" lang="hi-Latn">{p.hinglishLine}</p>
      <p className="mt-2 text-sm text-muted">Every prompt tells the AI never to invent facts or numbers. Fill the [brackets] before you send.</p>
      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Templates">
        {items.map((t) => <PackTemplateCard key={t.id} id={t.id} title={t.title} blurb={t.blurb} hinglish={t.hinglish} text={t.text} goal={t.input.goal} builderHref={t.href} />)}
      </section>
      <p className="mt-8 text-sm text-muted"><Link className="text-indigo-700 underline" href="/packs">All packs</Link> · <Link className="text-indigo-700 underline" href="/builder">Open the free builder</Link></p>
    </div>
  );
}
