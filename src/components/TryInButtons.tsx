"use client";
import { useEffect, useRef, useState } from "react";
import { TRY_PLATFORMS, launchTry, successMessage, type TryPlatform } from "@/lib/try-in";

type State =
  | { kind: "idle" }
  | { kind: "ok"; platform: TryPlatform; opened: boolean }
  | { kind: "copy-failed"; platform: TryPlatform; opened: boolean };

/** Copy the prompt and open ChatGPT / Claude / Gemini / Grok in a new tab. */
export function TryInButtons({ text, platforms = TRY_PLATFORMS }: { text: string; platforms?: TryPlatform[] }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const empty = !text.trim();
  const helpId = "try-in-help";

  useEffect(() => {
    if (state.kind === "copy-failed") { fallbackRef.current?.focus(); fallbackRef.current?.select(); }
    if (state.kind === "ok" && state.opened) { const t = setTimeout(() => setState({ kind: "idle" }), 6000); return () => clearTimeout(t); }
  }, [state]);

  function onTry(p: TryPlatform) {
    const r = launchTry(text, p, {
      writeText: typeof navigator !== "undefined" && navigator.clipboard?.writeText ? (t) => navigator.clipboard.writeText(t) : undefined,
      open: (url, target) => window.open(url, target),
    });
    if (r.status === "empty") return;
    void r.copied.then((copied) => setState(copied ? { kind: "ok", platform: p, opened: r.opened } : { kind: "copy-failed", platform: p, opened: r.opened }));
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Try this prompt in an AI app">
        {platforms.map((p) => (
          <button key={p.id} type="button" className="btn-secondary min-h-11" disabled={empty} aria-describedby={helpId} onClick={() => onTry(p)}>
            Try in {p.name} <span aria-hidden>↗</span><span className="sr-only"> (opens in a new tab)</span>
          </button>
        ))}
      </div>
      <p id={helpId} className="mt-1.5 text-xs text-slate-500">
        {empty ? "Generate a prompt first to try it in an AI app." : "Copies your prompt and opens the official site in a new tab. You may need to paste it yourself (Ctrl/⌘ + V). Nothing is sent to the AI by us."}
      </p>

      <div aria-live="polite" role="status" className="mt-2 text-sm">
        {state.kind === "ok" && (
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-900 ring-1 ring-emerald-200">
            {successMessage(state.platform)}
            {!state.opened && <> Your browser blocked the new tab. <a className="font-medium underline" href={state.platform.url} target="_blank" rel="noopener noreferrer">Open {state.platform.name}</a></>}
          </div>
        )}
        {state.kind === "copy-failed" && (
          <div className="rounded-lg bg-amber-50 p-3 text-amber-900 ring-1 ring-amber-200">
            <p>We couldn&apos;t copy automatically. The prompt is selected below: press Ctrl/⌘ + C (or long-press → Copy), then paste it into {state.platform.name}.
              {!state.opened && <> Your browser also blocked the new tab: <a className="font-medium underline" href={state.platform.url} target="_blank" rel="noopener noreferrer">open {state.platform.name}</a>.</>}</p>
            <label className="sr-only" htmlFor="try-fallback">Prompt text to copy manually</label>
            <textarea id="try-fallback" ref={fallbackRef} readOnly value={text} className="input mt-2 min-h-[140px] font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="mt-2 text-xs underline" onClick={() => setState({ kind: "idle" })}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
