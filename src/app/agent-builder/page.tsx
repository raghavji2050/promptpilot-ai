import Link from "next/link";
import { AgentBuilder } from "@/components/AgentBuilder";
import { pageMeta } from "@/lib/seo";
import { AGENT_TAGLINE } from "@/lib/agent-builder";

export const metadata = pageMeta({
  title: "AI Agent Prompt Builder (Free) — system prompt for a GPT, Claude Project or Gem",
  description: "Build the instructions for your own AI agent: role, tasks, tools, rules, tone and reply format. Copy into a Custom GPT, Claude Project, Gemini Gem or Cursor rule. Free, no sign-up.",
  path: "/agent-builder",
});

export default function AgentBuilderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm text-muted" data-testid="pp2-tagline">{AGENT_TAGLINE}</p>
      <h1 className="h1 mt-2">AI Agent Prompt Builder</h1>
      <p className="lead">Describe the agent you want: its job, tasks, tools and the things it must never do. You get ready-to-paste instructions for a Custom GPT, Claude Project, Gemini Gem or any chatbot. Built from fixed templates in your browser, so nothing is sent to a model here.</p>
      <div className="mt-8"><AgentBuilder /></div>
      <p className="mt-8 text-sm text-muted">The agent&apos;s real behaviour depends on the AI tool you paste these instructions into. Building a coding agent instead? Use the <Link className="link" href="/agent-templates">coding agent kit</Link> (AGENTS.md, CLAUDE.md, Cursor rules).</p>
    </div>
  );
}
