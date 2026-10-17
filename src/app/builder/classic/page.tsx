import type { Metadata } from "next";
import Link from "next/link";
import { PromptBuilder } from "@/components/PromptBuilder";

export const metadata: Metadata = {
  title: "Classic Template Prompt Builder",
  description: "Fixed templates for cold emails, blog outlines, summaries, research briefs, study plans, coding tasks, image and video prompts.",
  alternates: { canonical: "/builder/classic" },
};

export default function ClassicBuilderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-slate-500"><Link className="text-indigo-700" href="/builder">Prompt Builder</Link> / Classic templates</p>
      <h1 className="h1 mt-2">Classic template builder</h1>
      <p className="lead">Pick a fixed template and fill in its fields. For most tasks the <Link className="text-indigo-700 underline" href="/builder">universal builder</Link> is faster: describe your goal and it picks the structure for you.</p>
      <div className="mt-8"><PromptBuilder /></div>
    </div>
  );
}
