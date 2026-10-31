import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Pricing: Free now, Pro coming soon",
  description: "PromptPilot is free to use today. A Pro plan is coming soon; there is no price and no payment option yet.",
  alternates: { canonical: "/pricing" },
};

const FREE = [
  "Prompt Builder for every category and AI: ChatGPT, Claude, Gemini, Grok, Midjourney, video tools, Cursor",
  "Before/After comparison to see how much better the prompt is",
  "Refine: shorter, more detail, change tone, convert platform, variations",
  "Full prompt library, use-case guides and festival studios",
  "Output in English or other languages, including Hindi and Hinglish",
  "Try-in buttons for ChatGPT, Claude, Gemini and Grok",
  "Run free on this page with a small daily limit (rolling out)",
];
const PLANNED = [
  "More daily Runs for text and images",
  "Saved prompt history and collections",
  "Premium prompt packs",
  "Bulk prompt generation",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h1">Free now. Pro coming soon.</h1>
      <p className="lead">Everything on PromptPilot is free today, with no sign-up. We&apos;re making the free tools genuinely useful before adding a paid plan.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6 ring-2 ring-indigo-600">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-2 text-3xl font-bold">$0 <span className="text-base font-normal text-slate-500">no card, no sign-up required</span></p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">{FREE.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          <Link href="/builder" className="btn-primary mt-6 w-full">Start building</Link>
        </div>
        <div className="card p-6">
          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700">Coming soon</span>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Pro</h2>
          <p className="mt-2 text-sm text-slate-600">What we plan to include. Not available yet, no price set, and the list may change based on what users need.</p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">{PLANNED.map((f) => <li key={f}>○ {f}</li>)}</ul>
          <p className="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">There is no way to pay today, and nothing on the site charges you.</p>
          <WaitlistForm />
        </div>
      </div>
      <section className="prose-simple mt-12 max-w-3xl">
        <h2>FAQ</h2>
        <p><strong>Do I need an AI API key?</strong> No. Prompts are built from templates in your browser. The free Run button uses our own limited free quota; the Enhancer&apos;s AI polish can use your own key, billed by your provider.</p>
        <p><strong>Will free features be taken away?</strong> The builder, library, Before/After and refinement actions are intended to stay free.</p>
        <p><strong>Refunds?</strong> Nothing is sold yet. A refund policy will be published before any payment is accepted.</p>
      </section>
    </div>
  );
}
