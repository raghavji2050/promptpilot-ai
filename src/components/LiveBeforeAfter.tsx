"use client";
import { useMemo } from "react";
import { whatWeAdded, type UniversalResult } from "@/lib/engine";
import { AddedChips, wordCount } from "./BeforeAfter";

/** Builder results: the user's own input as "Before", the generated prompt as "After", with auto-computed chips. */
export function LiveBeforeAfter({ goal, result, text }: { goal: string; result: UniversalResult; text: string }) {
  const chips = useMemo(() => whatWeAdded(result), [result]);
  if (!text || !goal.trim()) return null;
  const excerpt = text.split("\n").slice(0, 10).join("\n");
  return (
    <details className="details-clean group mt-5 rounded-2xl border border-line" open>
      <summary className="flex min-h-12 items-center justify-between gap-3 px-4 text-sm font-semibold text-fg">
        Before vs after <span aria-hidden className="text-subtle transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
        <section aria-label="Before: what you typed" className="min-w-0 rounded-xl bg-surface-2 p-3">
          <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">Before · what you typed</p>
          <p className="mt-2 font-mono text-sm break-words text-fg">{goal.trim()}</p>
          <p className="mt-2 text-xs text-subtle">{wordCount(goal)} words</p>
        </section>
        <section aria-label="After: your PromptPilot prompt" className="min-w-0 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] p-3">
          <p className="text-[11px] font-semibold tracking-wide text-accent-text uppercase">After · your prompt</p>
          <pre className="mt-2 max-h-40 overflow-hidden font-mono text-xs whitespace-pre-wrap text-muted [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">{excerpt}</pre>
          <p className="mt-2 text-xs text-subtle">{wordCount(text)} words · full prompt above</p>
        </section>
        <div className="md:col-span-2"><AddedChips chips={chips} /></div>
      </div>
    </details>
  );
}
