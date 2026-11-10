"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import { ExportTabs } from "./ExportTabs";
import { AGENT_EXAMPLE, AGENT_TONES, AGENT_TOOLS, buildAgentPrompt, buildAgentsSdkSnippet, type AgentsSdkLang, type AgentInput, type AgentToolId, type AgentTone } from "@/lib/agent-builder";

const EMPTY: AgentInput = { name: "", role: "", audience: "", tasks: "", tools: [], rules: "", tone: "Friendly and simple", output: "" };

export function AgentBuilder() {
  const [v, setV] = useState<AgentInput>(EMPTY);
  const [lang, setLang] = useState<AgentsSdkLang>("ts");
  const out = useMemo(() => buildAgentPrompt(v), [v]);
  const set = <K extends keyof AgentInput>(k: K, val: AgentInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const toggleTool = (id: AgentToolId) =>
    setV((p) => {
      if (id === "none") return { ...p, tools: p.tools.includes("none") ? [] : ["none"] };
      const rest = p.tools.filter((t) => t !== "none");
      return { ...p, tools: rest.includes(id) ? rest.filter((t) => t !== id) : [...rest, id] };
    });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Agent details">
        <button type="button" className="btn-secondary" onClick={() => setV(AGENT_EXAMPLE)}>Fill an example (shop helper)</button>
        <label className="block text-sm font-medium">Agent name
          <input className="input mt-1 w-full" value={v.name} maxLength={60} placeholder="e.g. Shop Helper" onChange={(e) => set("name", e.target.value)} /></label>
        <label className="block text-sm font-medium">What is its job?
          <input className="input mt-1 w-full" value={v.role} placeholder="e.g. customer support assistant for my bakery" onChange={(e) => set("role", e.target.value)} /></label>
        <label className="block text-sm font-medium">Who does it help? (optional)
          <input className="input mt-1 w-full" value={v.audience} placeholder="e.g. customers on WhatsApp" onChange={(e) => set("audience", e.target.value)} /></label>
        <label className="block text-sm font-medium">Tasks (one per line)
          <textarea className="input mt-1 w-full" rows={4} value={v.tasks} placeholder={"Answer questions about prices\nTake orders"} onChange={(e) => set("tasks", e.target.value)} /></label>
        <fieldset>
          <legend className="text-sm font-medium">Tools the agent can use</legend>
          <div className="mt-1 grid gap-1 text-sm">
            {AGENT_TOOLS.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input type="checkbox" checked={v.tools.includes(t.id)} onChange={() => toggleTool(t.id)} /> {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">Things it must never do (one per line, optional)
          <textarea className="input mt-1 w-full" rows={3} value={v.rules} placeholder="Never promise discounts" onChange={(e) => set("rules", e.target.value)} /></label>
        <label className="block text-sm font-medium">Tone
          <select className="input mt-1 w-full" value={v.tone} onChange={(e) => set("tone", e.target.value as AgentTone)}>
            {AGENT_TONES.map((t) => <option key={t}>{t}</option>)}
          </select></label>
        <label className="block text-sm font-medium">Reply format (optional)
          <input className="input mt-1 w-full" value={v.output} placeholder="e.g. short replies under 80 words" onChange={(e) => set("output", e.target.value)} /></label>
      </form>
      <div>
        <h2 className="text-lg font-semibold text-fg">Agent instructions</h2>
        {out ? (
          <>
            <pre aria-label="Agent instructions output" data-testid="agent-output" className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 text-sm">{out}</pre>
            <CopyButton text={out} label="Copy instructions" className="mt-3" toastMessage="Agent instructions copied" />
            <ExportTabs text={out} title={v.name || "AI agent"} goal={v.role} />
            <section className="mt-6" aria-labelledby="sdk-h">
              <h2 id="sdk-h" className="text-lg font-semibold text-fg">Use in code (OpenAI Agents SDK)</h2>
              <p className="mt-1 text-sm text-muted">Starter code with these instructions. You need your own OpenAI API key to run it; PromptPilot does not run it for you.</p>
              <div className="mt-2 flex gap-2" role="group" aria-label="SDK language">
                <button type="button" className={lang === "ts" ? "btn-primary" : "btn-secondary"} aria-pressed={lang === "ts"} onClick={() => setLang("ts")}>TypeScript</button>
                <button type="button" className={lang === "py" ? "btn-primary" : "btn-secondary"} aria-pressed={lang === "py"} onClick={() => setLang("py")}>Python</button>
              </div>
              <pre tabIndex={0} aria-label="Agents SDK starter code" data-testid="agent-sdk" className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 text-xs">{buildAgentsSdkSnippet(v.name, out, lang)}</pre>
              <CopyButton text={buildAgentsSdkSnippet(v.name, out, lang)} label="Copy SDK code" variant="secondary" className="mt-2" toastMessage="SDK code copied" />
            </section>
          </>
        ) : (
          <p data-testid="agent-empty" className="mt-2 rounded-xl border border-dashed border-line p-4 text-sm text-muted">Fill in the agent name, its job and at least one task, or press &ldquo;Fill an example&rdquo;. The instructions appear here.</p>
        )}
      </div>
    </div>
  );
}
