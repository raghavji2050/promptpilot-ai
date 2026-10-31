import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { USE_CASES, getUseCase } from "@/content/use-cases";
import { getPrompt } from "@/content";
import { getCategory } from "@/lib/categories";
import { PromptCard } from "@/components/PromptCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, builderHref, DEFAULT_OG_IMAGE } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return USE_CASES.map((u) => ({ slug: u.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const u = getUseCase((await params).slug);
  if (!u) return {};
  return { title: u.metaTitle, description: u.description, alternates: { canonical: `/prompts-for/${u.slug}` }, openGraph: { images: [DEFAULT_OG_IMAGE], title: u.metaTitle, description: u.description, url: absoluteUrl(`/prompts-for/${u.slug}`) } };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const u = getUseCase((await params).slug);
  if (!u) notFound();
  const prompts = u.prompts.map(getPrompt).filter((p): p is NonNullable<typeof p> => !!p);
  const others = USE_CASES.filter((x) => x.slug !== u.slug);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: u.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Use cases", item: absoluteUrl("/prompts-for") },
          { "@type": "ListItem", position: 2, name: u.title, item: absoluteUrl(`/prompts-for/${u.slug}`) },
        ] },
      ]} />
      <p className="text-sm text-slate-500"><Link className="text-indigo-700" href="/prompts-for">Use cases</Link> / {u.short}</p>
      <h1 className="h1 mt-2">{u.title}</h1>
      {u.intro.map((p) => <p key={p} className="lead">{p}</p>)}

      <section className="mt-8 card p-5" aria-labelledby="start">
        <h2 id="start" className="text-lg font-semibold text-slate-900">Start in one click</h2>
        <p className="mt-1 text-sm text-slate-600">Opens the free builder with the goal filled in. Add your details and copy the prompt.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {u.starters.map((s) => <Link key={s.goal} href={builderHref(s.goal, { sub: s.sub, platform: s.platform })} className="btn-secondary">{s.goal} →</Link>)}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="tips">
        <h2 id="tips" className="text-2xl font-bold text-slate-900">Tips that make the difference</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {u.tips.map((t) => <div key={t.title} className="card p-5"><h3 className="font-semibold text-slate-900">{t.title}</h3><p className="mt-1 text-sm text-slate-600">{t.body}</p></div>)}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="prompts">
        <h2 id="prompts" className="text-2xl font-bold text-slate-900">Ready-to-use prompts</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{prompts.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
        <p className="mt-4 text-sm">More in {u.categories.map((c, i) => { const cat = getCategory(c)!; return <span key={c}>{i > 0 && ", "}<Link className="text-indigo-700 underline" href={`/categories/${c}`}>{cat.name}</Link></span>; })}.</p>
      </section>

      <section className="prose-simple mt-10 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq">FAQ</h2>
        {u.faqs.map((f) => <div key={f.q}><p><strong>{f.q}</strong></p><p>{f.a}</p></div>)}
      </section>

      <section className="mt-10 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Other guides</h2>
        <p className="mt-2">{others.map((o, i) => <span key={o.slug}>{i > 0 && " · "}<Link className="text-indigo-700" href={`/prompts-for/${o.slug}`}>{o.short}</Link></span>)}</p>
      </section>
    </div>
  );
}
