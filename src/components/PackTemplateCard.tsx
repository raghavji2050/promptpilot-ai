"use client";
import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { ExportTabs } from "./ExportTabs";

/** One pack template: prompt preview, copy, SKILL.md export and ChatGPT/Claude/Cursor/Custom/Project tabs. */
export function PackTemplateCard({ id, title, blurb, hinglish, text, goal, builderHref }: { id: string; title: string; blurb: string; hinglish: string; text: string; goal: string; builderHref: string }) {
  const [open, setOpen] = useState(false);
  return (
    <article id={id} className="card p-5" data-testid="pack-template">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <p className="mt-1 text-sm text-muted">{blurb}</p>
      <p className="mt-2 text-xs text-subtle" lang="hi-Latn">Hinglish mein bhi chalega: “{hinglish}”</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy prompt" />
        <a className="btn-secondary" href={builderHref}>Customise in builder →</a>
        <button type="button" className="btn-secondary" aria-expanded={open} aria-controls={`${id}-preview`} onClick={() => setOpen((o) => !o)}>{open ? "Hide preview" : "Preview & export"}</button>
      </div>
      {open && (
        <div className="mt-3" id={`${id}-preview`}>
          <pre className="output !max-h-72 !p-3 !text-xs" tabIndex={0} aria-label={`${title} prompt`}>{text}</pre>
          <ExportTabs text={text} title={title} goal={goal} />
        </div>
      )}
    </article>
  );
}
