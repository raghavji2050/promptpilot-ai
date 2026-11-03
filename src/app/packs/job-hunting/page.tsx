import type { Metadata } from "next";
import Link from "next/link";
import { JOB_HUNTING_PACK } from "@/content/job-hunting-pack";
import { buildUniversal, toShareParams } from "@/lib/engine/universal";
import { PackTemplateCard } from "@/components/PackTemplateCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

const title = "Job Hunting Prompt Pack for India: Resume, Interview, Salary | PromptPilot AI";
const description = "Free, work-safe AI prompts for job hunting in India: resume bullets, cover letter, HR and technical interview prep, salary negotiation in LPA and LinkedIn summary. Type in Hinglish too.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/packs/job-hunting" },
  openGraph: { title, description, url: absoluteUrl("/packs/job-hunting") },
};

export default function JobHuntingPackPage() {
  const items = JOB_HUNTING_PACK.map((t) => ({ ...t, text: buildUniversal(t.input).text, href: `/builder#${toShareParams(t.input).toString()}` }));
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "Job Hunting prompt pack", itemListElement: items.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.title, url: absoluteUrl(`/packs/job-hunting#${t.id}`) })) }} />
      <p className="badge">✔ Work-safe, tested templates</p>
      <h1 className="h1 mt-3">Job Hunting pack for India</h1>
      <p className="lead">Six ready prompts for your job search: resume bullets, cover letter, HR and technical interview prep, salary negotiation and your LinkedIn summary. Tuned for Indian hiring: CTC in LPA, fixed vs variable pay, notice periods, Naukri and LinkedIn.</p>
      <p className="mt-2 text-fg" lang="hi-Latn">Hinglish mein likho, jaise “interview ki taiyari karni hai”, builder samajh jaayega.</p>
      <p className="mt-2 text-sm text-muted">Every prompt tells the AI never to invent experience, numbers or salary data, and to leave [placeholders] for you to fill. Fill the [brackets] before you send.</p>
      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Templates">
        {items.map((t) => <PackTemplateCard key={t.id} id={t.id} title={t.title} blurb={t.blurb} hinglish={t.hinglish} text={t.text} goal={t.input.goal} builderHref={t.href} />)}
      </section>
      <p className="mt-8 text-sm text-muted">Want something else? <Link className="text-indigo-700 underline" href="/builder">Open the free builder</Link> or see <Link className="text-indigo-700 underline" href="/categories/career">all career prompts</Link>.</p>
    </div>
  );
}
