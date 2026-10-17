import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "PromptPilot is free to use. Premium features are planned but not available yet; there is no payment option today.",
  alternates: { canonical: "/pricing" },
};

const FREE = [
  "Universal Prompt Builder for every category and platform",
  "Improve, simplify, more detail, change tone, convert platform, variations, explanations",
  "The full prompt library and use-case guides",
  "Prompt Enhancer checks, plus optional AI polish with your own API key",
  "Instagram Studio and the coding agent kit",
  "Save prompts in your browser, or sign in to sync, favourite and share",
];
const PLANNED = [
  "Advanced prompt improvement workflows",
  "Custom prompt collections",
  "Bulk prompt generation",
  "Specialised multi-step workflows",
  "Premium template packs",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h1">Pricing</h1>
      <p className="lead">Everything on PromptPilot is free right now. We&apos;re focused on making the free tools genuinely useful before adding paid features.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6 ring-2 ring-indigo-600">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-2 text-3xl font-bold">₹0 <span className="text-base font-normal text-slate-500">no card, no sign-up required</span></p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">{FREE.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          <Link href="/builder" className="btn-primary mt-6 w-full">Start building</Link>
        </div>
        <div className="card p-6">
          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700">Coming soon</span>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Premium</h2>
          <p className="mt-2 text-sm text-slate-600">Ideas we&apos;re exploring. Not available yet, no price set, and the list may change based on what users actually need.</p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">{PLANNED.map((f) => <li key={f}>○ {f}</li>)}</ul>
          <p className="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">There is no way to pay today, and nothing on the site charges you.</p>
        </div>
      </div>
      <section className="prose-simple mt-12 max-w-3xl">
        <h2>FAQ</h2>
        <p><strong>Do I need an AI API key?</strong> No. Building and refining prompts runs on templates in your browser. A key is only needed for the optional AI polish in the Enhancer, and usage is billed by your provider.</p>
        <p><strong>Will free features be taken away?</strong> The builder, library and refinement actions are intended to stay free.</p>
        <p><strong>Refunds?</strong> Nothing is sold yet. A refund policy will be published before any payment is accepted.</p>
      </section>
    </div>
  );
}
