"use client";
import Link from "next/link";
import { useState } from "react";
import type { LibraryItem } from "@/content";
import { TARGETS } from "@/lib/engine";
import { getCategory } from "@/lib/categories";
import { TrendBadge } from "./TrendBadge";
import { CopyButton } from "./CopyButton";

const targetName = (id: string) => TARGETS.find((t) => t.id === id)?.name.split(" (")[0] ?? id;

export function PromptCard({ item }: { item: LibraryItem }) {
  const cat = getCategory(item.cat);
  const [open, setOpen] = useState(false);
  const previewId = `preview-${item.slug}`;
  const platforms = item.targets.map(targetName);
  return (
    <article className="card card-hover group flex flex-col p-5" lang={item.locale === "hi" ? "hi" : undefined}>
      <div className="flex flex-wrap items-center gap-1.5">
        {cat && <span className="badge badge-accent"><span aria-hidden>{cat.icon}</span> {cat.short}</span>}
        <span className="badge">{item.category}</span>
        {item.trend && <TrendBadge status={item.trend.status} />}
        {item.stacks?.map((s) => <span key={s} className="badge">{s}</span>)}
        <span className={`badge ml-auto ${item.premium ? "" : "badge-free"}`}>{item.premium ? "Premium" : "Free"}</span>
      </div>
      <h3 className="mt-3 font-semibold text-fg">
        <Link href={`/p/${item.slug}`} className="hover:text-accent-text">{item.title}</Link>
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-muted">{item.summary}</p>
      {open && <pre id={previewId} className="output fade-up mt-3 !max-h-56 !p-3 !text-xs">{item.body}</pre>}
      <p className="mt-auto pt-3 text-xs text-subtle">{item.outputType ? `${item.outputType} · ` : ""}{platforms.slice(0, 3).join(", ")}{platforms.length > 3 ? ` +${platforms.length - 3}` : ""}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <button type="button" className="btn-ghost btn-sm" aria-expanded={open} aria-controls={previewId} onClick={() => setOpen(!open)}>{open ? "Hide preview" : "Quick preview"}</button>
        <CopyButton text={item.body} label="Copy" variant="secondary" className="btn-sm" toastMessage={`Copied “${item.title}”`} />
        <Link href={`/p/${item.slug}`} className="link ml-auto text-xs font-medium">Open →<span className="sr-only"> {item.title}</span></Link>
      </div>
    </article>
  );
}
