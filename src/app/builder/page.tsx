import type { Metadata } from "next";
import { PromptBuilder } from "@/components/PromptBuilder";
import { TARGETS } from "@/lib/engine";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free AI Prompt Builder for ChatGPT, Claude, Gemini, Grok & Perplexity",
  description: "Guided prompt builder that formats prompts for each AI model. Improve, shorten, expand or adapt prompts instantly with deterministic templates, no API key needed.",
  alternates: { canonical: "/builder" },
};

export default function BuilderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Prompt Builder</h1>
      <p className="lead">Fill in the guided fields; the prompt updates live and is formatted for the model you pick. The checklist shows what&apos;s still missing.</p>
      <p className="mt-3 text-sm text-slate-500">Model pages: {TARGETS.map((t, i) => <span key={t.id}>{i > 0 && " · "}<Link className="text-indigo-700" href={`/builder/${t.id}`}>{t.name.split(" (")[0]}</Link></span>)}</p>
      <div className="mt-8"><PromptBuilder /></div>
    </div>
  );
}
