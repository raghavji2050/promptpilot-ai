"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BEFORE_AFTER } from "@/content/before-after";
import { buildUniversal, toShareParams, whatWeAdded } from "@/lib/engine";
import { BeforeAfterCompare } from "./BeforeAfter";

/** Homepage showcase: curated before/after pairs across popular use cases. */
export function BeforeAfterShowcase({ initial = 0 }: { initial?: number }) {
  const [i, setI] = useState(initial);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pair = BEFORE_AFTER[i] ?? BEFORE_AFTER[0]!;
  const result = useMemo(() => buildUniversal({ mode: "standard", ...pair.after.input }), [pair]);
  const chips = useMemo(() => whatWeAdded(result), [result]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : -1) + BEFORE_AFTER.length) % BEFORE_AFTER.length;
    setI(n); tabs.current[n]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label="Before and after examples" className="flex flex-wrap gap-2" onKeyDown={onKey}>
        {BEFORE_AFTER.map((p, n) => (
          <button key={p.id} ref={(el) => { tabs.current[n] = el; }} type="button" role="tab" id={`ba-tab-${p.id}`} aria-selected={n === i} aria-controls="ba-panel" tabIndex={n === i ? 0 : -1}
            className={`chip ${n === i ? "chip-active" : ""}`} onClick={() => setI(n)}>{p.label}</button>
        ))}
      </div>
      <div id="ba-panel" role="tabpanel" aria-labelledby={`ba-tab-${pair.id}`} className="mt-5">
        <BeforeAfterCompare beforePrompt={pair.before.prompt} beforeResponse={pair.before.response} afterPrompt={result.text} afterResponse={pair.after.response} changes={pair.changes} chips={chips} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/builder?${toShareParams({ mode: "standard", ...pair.after.input }).toString()}`} className="btn-primary">Open this in the builder</Link>
          {pair.librarySlug && <Link href={`/p/${pair.librarySlug}`} className="btn-secondary">See the library prompt</Link>}
        </div>
      </div>
    </div>
  );
}
