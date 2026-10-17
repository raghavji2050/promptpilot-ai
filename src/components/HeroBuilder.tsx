"use client";
import { useEffect, useRef, useState } from "react";
import type { UniversalInput } from "@/lib/engine";
import { ResultsPanel } from "./ResultsPanel";

export const HERO_EXAMPLES = [
  { label: "Instagram Reel script", goal: "Write an Instagram Reel script for my home bakery" },
  { label: "Validate a business idea", goal: "Validate my business idea for a tiffin service" },
  { label: "Study plan", goal: "Make a 4-week study plan to learn Excel" },
  { label: "Professional email", goal: "Write a professional email asking for a deadline extension" },
  { label: "Build a website with AI", goal: "Build a website for my bakery with AI" },
  { label: "Plan a YouTube video", goal: "Plan a YouTube video about budget travel in India" },
];

export function HeroBuilder({ platforms }: { platforms: { id: string; name: string }[] }) {
  const [goal, setGoal] = useState("");
  const [targetId, setTargetId] = useState("chatgpt");
  const [input, setInput] = useState<UniversalInput | null>(null);
  const [error, setError] = useState("");
  const [ph, setPh] = useState(0);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Rotate the placeholder through examples; paused once the user types and when reduced motion is requested.
  useEffect(() => {
    if (goal || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setPh((i) => (i + 1) % HERO_EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, [goal]);

  function run(g: string, t = targetId) {
    const clean = g.trim();
    if (!clean) { setError("Tell us what you want AI to help with, or pick an example below."); goalRef.current?.focus(); return; }
    setError("");
    setInput({ goal: clean, targetId: t, mode: "standard", extra: {} });
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      headingRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      {/* Works without JavaScript too: the form falls back to a GET on /builder. */}
      <form action="/builder" method="get" noValidate onSubmit={(e) => { e.preventDefault(); run(goal); }}
        className="card p-3 text-left shadow-[var(--shadow-md)] sm:p-4">
        <label htmlFor="hero-goal" className="block px-1 pb-2 text-sm font-medium text-fg">What do you want AI to help you with?</label>
        <textarea ref={goalRef} id="hero-goal" name="goal" rows={3} maxLength={1500} value={goal}
          onChange={(e) => { setGoal(e.target.value); if (error) setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(goal); } }}
          placeholder={`e.g. ${HERO_EXAMPLES[ph].goal}`} aria-invalid={!!error} aria-describedby={error ? "hero-error" : "hero-hint"}
          className="input !min-h-[96px] resize-y !border-transparent !bg-surface-2 !px-4 !py-3 text-base focus:!border-[var(--accent)] sm:text-lg" />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="hero-platform" className="sr-only">AI platform</label>
          <select id="hero-platform" name="platform" className="input sm:!w-56" value={targetId} onChange={(e) => { setTargetId(e.target.value); if (input) setInput({ ...input, targetId: e.target.value }); }}>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p id="hero-hint" className="text-xs text-subtle sm:flex-1">No sign-up required · Ctrl/⌘ + Enter</p>
          <button type="submit" className="btn-primary btn-lg w-full sm:w-auto">Generate prompt <span aria-hidden>→</span></button>
        </div>
        {error && <p id="hero-error" role="alert" className="mt-2 px-1 text-sm text-rose-700">{error}</p>}
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Try an example">
        {HERO_EXAMPLES.map((ex, i) => (
          <button key={ex.label} type="button" onClick={() => { setGoal(ex.goal); run(ex.goal); }}
            className={`chip !text-xs sm:!text-sm ${!goal && i === ph ? "!border-[var(--accent)] !text-fg" : ""}`}>{ex.label}</button>
        ))}
      </div>

      {input && <div className="mt-8"><ResultsPanel ref={headingRef} input={input} onChange={(p) => setInput((cur) => (cur ? { ...cur, ...p } : cur))} /></div>}
    </div>
  );
}
