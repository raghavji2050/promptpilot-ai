import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromptBuilder } from "@/components/PromptBuilder";
import { JsonLd } from "@/components/JsonLd";
import { TARGETS } from "@/lib/engine";
import { absoluteUrl, SITE } from "@/lib/site";

const GUIDE: Record<string, string[]> = {
  chatgpt: ["Use clear markdown sections: context, task, constraints, output format.", "State length and format explicitly.", "Give one example of the output you want when consistency matters."],
  claude: ["Wrap each part in XML tags such as <context>, <task> and <format>. Anthropic's prompting guidance recommends XML tags for structure.", "Put long documents before the question.", "Ask for quotes from the source when accuracy matters."],
  gemini: ["Use plain, clearly headed sections.", "For photo edits: say what to keep, the one thing to change, and the look you want.", "State aspect ratio for images."],
  grok: ["Use markdown sections and set the tone explicitly.", "Give constraints on length and style.", "Ask for sources if you need factual claims checked."],
  perplexity: ["Ask for a cited source URL and date for each claim.", "Set a time range and region.", "Ask it to note where sources disagree."],
  cursor: ["State the task, files in scope and definition of done.", "Ask for a plan before edits on multi-file changes.", "Require tests to be run before finishing."],
  "claude-code": ["Use an XML-tagged brief with explicit verification steps.", "Point it at AGENTS.md / CLAUDE.md for conventions.", "Ask it to stop and ask when requirements are ambiguous."],
  midjourney: ["Comma-separated descriptors: subject, style, lighting, composition, mood.", "Add parameters such as --ar 4:5 and --no text.", "Check current parameter syntax in Midjourney's docs; it changes between versions."],
  "image-generic": ["Describe the scene in natural sentences.", "Name lighting, composition and aspect ratio.", "List things to avoid."],
  video: ["Specify shot type, subject action, camera movement and duration.", "Describe setting and lighting.", "Add audio cues if the model supports audio."],
};

export const dynamicParams = false;

export function generateStaticParams() {
  return TARGETS.map((t) => ({ target: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ target: string }> }): Promise<Metadata> {
  const { target } = await params;
  const t = TARGETS.find((x) => x.id === target);
  if (!t) return {};
  const name = t.name.split(" (")[0];
  return {
    title: `${name} Prompt Generator: Free Template Builder`,
    description: `Build structured prompts for ${name}. ${t.note} Free, deterministic and no sign-up.`,
    alternates: { canonical: `/builder/${t.id}` },
  };
}

export default async function TargetBuilderPage({ params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  const t = TARGETS.find((x) => x.id === target);
  if (!t) notFound();
  const name = t.name.split(" (")[0];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Builder", item: absoluteUrl("/builder") },
        { "@type": "ListItem", position: 2, name, item: absoluteUrl(`/builder/${t.id}`) },
      ] }} />
      <h1 className="h1">{name} prompt generator</h1>
      <p className="lead">{t.note} The builder below formats your inputs for {name}; switch targets anytime to adapt.</p>
      <div className="card mt-6 p-5">
        <h2 className="font-semibold text-slate-900">Tips for {name} prompts</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{(GUIDE[t.id] ?? []).map((g) => <li key={g}>{g}</li>)}</ul>
        <p className="mt-3 text-xs text-slate-400">Editorial guidance, last reviewed {SITE.lastReviewed}. Check the vendor&apos;s current docs for model-specific changes.</p>
      </div>
      <div className="mt-8"><PromptBuilder initialTarget={t.id} /></div>
    </div>
  );
}
