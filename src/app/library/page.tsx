import type { Metadata } from "next";
import Link from "next/link";
import { LibraryBrowser } from "@/components/LibraryBrowser";
import { ALL_PROMPTS, searchLibrary } from "@/content";
import { PromptCard } from "@/components/PromptCard";
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
  const recent = searchLibrary(ALL_PROMPTS, { sort: "newest" }).slice(0, 3);
  const studio = ALL_PROMPTS.filter((p) => p.kind === "social").slice(0, 3);
  const sections = (
    <div className="mt-8 space-y-12">
      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="h2 text-xl">Recently added</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
      </section>
      {studio.length > 0 && (
        <section aria-labelledby="studio-h" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><p className="eyebrow">Instagram Studio</p><h2 id="studio-h" className="h2 mt-1 text-xl">Photo-edit prompts that keep your face unchanged</h2></div>
            <Link href="/instagram-studio" className="link text-sm font-medium">Open Instagram Studio →</Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{studio.map((p) => <PromptCard key={p.slug} item={p} />)}</div>
        </section>
      )}
    </div>
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="eyebrow">Explore prompts</p>
      <h1 className="h1 mt-2">Prompt Library</h1>
      <p className="lead">{ALL_PROMPTS.length} free prompts written for real tasks. Replace the [bracketed] parts with your details, or open one in the <Link className="link" href="/builder">Prompt Builder</Link> to customise it.</p>
      <div className="mt-8"><LibraryBrowser items={ALL_PROMPTS} initial={{ q: one("q").slice(0, 100), cat, sub }} sections={sections} /></div>
      <nav aria-labelledby="index-h" className="mt-14 border-t border-line pt-8">
        <h2 id="index-h" className="h2 text-xl">All {ALL_PROMPTS.length} prompts (A–Z)</h2>
        <ul className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[...ALL_PROMPTS].sort((a, b) => a.title.localeCompare(b.title)).map((p) => <li key={p.slug}><Link className="text-muted hover:text-accent-text" href={`/p/${p.slug}`}>{p.title}</Link></li>)}
        </ul>
      </nav>
    </div>
  );
}
