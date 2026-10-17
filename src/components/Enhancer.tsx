"use client";
import { useEffect, useMemo, useState } from "react";
import { adaptText, analyzePrompt, expandText, improveText, shortenText, TARGETS } from "@/lib/engine";
import { PROVIDERS, type ProviderId } from "@/lib/llm/providers-meta";
import { CopyButton } from "./CopyButton";
import { SaveButton } from "./SaveButton";
import { getSupabase } from "@/lib/supabase";

const KEY_STORE = "pp.byok.v1";

interface StoredKey { provider: ProviderId; model: string; apiKey: string; baseUrl?: string }

function readStoredKey(): StoredKey | null {
  try { return JSON.parse(localStorage.getItem(KEY_STORE) || "null") as StoredKey | null; } catch { return null; }
}

/** Client-only component (loaded with ssr:false), so browser storage is available in initializers. */
export function Enhancer() {
  const [stored] = useState(readStoredKey);
  const [input, setInput] = useState(() => sessionStorage.getItem("pp.enhance") ?? "");
  const [targetId, setTargetId] = useState("chatgpt");
  const [output, setOutput] = useState("");
  const [lastAction, setLastAction] = useState("");
  const analysis = useMemo(() => analyzePrompt(input), [input]);

  const [provider, setProvider] = useState<ProviderId>(stored?.provider ?? "openai");
  const [model, setModel] = useState(stored?.model ?? "");
  const [apiKey, setApiKey] = useState(stored?.apiKey ?? "");
  const [baseUrl, setBaseUrl] = useState(stored?.baseUrl ?? "");
  const [remember, setRemember] = useState(Boolean(stored));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Consume the hand-off from the Builder once (no state updates here).
  useEffect(() => { sessionStorage.removeItem("pp.enhance"); }, []);

  function run(action: string) {
    setErr("");
    const map: Record<string, () => string> = {
      improve: () => improveText(input, targetId),
      shorten: () => shortenText(input),
      expand: () => expandText(input, targetId),
      adapt: () => adaptText(input, targetId),
    };
    setOutput(map[action]());
    setLastAction(action);
  }

  async function runLlm() {
    setErr(""); setLoading(true);
    if (remember) localStorage.setItem(KEY_STORE, JSON.stringify({ provider, model, apiKey, baseUrl }));
    else localStorage.removeItem(KEY_STORE);
    try {
      // Signed-in users: count against the daily enhance_byok quota (schema.sql consume_quota).
      // This is a soft, client-initiated counter; the server route is still IP rate-limited.
      const sb = getSupabase();
      if (sb) {
        const { data: s } = await sb.auth.getSession();
        if (s.session) {
          const { data: left, error: qe } = await sb.rpc("consume_quota", { p_action: "enhance_byok" });
          if (!qe && left === -1) throw new Error("Daily AI enhancement limit reached");
        }
      }
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "content-type": "application/json", "x-llm-key": apiKey },
        body: JSON.stringify({ provider, model, input, target: TARGETS.find((t) => t.id === targetId)?.name, ...(provider === "openai_compatible" ? { baseUrl } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || `Request failed (${res.status})`);
      setOutput(json.text); setLastAction(`LLM (${PROVIDERS[provider].name})`);
    } catch (e) {
      setErr(`${(e as Error).message}. Your original prompt is unchanged; the rule-based tools still work.`);
    } finally { setLoading(false); }
  }

  const sev = { high: "text-rose-700 bg-rose-50", medium: "text-amber-800 bg-amber-50", low: "text-slate-700 bg-slate-100" } as const;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div className="card p-5">
          <label className="label" htmlFor="enh-in">Your prompt</label>
          <textarea id="enh-in" className="input min-h-[200px] font-mono text-[13px]" maxLength={8000} placeholder="Paste any prompt…" value={input} onChange={(e) => setInput(e.target.value)} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">Target
              <select className="input !w-auto !py-1" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                {TARGETS.map((t) => <option key={t.id} value={t.id}>{t.name.split(" (")[0]}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" disabled={!input.trim()} onClick={() => run("improve")}>Improve</button>
            <button className="btn-secondary" disabled={!input.trim()} onClick={() => run("shorten")}>Shorten</button>
            <button className="btn-secondary" disabled={!input.trim()} onClick={() => run("expand")}>Expand</button>
            <button className="btn-secondary" disabled={!input.trim()} onClick={() => run("adapt")}>Adapt format</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Rule-based and instant. No API key, no network. Bracketed [placeholders] mark information only you can supply.</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Analysis</h2>
            <span className="text-sm font-semibold">{analysis.score}/100</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{analysis.stats.words} words · {analysis.stats.chars} chars · ~{analysis.stats.approxTokens} tokens (rough chars÷4 estimate). Rule-based checklist, not a quality guarantee.</p>
          {input.trim() ? (
            <>
              <ul className="mt-3 space-y-2">
                {analysis.issues.map((i) => (
                  <li key={i.id} className="text-sm"><span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-medium ${sev[i.severity]}`}>{i.severity}</span>{i.message} <span className="text-slate-500">{i.fix}</span></li>
                ))}
              </ul>
              {analysis.strengths.length > 0 && <p className="mt-3 text-sm text-emerald-700">✓ {analysis.strengths.join(" · ")}</p>}
            </>
          ) : <p className="mt-3 text-sm text-slate-500">Paste a prompt to see issues and fixes.</p>}
        </div>
      </section>

      <section className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Result</h2>
            {lastAction && <span className="text-xs text-slate-500">via {lastAction}</span>}
          </div>
          <pre className="output mt-3" aria-live="polite">{output || "Run an action to see the result."}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={output} />
            <SaveButton title={input.slice(0, 60) || "Enhanced prompt"} output={output} source="enhancer" targetId={targetId} />
            <button className="btn-secondary" disabled={!output} onClick={() => setInput(output)}>Use as input</button>
          </div>
        </div>

        <details className="card p-5">
          <summary className="cursor-pointer font-semibold text-slate-900">Optional: enhance with your own LLM API key</summary>
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-500">Your key is sent with this one request to our server, which forwards it to the provider and does not store or log it. Usage is billed by your provider. Leave this closed to stay fully offline.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="llm-p">Provider</label>
                <select id="llm-p" className="input" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
                  {(Object.keys(PROVIDERS) as ProviderId[]).map((p) => <option key={p} value={p}>{PROVIDERS[p].name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="llm-m">Model id</label>
                <input id="llm-m" className="input" placeholder="From your provider's model list" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            {provider === "openai_compatible" && (
              <div>
                <label className="label" htmlFor="llm-b">Base URL (https, must expose /chat/completions)</label>
                <input id="llm-b" className="input" placeholder="https://api.example.com/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="llm-k">API key</label>
              <input id="llm-k" className="input" type="password" autoComplete="off" placeholder={PROVIDERS[provider].keyHint} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="accent-indigo-600" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember in this browser (localStorage)</label>
            <button className="btn-primary" disabled={!input.trim() || !apiKey || !model || loading} onClick={runLlm}>{loading ? "Enhancing…" : "Enhance with LLM"}</button>
            {err && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{err}</p>}
          </div>
        </details>
      </section>
    </div>
  );
}
