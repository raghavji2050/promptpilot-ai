import type { Metadata } from "next";
import Link from "next/link";
import { LibraryBrowser } from "@/components/LibraryBrowser";
import { ALL_PROMPTS } from "@/content";

export const metadata: Metadata = {
  title: "Developer Prompts for Cursor, Claude Code & ChatGPT (Laravel, Node, Next.js)",
  description: "Copy-ready coding prompts for bug fixes, refactors, tests, migrations, code review and security audits. Each prompt names the failure mode it prevents.",
  alternates: { canonical: "/developer-prompts" },
};

export default function DeveloperPromptsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-slate-500"><Link className="text-indigo-700" href="/categories/coding">Coding &amp; Technology</Link> / Developer prompts</p>
      <h1 className="h1 mt-2">Developer Prompts</h1>
      <p className="lead">Task prompts for coding agents and chat models. Replace the [bracketed] parts with your details. Pair them with an <Link className="text-indigo-700 underline" href="/agent-templates">AGENTS.md</Link> so the agent also knows your conventions.</p>
      <div className="mt-8"><LibraryBrowser items={ALL_PROMPTS.filter((p) => p.kind === "developer")} showStack showCategory={false} showLocale={false} /></div>
    </div>
  );
}
