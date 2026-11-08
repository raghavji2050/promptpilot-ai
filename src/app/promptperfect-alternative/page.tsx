import type { Metadata } from "next";
import Link from "next/link";
import { documentTitle } from "@/lib/seo";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/site";

const title = "PromptPerfect Alternative (Free, No Signup) | PromptPilot AI";
const description = "PromptPerfect is no longer available. PromptPilot AI is a free prompt builder for ChatGPT, Claude, Gemini and Cursor: no signup, no API key, Hinglish input.";

export const metadata: Metadata = {
  title: documentTitle(title), description,
  alternates: { canonical: "/promptperfect-alternative" },
  openGraph: { images: [DEFAULT_OG_IMAGE], title, description, url: absoluteUrl("/promptperfect-alternative") },
};

const rows: [string, string, string][] = [
  ["Available today", "No (see their notice)", "Yes"],
  ["Price", "Was paid", "Free"],
  ["Signup needed", "Yes", "No"],
  ["Works with", "Chosen target model", "Any model: ChatGPT, Claude, Gemini, Cursor"],
  ["Hinglish input", "No", "Yes"],
  ["Export as SKILL.md / Cursor rules", "No", "Yes"],
];

export default function PromptPerfectAlternativePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">A free PromptPerfect alternative</h1>
      <p className="lead">PromptPerfect&apos;s own site says: &ldquo;Following Jina AI&apos;s acquisition by Elastic in October 2025, PromptPerfect will no longer be available after September 1, 2026.&rdquo; If you used it to turn a rough idea into a clear prompt, PromptPilot does that for free, with no account.</p>
      <p className="mt-2 text-sm text-muted">Source: <a className="underline" href="https://promptperfect.jina.ai" rel="noopener noreferrer">promptperfect.jina.ai</a> (checked 1 Nov 2026).</p>
      <table className="mt-8 w-full text-left text-sm" data-testid="compare-table">
        <thead><tr><th className="py-2">Feature</th><th>PromptPerfect</th><th>PromptPilot AI</th></tr></thead>
        <tbody>{rows.map(([f, a, b]) => <tr key={f} className="border-t"><td className="py-2">{f}</td><td>{a}</td><td>{b}</td></tr>)}</tbody>
      </table>
      <p className="mt-6 text-sm text-muted">Honest note: PromptPilot builds prompts from tested templates. It does not call an AI model to rewrite them, so results are predictable and free.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="btn btn-primary" href="/builder">Open the free builder</Link>
        <Link className="btn" href="/enhancer">Improve an existing prompt</Link>
      </div>
    </div>
  );
}
