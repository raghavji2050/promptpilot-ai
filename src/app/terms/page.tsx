import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms for using PromptPilot.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <div className="prose-simple mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">Terms of Use</h1>
      <p className="mt-2 text-sm text-slate-500">Draft, last updated {SITE.lastReviewed}. This draft needs legal review before commercial launch.</p>
      <h2>The service</h2>
      <p>PromptPilot provides prompt templates, generators and analysis tools. Outputs are starting points. Review them before use, especially generated agent configuration files committed to your codebase.</p>
      <h2>No guarantees</h2>
      <p>Prompts and checklists do not guarantee any particular result from third-party AI models. Scores are rule-based completeness checks, not quality predictions. The service is provided &ldquo;as is&rdquo;.</p>
      <h2>Your content and keys</h2>
      <p>You own what you type and generate. You are responsible for API keys you supply and for charges from your AI provider.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use the tools to create content that impersonates, harasses or sexualises real people, or edits someone&apos;s photo without consent.</li>
        <li>Follow the terms of the AI tools you paste prompts into.</li>
        <li>Do not attempt to abuse, overload or probe the service&apos;s APIs.</li>
      </ul>
      <h2>Trademarks</h2>
      <p>ChatGPT, Claude, Gemini, Grok, Perplexity, Cursor, Midjourney and other names belong to their owners. PromptPilot is not affiliated with them.</p>
      <h2>Paid plans</h2>
      <p>No paid plans are currently sold. Terms for purchases and refunds will be added before payments go live.</p>
    </div>
  );
}
