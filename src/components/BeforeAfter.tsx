import type { ReactNode } from "react";
import type { AddedChip } from "@/lib/engine/compare";
import { ILLUSTRATION_NOTE } from "@/content/before-after";

function Panel({ tone, title, subtitle, children }: { tone: "before" | "after"; title: string; subtitle: string; children: ReactNode }) {
  const after = tone === "after";
  return (
    <section aria-label={title} className={`flex min-w-0 flex-col rounded-2xl border p-4 sm:p-5 ${after ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-surface" : "border-line bg-surface-2"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${after ? "badge-accent" : ""} !text-[11px] uppercase tracking-wide`}>{title}</span>
        <span className="text-xs text-subtle">{subtitle}</span>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}

export function SampleResponse({ text }: { text: string }) {
  return (
    <figure className="m-0">
      <figcaption className="text-xs font-medium text-subtle">Example output <span className="font-normal">({ILLUSTRATION_NOTE.replace(/^Example output, /, "").replace(/\.$/, "")})</span></figcaption>
      <pre className="mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-surface p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-muted">{text}</pre>
    </figure>
  );
}

export function AddedChips({ chips, title = "What we added" }: { chips: AddedChip[]; title?: string }) {
  if (!chips.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-fg">{title}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={title}>
        {chips.map((c) => (
          <li key={c.id} className="badge badge-accent !py-1" title={c.detail}><span aria-hidden>+</span> {c.label}<span className="sr-only">: {c.detail}</span></li>
        ))}
      </ul>
    </div>
  );
}

/** Side-by-side (stacked on mobile) comparison of a vague request and a PromptPilot prompt. */
export function BeforeAfterCompare({ beforePrompt, beforeResponse, afterPrompt, afterResponse, changes, chips, beforeSubtitle = "What people usually type", afterSubtitle = "Built with PromptPilot" }: {
  beforePrompt: string; beforeResponse?: string; afterPrompt: string; afterResponse?: string; changes?: string[]; chips?: AddedChip[]; beforeSubtitle?: string; afterSubtitle?: string;
}) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel tone="before" title="Before" subtitle={beforeSubtitle}>
          <div>
            <p className="text-xs font-medium text-subtle">Prompt</p>
            <p className="mt-1 rounded-xl border border-line bg-surface p-3 font-mono text-sm text-fg">{beforePrompt}</p>
            <p className="mt-1 text-xs text-subtle">{wordCount(beforePrompt)} words · no role, context, format or constraints</p>
          </div>
          {beforeResponse && <SampleResponse text={beforeResponse} />}
        </Panel>
        <Panel tone="after" title="After" subtitle={afterSubtitle}>
          <div>
            <p className="text-xs font-medium text-subtle">Prompt</p>
            <pre className="output mt-1 !max-h-64 !p-3 !text-xs" tabIndex={0} aria-label="PromptPilot prompt">{afterPrompt}</pre>
            <p className="mt-1 text-xs text-subtle">{wordCount(afterPrompt)} words · generated instantly from templates, no AI called</p>
          </div>
          {afterResponse && <SampleResponse text={afterResponse} />}
        </Panel>
      </div>
      {(changes?.length || chips?.length) ? (
        <div className="mt-4 grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 md:grid-cols-2">
          {changes?.length ? (
            <div>
              <p className="text-xs font-semibold text-fg">What changed</p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted">{changes.map((c) => <li key={c} className="flex gap-2"><span aria-hidden className="text-accent-text">✓</span>{c}</li>)}</ul>
            </div>
          ) : null}
          {chips?.length ? <AddedChips chips={chips} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}
