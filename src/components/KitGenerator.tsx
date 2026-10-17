"use client";
import { useMemo, useState } from "react";
import JSZip from "jszip";
import { defaultAnswers, FILE_OPTIONS, getStack, renderKit, type StackId } from "@/lib/engine";
import { CopyButton } from "./CopyButton";

export function KitGenerator({ stack }: { stack: StackId }) {
  const def = getStack(stack);
  const [answers, setAnswers] = useState<Record<string, string>>(() => defaultAnswers(stack));
  const [files, setFiles] = useState<string[]>(FILE_OPTIONS.map((o) => o.id));
  const kit = useMemo(() => renderKit(stack, answers, { files }), [stack, answers, files]);
  const [active, setActive] = useState(0);
  const current = kit[Math.min(active, kit.length - 1)];
  const [zipping, setZipping] = useState(false);

  async function downloadZip() {
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const f of kit) zip.file(f.path, f.content);
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(answers.projectName || "agent-kit").replace(/[^A-Za-z0-9._-]/g, "-")}-agent-kit.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className="card p-5" aria-label="Project questions">
        <h2 className="font-semibold text-slate-900">Your {def.name} project</h2>
        <div className="mt-4 space-y-4">
          {def.questions.map((q) => (
            <div key={q.key}>
              {q.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={answers[q.key] === "true"} onChange={(e) => setAnswers({ ...answers, [q.key]: String(e.target.checked) })} />
                  {q.label}
                </label>
              ) : (
                <>
                  <label className="label" htmlFor={`q-${q.key}`}>{q.label}</label>
                  {q.type === "select" ? (
                    <select id={`q-${q.key}`} className="input" value={answers[q.key]} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}>
                      {q.options!.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : q.type === "textarea" ? (
                    <textarea id={`q-${q.key}`} className="input min-h-[72px]" maxLength={q.maxLen} value={answers[q.key]} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} />
                  ) : (
                    <input id={`q-${q.key}`} className="input" maxLength={q.maxLen} value={answers[q.key]} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} />
                  )}
                  {q.help && <p className="mt-1 text-xs text-slate-500">{q.help}</p>}
                </>
              )}
            </div>
          ))}
        </div>
        <fieldset className="mt-6">
          <legend className="label">Files to include</legend>
          <div className="space-y-2">
            {FILE_OPTIONS.map((o) => (
              <label key={o.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-indigo-600" checked={files.includes(o.id)} onChange={(e) => setFiles(e.target.checked ? [...files, o.id] : files.filter((x) => x !== o.id))} />
                <span><code className="text-slate-900">{o.label}</code> <span className="text-slate-500">({o.desc})</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-3 lg:sticky lg:top-20 lg:self-start" aria-label="Generated files">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={downloadZip} disabled={!kit.length || zipping}>{zipping ? "Building ZIP…" : `Download ZIP (${kit.length} files)`}</button>
            {current && <CopyButton text={current.content} label={`Copy ${current.path.split("/").pop()}`} className="!bg-slate-800 hover:!bg-slate-900" />}
          </div>
          <p className="mt-2 text-xs text-slate-500">Generated in your browser. Nothing is uploaded. Review before committing: these are starting points, not guarantees.</p>
        </div>
        {kit.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2" role="tablist">
              {kit.map((f, i) => (
                <button key={f.path} role="tab" aria-selected={i === active} onClick={() => setActive(i)} className={`whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-xs ${i === active ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  {f.path}
                </button>
              ))}
            </div>
            <pre className="output !rounded-none">{current?.content}</pre>
          </div>
        ) : (
          <p className="card p-6 text-sm text-slate-500">Select at least one file.</p>
        )}
      </section>
    </div>
  );
}
