import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/LibraryBrowser";
import { ALL_PROMPTS } from "@/content";

export const metadata: Metadata = {
  title: "Prompt Library: Search Developer, Social & General Prompts",
  description: "Search and filter every PromptPilot prompt by type, category, model, stack, trend status and language.",
  alternates: { canonical: "/library" },
};

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Prompt Library</h1>
      <p className="lead">All {ALL_PROMPTS.length} prompts in one place. Filters combine; search matches titles, tags and prompt text.</p>
      <div className="mt-8"><LibraryBrowser items={ALL_PROMPTS} showKind showStack showTrend showLocale /></div>
    </div>
  );
}
