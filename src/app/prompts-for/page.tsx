import type { Metadata } from "next";
import Link from "next/link";
import { USE_CASES } from "@/content/use-cases";

export const metadata: Metadata = {
  title: "AI Prompts by Use Case: Creators, Businesses, Students & More",
  description: "Practical AI prompt guides for content creators, small businesses, students, job interviews, image generation, marketing, productivity and research.",
  alternates: { canonical: "/prompts-for" },
};

export default function UseCasesIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">AI prompts by use case</h1>
      <p className="lead">Guides with tips, ready-made prompts and one-click builder starters for common goals.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((u) => (
          <Link key={u.slug} href={`/prompts-for/${u.slug}`} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none">
            <h2 className="font-semibold text-slate-900">{u.title} →</h2>
            <p className="mt-2 text-sm text-slate-600">{u.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
