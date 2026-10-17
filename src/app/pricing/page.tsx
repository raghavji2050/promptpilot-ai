import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "PromptPilot is free to use. A one-time Pro Dev Kit is planned; payments are not live yet.",
  alternates: { canonical: "/pricing" },
};

const FREE = ["Prompt Builder for all 10 targets", "Improve / shorten / expand / adapt", "Enhancer analysis + bring-your-own-key LLM", "Agent kit: all stacks and file types (during early access)", "Developer, social and general prompt libraries", "Save prompts in your browser (or account if enabled)"];
const PRO = ["Everything in Free", "More stacks and monorepo variants", "Tiered CLAUDE.md templates and more subagents", "Unlimited account saves and share links", "Optional hosted enhancement (no key needed), with a daily cap"];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h1">Pricing</h1>
      <p className="lead">Free while in early access. Paid features below are planned, not yet available, and may change.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-2 text-3xl font-bold">₹0</p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">{FREE.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          <Link href="/builder" className="btn-primary mt-6 w-full">Start building</Link>
        </div>
        <div className="card relative p-6 ring-2 ring-indigo-600">
          <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white">Planned</span>
          <h2 className="text-xl font-semibold text-slate-900">Pro Dev Kit</h2>
          <p className="mt-2 text-3xl font-bold">One-time <span className="text-base font-normal text-slate-500">price TBA</span></p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">{PRO.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          <button className="btn-secondary mt-6 w-full" disabled>Payments not live yet</button>
        </div>
      </div>
      <section className="prose-simple mt-12 max-w-3xl">
        <h2>FAQ</h2>
        <p><strong>Do I need an API key?</strong> No. Every builder and generator is template-based and runs in your browser. An API key is only for the optional LLM polish in the Enhancer, billed by your provider.</p>
        <p><strong>Will free features be taken away?</strong> The core builder and libraries are intended to stay free. Some early-access agent-kit extras may move to Pro when it launches.</p>
        <p><strong>Refunds?</strong> A refund policy will be published before any payment is accepted.</p>
      </section>
    </div>
  );
}
