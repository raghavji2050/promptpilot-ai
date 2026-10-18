"use client";
import Link from "next/link";
import { forwardRef, useMemo, useState } from "react";
import { buildUniversal, variations, toShareParams, type UniversalInput } from "@/lib/engine";
import { useSession } from "@/lib/saved";
import { CopyButton } from "./CopyButton";
import { SaveButton } from "./SaveButton";
import { TryInButtons } from "./TryInButtons";

const shortName = (n: string) => n.split(" (")[0];

/** Result card: title, platform, full prompt, Copy, Try in…, Improve, Make shorter/more detailed, Regenerate, Save (signed in). */
export const ResultsPanel = forwardRef<HTMLHeadingElement, { input: UniversalInput; onChange: (patch: Partial<UniversalInput>) => void }>(
  function ResultsPanel({ input, onChange }, headingRef) {
    const [alt, setAlt] = useState(0);
    const { session } = useSession();
    const result = useMemo(() => buildUniversal(input), [input]);
    const vars = useMemo(() => (alt > 0 ? variations(input) : []), [alt, input]);
    const altVar = alt > 0 ? vars[(alt - 1) % Math.max(vars.length, 1)] : undefined;
    const text = altVar?.text ?? result.text;
    const change = (p: Partial<UniversalInput>) => { setAlt(0); onChange(p); };
    const title = input.goal.trim().length > 80 ? `${input.goal.trim().slice(0, 78)}…` : input.goal.trim();
    const where = result.category ? `${result.category.short}${result.sub ? ` › ${result.sub.name}` : ""}` : "General";

    return (
      <section className="card fade-up overflow-hidden text-left" aria-labelledby="result-title">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow">Your prompt</p>
            <h2 id="result-title" ref={headingRef} tabIndex={-1} className="mt-1 text-lg font-semibold text-fg outline-none">{title}</h2>
            <p className="mt-0.5 text-xs text-subtle">{where}{altVar ? ` · ${altVar.label}` : ""}{input.mode === "concise" ? " · shorter" : input.mode === "detailed" ? " · more detailed" : ""}{input.improve ? " · improved" : ""}</p>
          </div>
          <span className="badge badge-accent shrink-0">For {shortName(result.target.name)}</span>
        </div>

        <div className="px-5 py-4">
          {result.warnings.length > 0 && <ul className="mb-3 space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
          <pre className="output !max-h-[26rem]" tabIndex={0} aria-label="Generated prompt text" aria-live="polite">{text}</pre>
          <p className="mt-2 text-xs text-subtle">{text.length} characters · built instantly from templates, no AI was called.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyButton text={text} label="Copy prompt" toastMessage="Prompt copied" />
            {session
              ? <SaveButton title={title || "Untitled prompt"} output={text} source="builder" targetId={input.targetId} builderInput={{ universal: input }} templateKey={`universal:${result.sub?.id ?? result.category?.id ?? "general"}@1`} />
              : <Link href="/login" className="btn-ghost text-sm">Log in to save</Link>}
          </div>
          <TryInButtons text={text} />

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm font-medium text-fg">Refine</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Refine the prompt">
              <button type="button" className={`chip ${input.improve ? "chip-active" : ""}`} aria-pressed={!!input.improve} onClick={() => change({ improve: !input.improve })}>Improve</button>
              {result.kind === "text" && <button type="button" className={`chip ${input.askFirst ? "chip-active" : ""}`} aria-pressed={!!input.askFirst} onClick={() => change({ askFirst: !input.askFirst })}>Ask me questions first</button>}
              <button type="button" className={`chip ${input.mode === "concise" ? "chip-active" : ""}`} aria-pressed={input.mode === "concise"} onClick={() => change({ mode: input.mode === "concise" ? "standard" : "concise" })}>Make shorter</button>
              <button type="button" className={`chip ${input.mode === "detailed" ? "chip-active" : ""}`} aria-pressed={input.mode === "detailed"} onClick={() => change({ mode: input.mode === "detailed" ? "standard" : "detailed" })}>Make more detailed</button>
              <button type="button" className="chip" onClick={() => setAlt((a) => (a % 3) + 1)}>↻ Regenerate</button>
            </div>
            <p className="mt-2 text-xs text-subtle">Regenerate shows an alternative structure for the same goal. Want audience, tone, language or format controls? <Link className="link" href={`/builder?${toShareParams(input).toString()}`}>Open in the full builder →</Link></p>
          </div>
        </div>
      </section>
    );
  },
);
