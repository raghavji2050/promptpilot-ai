import type { Metadata } from "next";
import { EnhancerClient } from "@/components/EnhancerClient";

export const metadata: Metadata = {
  title: "Prompt Enhancer: Analyse & Improve Any AI Prompt",
  description: "Paste a prompt to get a rule-based analysis (missing context, format, constraints) and instant improve, shorten, expand and adapt actions. Optional LLM polish with your own API key.",
  alternates: { canonical: "/enhancer" },
};

export default function EnhancerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Prompt Enhancer</h1>
      <p className="lead">Find what your prompt is missing and fix it. The analysis and transforms are rule-based and run in your browser. An LLM is optional and uses your own key.</p>
      <div className="mt-8"><EnhancerClient /></div>
    </div>
  );
}
