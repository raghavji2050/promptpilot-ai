import Link from "next/link";
import type { LibraryItem } from "@/content";
import { TARGETS } from "@/lib/engine";
import { getCategory } from "@/lib/categories";
import { TrendBadge } from "./TrendBadge";

const targetName = (id: string) => TARGETS.find((t) => t.id === id)?.name.split(" (")[0] ?? id;

export function PromptCard({ item }: { item: LibraryItem }) {
  const cat = getCategory(item.cat);
  return (
    <Link href={`/p/${item.slug}`} className="card group flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0" lang={item.locale === "hi" ? "hi" : undefined}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {cat && <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">{cat.icon} {cat.short}</span>}
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{item.category}</span>
        {item.trend && <TrendBadge status={item.trend.status} />}
        {item.stacks?.map((s) => <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{s}</span>)}
      </div>
      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{item.title}</h3>
      <p className="text-sm text-slate-600">{item.summary}</p>
      <p className="mt-auto pt-1 text-xs text-slate-500">{item.outputType ? `${item.outputType} · ` : ""}For {item.targets.map(targetName).join(", ")} · {item.premium ? "Premium" : "Free"}</p>
    </Link>
  );
}
