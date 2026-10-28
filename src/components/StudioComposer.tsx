"use client";
import { useMemo, useState } from "react";
import { buildStudioPrompt, STUDIO_STYLES } from "@/lib/engine";
import { CopyButton } from "./CopyButton";
import { SaveButton } from "./SaveButton";

export function StudioComposer() {
  const [styleId, setStyleId] = useState(STUDIO_STYLES[0]!.id);
  const [aspect, setAspect] = useState("4:5");
  const [locale, setLocale] = useState<"en" | "hi">("en");
  const [people, setPeople] = useState<"one" | "group">("one");
  const [details, setDetails] = useState("");
  const text = useMemo(() => buildStudioPrompt({ styleId, aspect, locale, details, people }), [styleId, aspect, locale, details, people]);
  const style = STUDIO_STYLES.find((s) => s.id === styleId)!;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-5 p-5">
        <fieldset>
          <legend className="label">Style</legend>
          <div className="flex flex-wrap gap-2">
            {STUDIO_STYLES.map((s) => <button key={s.id} type="button" className={`chip ${s.id === styleId ? "chip-active" : ""}`} aria-pressed={s.id === styleId} onClick={() => setStyleId(s.id)}>{s.name}</button>)}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="st-aspect">Aspect ratio</label>
            <select id="st-aspect" className="input" value={aspect} onChange={(e) => setAspect(e.target.value)}>
              <option value="4:5">4:5 (feed post)</option><option value="9:16">9:16 (Reels / Stories / Shorts)</option><option value="1:1">1:1</option><option value="16:9">16:9</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="st-lang">Prompt language</label>
            <select id="st-lang" className="input" value={locale} onChange={(e) => setLocale(e.target.value as "en" | "hi")}>
              <option value="en">English</option><option value="hi">हिन्दी</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="st-people">People in photo</label>
            <select id="st-people" className="input" value={people} onChange={(e) => setPeople(e.target.value as "one" | "group")}>
              <option value="one">One person</option><option value="group">Couple / group</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="st-details">Extra details (optional)</label>
          <input id="st-details" className="input" maxLength={300} placeholder="e.g. wearing a red saree, holding a coffee cup" value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Only edit photos of yourself or people who agreed. AI-generated images may carry invisible watermarks (e.g. Google SynthID), and Instagram may label AI-edited content.
          English prompts are often followed more reliably than other languages; try both if results differ.
        </p>
      </div>
      <div className="card p-5 lg:sticky lg:top-20 lg:self-start">
        <p className="text-sm text-slate-500">Upload your photo in Gemini or ChatGPT, then paste:</p>
        <pre className="output mt-2" lang={locale}>{text}</pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={text} />
          <SaveButton title={`Studio: ${style.name}`} output={text} source="studio" targetId="gemini" />
          <a className="btn-secondary" href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">Open Gemini ↗</a>
          <a className="btn-secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a>
        </div>
      </div>
    </div>
  );
}
