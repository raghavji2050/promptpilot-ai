import type { Metadata } from "next";
import Link from "next/link";
import { LibraryBrowser } from "@/components/LibraryBrowser";
import { ALL_PROMPTS } from "@/content";
import { getCategory, findSubcategory } from "@/lib/categories";

export const metadata: Metadata = {
  title: "AI Prompt Library: Free Prompts for Work, Study, Content & More",
  description: "Search free, ready-to-use AI prompts for social media, business, writing, learning, images, coding, careers, productivity, data and personal finance. Filter by category, platform, language and output type.",
  alternates: { canonical: "/library" },
};

type SP = Record<string, string | string[] | undefined>;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const cat = getCategory(one("cat"))?.id ?? "";
  const sub = findSubcategory(one("sub"))?.category.id === cat ? one("sub") : "";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Prompt Library</h1>
      <p className="lead">{ALL_PROMPTS.length} free prompts written for real tasks. Replace the [bracketed] parts with your details, or open one in the <Link className="text-indigo-700 underline" href="/builder">Prompt Builder</Link> to customise it.</p>
      <div className="mt-8"><LibraryBrowser items={ALL_PROMPTS} initial={{ q: one("q").slice(0, 100), cat, sub }} /></div>
    </div>
  );
}
