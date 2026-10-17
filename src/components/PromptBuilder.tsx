"use client";
import { useMemo, useState } from "react";
import { buildPrompt, fieldsFor, TARGETS, templatesForFamily, getTarget, type Mode, type TargetFamily } from "@/lib/engine";
import { CopyButton } from "./CopyButton";
import { SaveButton } from "./SaveButton";

const FAMILY_LABEL: Record<TargetFamily, string> = { chat: "Chat", search: "Search", coding_agent: "Coding agent", image: "Image", video: "Video" };

export function PromptBuilder({ initialTarget = "chatgpt", initialTemplate }: { initialTarget?: string; initialTemplate?: string }) {
  const [targetId, setTargetId] = useState(initialTarget);
  const target = getTarget(targetId);
  const templates = useMemo(() => {
    const own = templatesForFamily(target.family);
    return own.length ? own : templatesForFamily("chat");
  }, [target.family]);
  const [templateId, setTemplateId] = useState(initialTemplate && templates.some((t) => t.id === initialTemplate) ? initialTemplate : templates[0].id);
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0];
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("standard");
  const [improve, setImprove] = useState(false);

  const result = useMemo(() => buildPrompt({ templateId: tpl.id, targetId, mode, improve, values }), [tpl.id, targetId, mode, improve, values]);
  const fields = fieldsFor(tpl.id);
  const missing = result.checks.filter((c) => !c.passed);

  function fillExample() {
    if (tpl.families.includes("image")) {
      setValues({ subject: "a chai vendor pouring tea at dawn in an old Punjab market", style: "cinematic 35mm film photo", lighting: "soft golden hour, steam backlit", composition: "medium close-up, shallow depth of field", mood: "warm, nostalgic", aspect: "4:5", avoid: "text, watermark" });
    } else if (tpl.families.includes("video")) {
      setValues({ subject: "a barista pours latte art in slow motion", shot: "close-up", camera: "slow dolly in", setting: "cozy cafe, morning window light", style: "cinematic, shallow depth of field", duration: "8 seconds", audio: "soft cafe ambience", aspect: "9:16" });
    } else if (tpl.id === "code-task") {
      setValues({ goal: "Add CSV export to the invoices list page", context: "Laravel app for a small accounting firm; invoices table has ~50k rows.", stack: "Laravel 12, PHP 8.3, MySQL, Pest", files: "app/Http/Controllers/InvoiceController.php\nresources/views/invoices/index.blade.php", done: "Export streams rows without loading all into memory; feature test passes", constraints: "No new packages" });
    } else {
      setValues({ goal: "Write a cold email to dental clinics offering a website redesign", context: "I run a small web studio in Mohali that builds fast, mobile-friendly clinic websites.", audience: "clinic owners, non-technical", tone: "friendly", format: "Subject line + email under 120 words", constraints: "Mention a free audit\nNo jargon", offer: "free website audit", cta: "reply to book a 15-minute call", keyword: "dental clinic website", source: "Paste text here" });
    }
  }

  function changeTarget(id: string) {
    const fam = getTarget(id).family;
    setTargetId(id);
    const avail = templatesForFamily(fam);
    const list = avail.length ? avail : templatesForFamily("chat");
    if (!list.some((t) => t.id === templateId)) setTemplateId(list[0].id);
  }

  const scoreColor = result.score >= 80 ? "bg-emerald-500" : result.score >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5" aria-label="Prompt inputs">
        <fieldset>
          <legend className="label">1. Target model</legend>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((t) => (
              <button key={t.id} type="button" onClick={() => changeTarget(t.id)} className={`chip ${t.id === targetId ? "chip-active" : ""}`} aria-pressed={t.id === targetId} title={t.note}>
                {t.name.split(" (")[0]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{FAMILY_LABEL[target.family]} · {target.note}</p>
        </fieldset>

        <div className="mt-5">
          <label className="label" htmlFor="tpl">2. Task template</label>
          <select id="tpl" className="input" value={tpl.id} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}: {t.description}</option>)}
          </select>
        </div>

        <div className="mt-5 space-y-4">
          <p className="label !mb-0">3. Details</p>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={`f-${f.key}`}>{f.label}{f.required && <span className="text-rose-600"> *</span>}</label>
              {f.type === "textarea" ? (
                <textarea id={`f-${f.key}`} className="input min-h-[80px]" placeholder={f.placeholder} maxLength={f.maxLen} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : f.type === "select" ? (
                <select id={`f-${f.key}`} className="input" value={values[f.key] ?? f.options?.[0] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                  {f.options?.map((o) => <option key={o} value={o}>{o || "(not specified)"}</option>)}
                </select>
              ) : (
                <input id={`f-${f.key}`} className="input" placeholder={f.placeholder} maxLength={f.maxLen} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              )}
              {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
            </div>
          ))}
          <div className="flex gap-4 text-sm">
            <button type="button" className="text-indigo-700 underline" onClick={fillExample}>Fill with an example</button>
            <button type="button" className="text-slate-500 underline" onClick={() => setValues({})}>Clear all fields</button>
          </div>
        </div>
      </section>

      <section className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Generated prompt">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Transform">
              {(["standard", "concise", "detailed"] as Mode[]).map((m) => (
                <button key={m} type="button" className={`chip ${mode === m ? "chip-active" : ""}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {m === "standard" ? "Standard" : m === "concise" ? "Shorten" : "Expand"}
                </button>
              ))}
              <button type="button" className={`chip ${improve ? "chip-active" : ""}`} aria-pressed={improve} onClick={() => setImprove(!improve)}>Improve ✦</button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Adapt to
              <select className="input !w-auto !py-1" value={targetId} onChange={(e) => changeTarget(e.target.value)} aria-label="Adapt to target">
                {TARGETS.map((t) => <option key={t.id} value={t.id}>{t.name.split(" (")[0]}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">All transforms are rule-based and instant. Same input → same output. No API calls.</p>

          {result.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{result.warnings.map((w) => <li key={w}>⚠ {w}</li>)}</ul>
          )}
          <pre className="output mt-3" aria-live="polite">{result.text || "Your prompt will appear here."}</pre>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CopyButton text={result.text} />
            <SaveButton title={(values.goal || values.subject || tpl.name).slice(0, 80)} output={result.text} source="builder" targetId={targetId} builderInput={{ templateId: tpl.id, mode, improve, values }} templateKey={result.templateKey} />
            <a className="btn-secondary" href={`/enhancer?from=builder`} onClick={() => sessionStorage.setItem("pp.enhance", result.text)}>Send to Enhancer</a>
            <span className="ml-auto text-xs text-slate-400">{result.text.length} chars · ~{Math.ceil(result.text.length / 4)} tokens (rough estimate)</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Prompt checklist</h2>
            <span className="text-sm font-semibold text-slate-700">{result.score}/100</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100"><div className={`h-2 rounded-full ${scoreColor}`} style={{ width: `${result.score}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">A completeness checklist (rule-based), not a prediction of output quality.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {result.checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span aria-hidden className={c.passed ? "text-emerald-600" : "text-slate-400"}>{c.passed ? "✓" : "○"}</span>
                <span><span className={c.passed ? "text-slate-700" : "font-medium text-slate-900"}>{c.label}</span>{!c.passed && <span className="text-slate-500">: {c.tip}</span>}</span>
              </li>
            ))}
          </ul>
          {missing.length === 0 && <p className="mt-3 text-sm text-emerald-700">All checks passed.</p>}
        </div>
      </section>
    </div>
  );
}
