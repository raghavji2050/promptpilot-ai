import type { Metadata } from "next";
import Link from "next/link";
import { UniversalBuilder } from "@/components/UniversalBuilder";
import { fromShareParams, TARGETS } from "@/lib/engine";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Free AI Prompt Builder for ChatGPT, Claude, Gemini, Grok & More",
  description: "Describe your goal in plain language and get a clear, structured prompt for ChatGPT, Claude, Gemini, Grok, Perplexity, image and video tools. Free, no sign-up, no API key.",
  alternates: { canonical: "/builder" },
};

type SP = Record<string, string | string[] | undefined>;

export default async function BuilderPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const get = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const initial = fromShareParams(get, Object.keys(sp));
  const cat = getCategory(initial.categoryId);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">{cat ? `${cat.name} prompt builder` : "Prompt Builder"}</h1>
      <p className="lead">Say what you want in plain words, pick your AI, and get a clear, structured prompt. Everything runs in your browser. No sign-up or API key needed.</p>
      <div className="mt-8"><UniversalBuilder initial={initial} autoGenerate={!!initial.goal} /></div>
      <p className="mt-10 text-sm text-slate-500">Platform guides: {TARGETS.map((t, i) => <span key={t.id}>{i > 0 && " · "}<Link className="text-indigo-700" href={`/builder/${t.id}`}>{t.name.split(" (")[0]}</Link></span>)}</p>
    </div>
  );
}
