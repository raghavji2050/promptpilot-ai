import type { Metadata } from "next";
import Link from "next/link";
import { STACKS } from "@/lib/engine";

export const metadata: Metadata = {
  title: "AGENTS.md, CLAUDE.md & Cursor Rules Generator for Laravel, Node.js, Next.js",
  description: "Generate coding-agent context files for your stack: AGENTS.md, CLAUDE.md, .cursor/rules/*.mdc, a code-reviewer subagent and slash commands. Free ZIP download.",
  alternates: { canonical: "/agent-templates" },
};

export default function AgentTemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Agent Templates</h1>
      <p className="lead">Give Cursor, Claude Code, Codex and other coding agents the context they need: your stack, commands, conventions and the things they must never do. Pick a stack to start.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STACKS.map((s) => (
          <Link key={s.id} href={`/agent-templates/${s.id}`} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">{s.name} →</h2>
            <p className="mt-1 text-sm text-slate-600">{s.tagline}</p>
            <p className="mt-4 text-xs text-slate-500">{s.questions.length} questions · 5 file types</p>
          </Link>
        ))}
      </div>

      <section className="prose-simple mt-14 max-w-3xl" id="formats">
        <h2>AGENTS.md vs CLAUDE.md vs Cursor rules</h2>
        <ul>
          <li><strong>AGENTS.md</strong>: a plain markdown file at the repo root with setup commands, conventions and rules. Many coding agents read it, which makes it the most portable option.</li>
          <li><strong>CLAUDE.md</strong>: Claude Code&apos;s project memory file. Our generated version imports AGENTS.md with <code>@AGENTS.md</code> so you keep one source of truth, and adds Claude Code specifics.</li>
          <li><strong>.cursor/rules/*.mdc</strong>: Cursor project rules. Each file has frontmatter with <code>description</code>, <code>globs</code> and <code>alwaysApply</code>, so rules can apply always or only to matching files. Cursor&apos;s docs describe the older single <code>.cursorrules</code> file as legacy (<a href="https://cursor.com/docs/rules" rel="noopener noreferrer" target="_blank">cursor.com/docs/rules</a>).</li>
          <li><strong>.claude/agents</strong> and <strong>.claude/commands</strong>: a reviewer subagent and <code>/review</code>, <code>/test</code> slash commands for Claude Code.</li>
        </ul>
        <p>Conventions change. Check each tool&apos;s current documentation, and review generated files before committing them.</p>
      </section>
    </div>
  );
}
