"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, isActive } from "@/lib/site";
import { useSession } from "@/lib/saved";
import { ThemeToggle } from "./ui/ThemeToggle";

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { session } = useSession();
  const btnRef = useRef<HTMLButtonElement>(null);
  const authLink = session ? { href: "/dashboard", label: "My Prompts" } : { href: "/login", label: "Log in" };

  // Close the menu after navigation (state reset on prop change, no effect needed).
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-fg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-xs font-bold text-white" aria-hidden>PP</span>
          <span>PromptPilot <span className="text-accent-text">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.map((n) => {
            const active = isActive(path, n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-accent-soft font-medium text-accent-text" : "text-muted hover:bg-surface-2 hover:text-fg"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href={authLink.href} className="btn-secondary hidden !min-h-9 sm:inline-flex">{authLink.label}</Link>
          <Link href="/builder" className="btn-primary hidden !min-h-9 md:inline-flex lg:hidden xl:inline-flex">Build a prompt</Link>
          <button ref={btnRef} type="button" className="btn-ghost !min-h-10 !px-2.5 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"} /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="fade-up border-t border-line bg-surface px-4 pb-4 pt-2 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-0.5">
            {[...NAV, authLink].map((n) => {
              const active = isActive(path, n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-lg px-3 text-base ${active ? "bg-accent-soft font-medium text-accent-text" : "text-fg hover:bg-surface-2"}`}>{n.label}</Link>
                </li>
              );
            })}
          </ul>
          <Link href="/builder" onClick={() => setOpen(false)} className="btn-primary btn-lg mt-3 w-full">Build a prompt</Link>
        </nav>
      )}
    </header>
  );
}
