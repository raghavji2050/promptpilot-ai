import type { Metadata } from "next";
import Link from "next/link";
import { ALL_PROMPTS } from "@/content";

export const metadata: Metadata = {
  title: "AI Tools: Prompt Builder, Library, Enhancer, Instagram Studio & More",
  description: "Free PromptPilot tools: build prompts for any AI, browse a prompt library, check and enhance prompts, Instagram photo-edit prompts, and coding-agent kits.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { href: "/builder", icon: "✦", title: "Prompt Builder", body: "Describe a goal, pick an AI and get a structured prompt. Refine tone, length, language and format, then copy or try it.", api: "No external API" },
  { href: "/library", icon: "▤", title: "Prompt Library", body: `${ALL_PROMPTS.length} free prompts with search, category and platform filters.`, api: "No external API" },
  { href: "/enhancer", icon: "◎", title: "Prompt Enhancer", body: "Paste a prompt to get a quality checklist and rule-based fixes. Optional AI polish with your own key.", api: "Optional: your own LLM API key" },
  { href: "/instagram-studio", icon: "◐", title: "Instagram Studio", body: "Photo-edit prompts for Gemini and ChatGPT that keep your face unchanged, in English and Hindi.", api: "No external API" },
  { href: "/trending", icon: "↗", title: "Trending photo prompts", body: "Formats a dated third-party source reported as trending, with the source linked.", api: "No external API" },
  { href: "/agent-templates", icon: "⌘", title: "Coding agent kit", body: "Generate AGENTS.md, Cursor rules and Claude Code files for your project.", api: "No external API" },
  { href: "/developer-prompts", icon: "</>", title: "Developer prompts", body: "Prompts for Laravel, Node.js and Next.js work: debugging, reviews, migrations and tests.", api: "No external API" },
  { href: "/builder/classic", icon: "☰", title: "Classic builder", body: "The original field-by-field builder for developers who want full control.", api: "No external API" },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="eyebrow">AI tools</p>
      <h1 className="h1 mt-2">Free AI prompt tools</h1>
      <p className="lead">Everything here works in your browser without an account. Only the optional Enhancer polish calls an AI, using your own API key.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="card card-hover group flex h-full flex-col p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-sm font-semibold text-accent-text" aria-hidden>{t.icon}</span>
              <h2 className="mt-4 font-semibold text-fg group-hover:text-accent-text">{t.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{t.body}</p>
              <p className="mt-auto pt-4 text-xs text-subtle">{t.api}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
