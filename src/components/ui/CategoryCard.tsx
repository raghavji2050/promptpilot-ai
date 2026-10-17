import Link from "next/link";
import type { Category } from "@/lib/categories";

export function CategoryCard({ category, count, compact = false }: { category: Category; count?: number; compact?: boolean }) {
  return (
    <Link href={`/categories/${category.id}`} className="card card-hover group flex h-full flex-col p-4 sm:p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-xl" aria-hidden>{category.icon}</span>
      <h3 className="mt-3 text-sm font-semibold text-fg group-hover:text-accent-text sm:text-base">{category.name}</h3>
      {!compact && <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{category.subcategories.slice(0, 3).map((s) => s.name).join(" · ")}</p>}
      {typeof count === "number" && <p className="mt-auto pt-3 text-xs text-subtle">{count} library prompt{count === 1 ? "" : "s"} · {category.subcategories.length} task types</p>}
    </Link>
  );
}
