import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Prompt Categories: Find Prompts for Any Goal",
  description: "Browse AI prompt categories: social media, business, writing, learning, image and video, coding, career, productivity, data and research, finance and general knowledge.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">What do you want to do?</h1>
      <p className="lead">Pick a goal. Each category has task types with their own structure, so the prompt fits what you&apos;re actually trying to do.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <section key={c.id} className="card flex flex-col p-5">
            <h2 className="text-lg font-semibold text-slate-900"><Link href={`/categories/${c.id}`} className="hover:text-indigo-700"><span aria-hidden>{c.icon}</span> {c.name}</Link></h2>
            <p className="mt-1 text-sm text-slate-600">{c.description}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {c.subcategories.slice(0, 6).map((s) => <li key={s.id}><Link href={`/builder?cat=${c.id}&sub=${s.id}`} className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">{s.name}</Link></li>)}
            </ul>
            <Link href={`/categories/${c.id}`} className="mt-auto pt-4 text-sm font-medium text-indigo-700">All {c.subcategories.length} task types →</Link>
          </section>
        ))}
      </div>
    </div>
  );
}
