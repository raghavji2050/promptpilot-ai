import Link from "next/link";
import type { LibraryItem } from "@/content";
import { TARGETS } from "@/lib/engine";
import { TrendBadge } from "./TrendBadge";

const targetName = (id: string) => TARGETS.find((t) => t.id === id)?.name.split(" (")[0] ?? id;

export function PromptCard({ item }: { item: LibraryItem }) {
  return (
    <Link href={`/p/${item.slug}`} className="card group flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md" lang={item.locale === "hi" ? "hi" : undefined}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{item.category}</span>
        {item.trend && <TrendBadge status={item.trend.status} />}
        {item.stacks?.map((s) => <span key={s} className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">{s}</span>)}
      </div>
      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{item.title}</h3>
      <p className="text-sm text-slate-600">{item.summary}</p>
      <p className="mt-auto pt-1 text-xs text-slate-400">For: {item.targets.map(targetName).join(", ")}</p>
    </Link>
  );
}
