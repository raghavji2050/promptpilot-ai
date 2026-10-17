import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KitGenerator } from "@/components/KitGenerator";
import { JsonLd } from "@/components/JsonLd";
import { PromptCard } from "@/components/PromptCard";
import { DEVELOPER_PROMPTS } from "@/content";
import { STACKS, type StackId } from "@/lib/engine";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return STACKS.map((s) => ({ stack: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ stack: string }> }): Promise<Metadata> {
  const { stack } = await params;
  const s = STACKS.find((x) => x.id === stack);
  if (!s) return {};
  return {
    title: `${s.name} AGENTS.md, CLAUDE.md & Cursor Rules Generator`,
    description: `Answer a few questions about your ${s.name} project and download AGENTS.md, CLAUDE.md and .cursor/rules files tailored to it. Free, runs in your browser.`,
    alternates: { canonical: `/agent-templates/${s.id}` },
  };
}

export default async function StackPage({ params }: { params: Promise<{ stack: string }> }) {
  const { stack } = await params;
  const s = STACKS.find((x) => x.id === stack);
  if (!s) notFound();
  const related = DEVELOPER_PROMPTS.filter((p) => p.stacks?.includes(s.id)).slice(0, 3);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: `${s.name} agent rules generator`, applicationCategory: "DeveloperApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: absoluteUrl(`/agent-templates/${s.id}`) },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Agent Templates", item: absoluteUrl("/agent-templates") },
          { "@type": "ListItem", position: 2, name: s.name, item: absoluteUrl(`/agent-templates/${s.id}`) },
        ] },
      ]} />
      <p className="text-sm text-slate-500"><Link href="/agent-templates" className="text-indigo-700">Agent Templates</Link> / {s.name}</p>
      <h1 className="h1 mt-2">{s.name} agent context kit</h1>
      <p className="lead">{s.tagline}. Files update live as you answer; download everything as a ZIP and drop it into your repo root.</p>
      <div className="mt-8"><KitGenerator stack={s.id as StackId} /></div>
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-slate-900">{s.name} task prompts</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
        </section>
      )}
    </div>
  );
}
