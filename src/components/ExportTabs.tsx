"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { CopyButton } from "./CopyButton";
import { useToast } from "./ui/Toast";
import { SNIPPET_TARGETS, buildSkillMd, buildSnippet, cursorRulePath, type SnippetTarget } from "@/lib/export-formats";

/** "Export as SKILL.md" download + ChatGPT/Claude/Cursor tabs + Custom/Project Instructions with a copy-ready snippet each. */
export function ExportTabs({ text, title, goal }: { text: string; title: string; goal?: string }) {
  const [active, setActive] = useState<SnippetTarget>("chatgpt");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const toast = useToast();
  const base = useId();
  const empty = !text.trim();
  const current = SNIPPET_TARGETS.find((t) => t.id === active) ?? SNIPPET_TARGETS[0]!;
  const snippet = empty ? "" : buildSnippet(active, text, title, goal);

  function downloadSkill() {
    if (empty) return;
    const blob = new Blob([buildSkillMd({ title, goal, body: text })], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "SKILL.md"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("SKILL.md downloaded");
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = SNIPPET_TARGETS.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(SNIPPET_TARGETS[next]!.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mt-4 rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">Export and standing instructions</h3>
        <button type="button" className="btn-secondary" disabled={empty} onClick={downloadSkill} aria-describedby={`${base}-skill-help`}>
          <span aria-hidden>⤓</span> Export as SKILL.md
        </button>
      </div>
      <p id={`${base}-skill-help`} className="mt-1 text-xs text-subtle">SKILL.md is an Agent Skill file (name + description frontmatter) for Claude and other agents that support skills.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Export formats">
        {SNIPPET_TARGETS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-panel`}
            tabIndex={active === t.id ? 0 : -1}
            className={`chip ${active === t.id ? "chip-active" : ""}`}
            disabled={empty}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${active}`} className="mt-2">
        <p className="text-xs text-subtle">{current.help}{active === "cursor" && <> File: <code className="rounded border border-line px-1">{cursorRulePath(title)}</code></>}</p>
        <pre className="output mt-2 max-h-56 overflow-auto text-xs" tabIndex={0} aria-label={`${current.name} snippet`}>{snippet || "Generate a prompt first."}</pre>
        <CopyButton className="mt-2" text={snippet} label={`Copy for ${current.name}`} variant="secondary" toastMessage={`${current.name} snippet copied`} />
      </div>
    </div>
  );
}
