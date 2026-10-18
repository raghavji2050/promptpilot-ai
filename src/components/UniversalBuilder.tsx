"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  buildUniversal, explainPrompt, variations, toShareParams, TARGETS, TONES, LANGUAGES, OUTPUT_FORMATS,
  COMMON_IMAGE_FIELDS, COMMON_VIDEO_FIELDS, type Mode, type UniversalInput, type FieldDef, type TargetFamily,
} from "@/lib/engine";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { CopyButton } from "./CopyButton";
import { SaveButton } from "./SaveButton";
import { TryInButtons } from "./TryInButtons";
import { LiveBeforeAfter } from "./LiveBeforeAfter";
import { ShareCard } from "./ShareCard";

const GROUPS: { family: TargetFamily[]; label: string }[] = [
  { family: ["chat"], label: "Chat assistants" },
  { family: ["search"], label: "Search" },
  { family: ["image", "video"], label: "Image & video" },
  { family: ["coding_agent"], label: "Coding tools" },
];

const EXAMPLES = [
  "Help me grow my Instagram account",
  "Help me prepare for a job interview",
  "Validate my business idea for a tiffin service",
  "Make a 4-week study plan for learning Excel",
  "Write a polite email asking for a deadline extension",
  "Plan a 5-day trip to Kerala on a budget",
];

const shortName = (n: string) => n.split(" (")[0];

export function UniversalBuilder({ initial = {}, autoGenerate = false }: { initial?: Partial<UniversalInput>; autoGenerate?: boolean }) {
  const [input, setInput] = useState<UniversalInput>({ goal: "", targetId: "chatgpt", mode: "standard", ...initial, extra: { ...(initial.extra ?? {}) } });
  const [generated, setGenerated] = useState(autoGenerate && !!initial.goal?.trim());
  const [panel, setPanel] = useState<"" | "variations" | "explain">("");
  const [shareMsg, setShareMsg] = useState("");
  const [alt, setAlt] = useState(0);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<UniversalInput>) => { setAlt(0); setInput((p) => ({ ...p, ...patch })); };
  const setExtra = (k: string, v: string) => { setAlt(0); setInput((p) => ({ ...p, extra: { ...(p.extra ?? {}), [k]: v } })); };

  const result = useMemo(() => buildUniversal(input), [input]);
  const vars = useMemo(() => ((panel === "variations" || alt > 0) && generated ? variations(input) : []), [panel, alt, generated, input]);
  const reasons = useMemo(() => (panel === "explain" ? explainPrompt(result) : []), [panel, result]);
  const selectedCat = getCategory(input.categoryId);
  const subOptions = selectedCat?.subcategories ?? [];
  const visualFields: FieldDef[] = result.kind === "image" ? COMMON_IMAGE_FIELDS.filter((f) => f.key !== "subject") : result.kind === "video" ? COMMON_VIDEO_FIELDS.filter((f) => f.key !== "subject") : [];
  const subFields = result.kind === "text" ? result.sub?.fields ?? [] : [];
  const altVar = alt > 0 ? vars[(alt - 1) % Math.max(vars.length, 1)] : undefined;
  const text = generated ? (altVar?.text ?? result.text) : "";

  function generate() {
    if (!input.goal.trim()) { goalRef.current?.focus(); setGenerated(false); return; }
    setGenerated(true);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }), 0);
  }

  async function share() {
    const url = `${window.location.origin}/builder?${toShareParams(input).toString()}`;
    try { await navigator.clipboard.writeText(url); setShareMsg("Link copied. Anyone with it can reproduce this prompt; nothing is stored on our servers."); }
    catch { setShareMsg(url); }
    setTimeout(() => setShareMsg(""), 6000);
  }

  function renderField(f: FieldDef, value: string, onChange: (v: string) => void, idPrefix: string) {
    const id = `${idPrefix}-${f.key}`;
    return (
      <div key={id}>
        <label className="label" htmlFor={id}>{f.label}</label>
        {f.type === "textarea" ? (
          <textarea id={id} className="input min-h-[72px]" placeholder={f.placeholder} maxLength={f.maxLen} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : f.type === "select" ? (
          <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
            {(f.options ?? []).map((o) => <option key={o} value={o}>{o || "(not specified)"}</option>)}
          </select>
        ) : (
          <input id={id} className="input" placeholder={f.placeholder} maxLength={f.maxLen} value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </div>
    );
  }

  const detectedLabel = result.category ? `${result.category.short}${result.sub ? ` › ${result.sub.name}` : ""}` : "General";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ------------------------------------------------ inputs */}
      <section className="card p-5" aria-label="Prompt inputs">
        <form onSubmit={(e) => { e.preventDefault(); generate(); }}>
          <label className="label !text-base" htmlFor="goal">1. What do you want AI to help you with? <span className="text-rose-600" aria-hidden>*</span></label>
          <textarea ref={goalRef} id="goal" required className="input min-h-[110px] text-base" maxLength={1500}
            placeholder={result.sub?.example ? `e.g. ${result.sub.example}` : "e.g. Help me grow my Instagram account"}
            value={input.goal} onChange={(e) => set({ goal: e.target.value })} aria-describedby="goal-help" />
          <p id="goal-help" className="mt-1 text-xs text-slate-500">Plain language is fine. This is the only required field.</p>
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Example goals">
            {EXAMPLES.map((ex) => <button key={ex} type="button" className="chip !text-xs" onClick={() => { set({ goal: ex, categoryId: undefined, subcategoryId: undefined }); setGenerated(true); }}>{ex}</button>)}
          </div>

          <fieldset className="mt-5">
            <legend className="label !text-base">2. Which AI will you use?</legend>
            <div className="space-y-2">
              {GROUPS.map((g) => (
                <div key={g.label} className="flex flex-wrap items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-slate-500">{g.label}</span>
                  {TARGETS.filter((t) => g.family.includes(t.family)).map((t) => (
                    <button key={t.id} type="button" title={t.note} aria-pressed={t.id === input.targetId}
                      className={`chip ${t.id === input.targetId ? "chip-active" : ""}`} onClick={() => set({ targetId: t.id })}>{shortName(t.name)}</button>
                  ))}
                </div>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cat">3. Category</label>
              <select id="cat" className="input" value={input.categoryId ?? ""} onChange={(e) => set({ categoryId: e.target.value || undefined, subcategoryId: undefined })}>
                <option value="">Auto-detect from my goal</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sub">Task type</label>
              <select id="sub" className="input" value={input.subcategoryId ?? ""} onChange={(e) => set({ subcategoryId: e.target.value || undefined })} disabled={!selectedCat}>
                <option value="">{selectedCat ? "Auto-detect" : "Pick a category first"}</option>
                {subOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600" aria-live="polite">
            {input.goal.trim() ? <>Using: <strong>{detectedLabel}</strong>{result.source === "detected" ? " (auto-detected, change it above if wrong)" : result.source === "none" ? " (no category matched)" : ""}</> : "We'll detect the category from your goal."}
          </p>

          {(subFields.length > 0 || visualFields.length > 0) && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">{result.kind === "text" ? `${result.sub?.name} details (optional)` : `${result.kind === "image" ? "Image" : "Video"} details (optional)`}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[...subFields, ...visualFields].map((f) => renderField(f, input.extra?.[f.key] ?? "", (v) => setExtra(f.key, v), "x"))}
              </div>
            </div>
          )}

          <details className="mt-4 rounded-lg border border-slate-200 p-4" open={!!(initial.audience || initial.context || initial.tone)}>
            <summary className="cursor-pointer text-sm font-medium text-slate-800">More options: audience, tone, language, format, context</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="aud">Audience</label><input id="aud" className="input" maxLength={300} placeholder="e.g. busy parents, beginners, my manager" value={input.audience ?? ""} onChange={(e) => set({ audience: e.target.value })} /></div>
              <div><label className="label" htmlFor="tone">Tone</label><select id="tone" className="input" value={input.tone ?? ""} onChange={(e) => set({ tone: e.target.value })}>{TONES.map((t) => <option key={t} value={t}>{t || "(not specified)"}</option>)}</select></div>
              <div><label className="label" htmlFor="lang">Response language</label><select id="lang" className="input" value={input.language ?? ""} onChange={(e) => set({ language: e.target.value })}>{LANGUAGES.map((l) => <option key={l} value={l}>{l || "(same as my prompt)"}</option>)}</select></div>
              <div><label className="label" htmlFor="fmt">Output format</label><input id="fmt" className="input" list="fmt-list" maxLength={300} placeholder="e.g. Table, Checklist, 150-word email" value={input.format ?? ""} onChange={(e) => set({ format: e.target.value })} /><datalist id="fmt-list">{OUTPUT_FORMATS.map((f) => <option key={f} value={f} />)}</datalist></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="ctx">Background / context</label><textarea id="ctx" className="input min-h-[72px]" maxLength={4000} placeholder="Who you are, your situation, what you've tried, facts the AI can't guess" value={input.context ?? ""} onChange={(e) => set({ context: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="cons">Constraints (one per line)</label><textarea id="cons" className="input min-h-[60px]" maxLength={2000} placeholder={"Keep it under 200 words\nNo jargon"} value={input.constraints ?? ""} onChange={(e) => set({ constraints: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="exm">Example or reference (optional)</label><textarea id="exm" className="input min-h-[60px]" maxLength={3000} placeholder="Paste an example of the output style you like" value={input.example ?? ""} onChange={(e) => set({ example: e.target.value })} /></div>
            </div>
          </details>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary !px-6 !py-3 text-base">Generate prompt</button>
            <button type="button" className="text-sm text-slate-500 underline" onClick={() => { setInput({ goal: "", targetId: input.targetId, mode: "standard", extra: {} }); setGenerated(false); setPanel(""); }}>Clear</button>
          </div>
        </form>
      </section>

      {/* ------------------------------------------------ result */}
      <section ref={resultRef} className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Generated prompt">
        <div className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Your prompt</h2>
            <span className="badge badge-accent">For {shortName(result.target.name)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{generated && input.goal.trim() ? <><span className="font-medium text-slate-800">{input.goal.trim().length > 90 ? `${input.goal.trim().slice(0, 88)}…` : input.goal.trim()}</span> · {detectedLabel}{altVar ? ` · ${altVar.label}` : ""}</> : "Your generated prompt will appear here."}</p>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Refine">
            <button type="button" className={`chip ${input.improve ? "chip-active" : ""}`} aria-pressed={!!input.improve} disabled={!generated} onClick={() => set({ improve: !input.improve })}>Improve</button>
            <button type="button" className={`chip ${input.askFirst ? "chip-active" : ""}`} aria-pressed={!!input.askFirst} disabled={!generated || result.kind !== "text"} onClick={() => set({ askFirst: !input.askFirst })} title="The AI asks about missing key details before answering">Ask me questions first</button>
            <button type="button" className={`chip ${input.mode === "detailed" ? "chip-active" : ""}`} aria-pressed={input.mode === "detailed"} disabled={!generated} onClick={() => set({ mode: input.mode === "detailed" ? "standard" : "detailed" })}>Make more detailed</button>
            <button type="button" className={`chip ${input.mode === "concise" ? "chip-active" : ""}`} aria-pressed={input.mode === "concise"} disabled={!generated} onClick={() => set({ mode: input.mode === "concise" ? "standard" : "concise" })}>Make shorter</button>
            <button type="button" className={`chip ${input.fillGaps ? "chip-active" : ""}`} aria-pressed={!!input.fillGaps} disabled={!generated || result.kind !== "text"} onClick={() => set({ fillGaps: !input.fillGaps })}>Add missing context</button>
            <button type="button" className={`chip ${panel === "variations" ? "chip-active" : ""}`} aria-pressed={panel === "variations"} disabled={!generated} onClick={() => setPanel(panel === "variations" ? "" : "variations")}>Variations</button>
            <button type="button" className={`chip ${panel === "explain" ? "chip-active" : ""}`} aria-pressed={panel === "explain"} disabled={!generated} onClick={() => setPanel(panel === "explain" ? "" : "explain")}>Why this works</button>
            <button type="button" className="chip" disabled={!generated} onClick={() => setAlt((a) => (a % 3) + 1)} title="Rebuild the same inputs with a different structure">↻ Regenerate</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-600">Change tone
              <select className="input !w-auto !py-1" value={input.tone ?? ""} onChange={(e) => set({ tone: e.target.value })} disabled={!generated || result.kind !== "text"}>
                {TONES.map((t) => <option key={t} value={t}>{t || "default"}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-slate-600">Convert to
              <select className="input !w-auto !py-1" value={input.targetId} onChange={(e) => set({ targetId: e.target.value })} aria-label="Convert to another platform">
                {TARGETS.map((t) => <option key={t.id} value={t.id}>{shortName(t.name)}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">Regenerate cycles through alternative structures for the same inputs. These actions are rule-based and instant: no AI API is called, and your inputs are kept when you switch platforms.</p>

          {generated && result.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          )}
          <pre className="output mt-3" aria-live="polite" tabIndex={0} aria-label="Generated prompt text">{text || "Describe your goal and press Generate prompt. Your prompt will appear here."}</pre>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CopyButton text={text} label="Copy prompt" />
            <SaveButton title={(input.goal || "Untitled prompt").slice(0, 80)} output={text} source="builder" targetId={input.targetId} builderInput={{ universal: input }} templateKey={`universal:${result.sub?.id ?? result.category?.id ?? "general"}@1`} />
            <button type="button" className="btn-secondary" disabled={!text} onClick={share}>Share link</button>
            <span className="ml-auto text-xs text-slate-400">{text.length} chars · ~{Math.ceil(text.length / 4)} tokens (rough)</span>
          </div>
          {shareMsg && <p className="mt-2 break-all text-xs text-slate-600" role="status">{shareMsg}</p>}
          <TryInButtons text={text} />
          <LiveBeforeAfter goal={input.goal} result={result} text={text} />
          {generated && text && <ShareCard input={input} festivalName={result.festival?.name} />}
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-600">
            <strong className="text-slate-800">Optional: polish with an AI model.</strong> Generating above never calls an AI. If you want an LLM to rewrite this prompt, use the{" "}
            <a className="text-indigo-700 underline" href="/enhancer?from=builder" onClick={() => { if (text) sessionStorage.setItem("pp.enhance", text); }}>Enhancer</a> with your own API key (billed by your provider; we don&apos;t store it).
          </div>
        </div>

        {generated && panel === "variations" && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Variations</h3>
            <p className="mt-1 text-xs text-slate-500">Three alternative structures from the same inputs.</p>
            <div className="mt-3 space-y-4">
              {vars.map((v) => (
                <div key={v.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="font-medium text-slate-900">{v.label}</p><p className="text-xs text-slate-500">{v.description}</p></div>
                    <CopyButton text={v.text} label="Copy" />
                  </div>
                  <pre className="output mt-2 !max-h-60">{v.text}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {generated && panel === "explain" && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Why this prompt works</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        )}

        {generated && result.kind === "text" && result.missing.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Make it more specific</h3>
            <p className="mt-1 text-xs text-slate-500">Answering any of these improves the result. Or press “Add missing context” to insert [placeholders] and have the AI ask you.</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">{result.missing.slice(0, 6).map((m) => <li key={m.key}>○ {m.question}</li>)}</ul>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Prompt checklist</h3><span className="text-sm font-semibold text-slate-700">{result.score}/100</span></div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100"><div className={`h-2 rounded-full ${result.score >= 80 ? "bg-emerald-500" : result.score >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${result.score}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">A completeness checklist, not a prediction of output quality.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {result.checks.map((c) => <li key={c.id} className="flex gap-2"><span aria-hidden className={c.passed ? "text-emerald-600" : "text-slate-400"}>{c.passed ? "✓" : "○"}</span><span><span className={c.passed ? "text-slate-700" : "font-medium text-slate-900"}>{c.label}</span>{!c.passed && <span className="text-slate-500">: {c.tip}</span>}</span></li>)}
          </ul>
        </div>
        <p className="text-xs text-slate-500">Prefer fixed templates? Try the <Link className="text-indigo-700 underline" href="/builder/classic">classic template builder</Link>.</p>
      </section>
    </div>
  );
}

export type { Mode };
