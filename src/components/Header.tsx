"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm text-white" aria-hidden>PP</span>
          PromptPilot<span className="text-indigo-600">AI</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-md px-2.5 py-1.5 text-sm ${path?.startsWith(n.href) ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-slate-900"}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/dashboard" className="ml-2 btn-secondary !py-1.5 text-sm">My Prompts</Link>
        </nav>
        <button className="rounded-md p-2 text-slate-700 lg:hidden" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 lg:hidden" aria-label="Mobile">
          {[...NAV, { href: "/dashboard", label: "My Prompts" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-slate-700 hover:bg-slate-50">{n.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
