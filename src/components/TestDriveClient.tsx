"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { deterministicTestDrive, TEST_DRIVE_SAMPLES, type DeterministicTestDrive } from "@/lib/engine/test-drive";
import type { TestDriveConfig, TestDriveModelResult, TestDriveResponse } from "@/lib/run/test-drive";
import { absoluteUrl } from "@/lib/site";
import { getSupabase } from "@/lib/supabase";
import { CopyButton } from "./CopyButton";
import { TryInButtons } from "./TryInButtons";
import { AddedChips } from "./BeforeAfter";
import { useToast } from "./ui/Toast";

const TARGET_OPTIONS = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "gemini", name: "Gemini" },
  { id: "grok", name: "Grok" },
] as const;
const SHARE_URL = absoluteUrl("/test-drive");
const SHARE_HOST = SHARE_URL.replace(/^https?:\/\//, "");

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } catch { return {}; }
}
let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function ScoreBadge({ score, delta, label }: { score: number; delta?: number; label: string }) {
  const tone = score >= 75 ? "bg-emerald-50 text-emerald-800" : score >= 45 ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-800";
  return (
    <span className="inline-flex items-center gap-1.5" data-testid={`score-${label}`}>
      <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${tone}`} aria-label={`${label} score ${score} out of 100`}>{score}/100</span>
      {delta !== undefined && delta !== 0 && <span className="badge badge-free !text-sm font-semibold" data-testid="score-delta">{delta > 0 ? "+" : ""}{delta} pts</span>}
    </span>
  );
}

export function shareSummary(d: DeterministicTestDrive): string {
  const added = d.addedChips.slice(0, 4).map((c) => c.label).join(", ");
  return [
    "Prompt Test Drive on PromptPilot AI",
    `Raw idea: "${d.rawIdea.length > 90 ? `${d.rawIdea.slice(0, 87)}…` : d.rawIdea}" scored ${d.raw.score}/100`,
    `PromptPilot prompt scored ${d.improved.score}/100 (${d.scoreDelta >= 0 ? "+" : ""}${d.scoreDelta} pts)`,
    ...(added ? [`Added: ${added}`] : []),
    `Test drive your own prompt free: ${SHARE_URL}`,
  ].join("\n");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = w; } else line = next;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] = (lines[maxLines - 1] ?? "").replace(/\s*\S*$/, "") + "…";
  return lines;
}

/** Draws a 1200×630 share card in the browser (no server cost) and returns a PNG data URL. */
export function drawShareCard(canvas: HTMLCanvasElement, d: DeterministicTestDrive): string {
  const W = 1200, H = 630, scale = 2;
  canvas.width = W * scale; canvas.height = H * scale;
  const c = canvas.getContext("2d");
  if (!c) return "";
  c.scale(scale, scale);
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#4338ca");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const font = (w: number, s: number) => `${w} ${s}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  c.fillStyle = "#c7d2fe"; c.font = font(600, 26); c.fillText("PROMPT TEST DRIVE", 64, 84);
  c.fillStyle = "#ffffff"; c.font = font(700, 44);
  wrap(c, `“${d.rawIdea}”`, W - 128, 2).forEach((l, i) => c.fillText(l, 64, 150 + i * 54));

  const box = (x: number, label: string, score: number, accent: boolean) => {
    c.fillStyle = accent ? "#ffffff" : "rgba(255,255,255,0.12)";
    c.beginPath(); c.roundRect(x, 270, 330, 190, 24); c.fill();
    c.fillStyle = accent ? "#4338ca" : "#c7d2fe"; c.font = font(600, 24); c.fillText(label, x + 32, 318);
    c.fillStyle = accent ? "#1e1b4b" : "#ffffff"; c.font = font(800, 88); c.fillText(String(score), x + 32, 420);
    const w = c.measureText(String(score)).width;
    c.font = font(600, 32); c.fillStyle = accent ? "#6366f1" : "#a5b4fc"; c.fillText("/100", x + 40 + w, 420);
  };
  box(64, "Raw idea", d.raw.score, false);
  c.fillStyle = "#fbbf24"; c.font = font(800, 56); c.fillText("→", 420, 385);
  box(500, "PromptPilot", d.improved.score, true);
  c.fillStyle = "#fbbf24"; c.font = font(800, 64); c.fillText(`${d.scoreDelta >= 0 ? "+" : ""}${d.scoreDelta} pts`, 868, 390);

  const ups = d.addedChips.slice(0, 3).map((x) => x.label);
  if (ups.length) {
    c.font = font(600, 24);
    let x = 64;
    for (const u of ups) {
      const t = `+ ${u}`; const w = c.measureText(t).width + 32;
      if (x + w > W - 64) break;
      c.fillStyle = "rgba(255,255,255,0.14)"; c.beginPath(); c.roundRect(x, 492, w, 44, 22); c.fill();
      c.fillStyle = "#e0e7ff"; c.fillText(t, x + 16, 522); x += w + 12;
    }
  }
  c.fillStyle = "#a5b4fc"; c.font = font(500, 22); c.fillText("Scores from PromptPilot's free prompt analyzer (9 checks: context, format, audience, constraints…)", 64, 580);
  c.fillStyle = "#ffffff"; c.font = font(700, 26); const url = SHARE_HOST; c.fillText(url, W - 64 - c.measureText(url).width, 84);
  return canvas.toDataURL("image/png");
}

type Live =
  | { s: "idle" } | { s: "checking" } | { s: "running" }
  | { s: "done"; r: Extract<TestDriveResponse, { ok: true }> }
  | { s: "error"; code: string; message: string };

function words(n: number) { return `${n} word${n === 1 ? "" : "s"}`; }

function OutputCol({ title, text, ms, n, structured, accent }: { title: string; text?: string; ms?: number; n: number; structured: boolean; accent?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl p-3 ${accent ? "border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))]" : "bg-surface-2"}`}>
      <p className={`text-[11px] font-semibold tracking-wide uppercase ${accent ? "text-accent-text" : "text-subtle"}`}>{title}</p>
      {text ? <>
        <pre className="mt-2 max-h-72 overflow-auto font-sans text-xs leading-relaxed whitespace-pre-wrap text-fg" tabIndex={0} aria-label={title}>{text}</pre>
        <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {ms !== undefined && <span className="badge">{(ms / 1000).toFixed(1)}s</span>}
          <span className="badge">{words(n)}</span>
          <span className={`badge ${structured ? "badge-accent" : ""}`}>{structured ? "Structured" : "Unstructured"}</span>
        </p>
      </> : <p className="mt-2 text-xs text-subtle">No answer from this model.</p>}
    </div>
  );
}

function ModelCard({ m }: { m: TestDriveModelResult }) {
  return (
    <section className="rounded-2xl border border-line p-4" data-testid="td-model" aria-label={`${m.name} results`}>
      <h3 className="text-sm font-semibold text-fg">{m.name} <span className="font-normal text-subtle">· {m.model}</span></h3>
      {m.error && <p className="mt-1 text-xs text-amber-800">{m.error}</p>}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <OutputCol title="Raw idea output" text={m.rawOutput} ms={m.rawMs} n={m.signals.rawWords} structured={m.signals.rawHasStructure} />
        <OutputCol title="PromptPilot prompt output" text={m.improvedOutput} ms={m.improvedMs} n={m.signals.improvedWords} structured={m.signals.hasStructure} accent />
      </div>
    </section>
  );
}

export function TestDriveClient() {
  const [idea, setIdea] = useState("");
  const [target, setTarget] = useState<string>("chatgpt");
  const [ran, setRan] = useState<{ idea: string; target: string } | null>(null);
  const [config, setConfig] = useState<TestDriveConfig | null | undefined>(undefined);
  const [live, setLive] = useState<Live>({ s: "idle" });
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const d = useMemo(() => (ran ? deterministicTestDrive(ran.idea, undefined, ran.target) : null), [ran]);

  useEffect(() => {
    let alive = true;
    authHeader().then((h) => fetch("/api/test-drive", { headers: h, cache: "no-store" })).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((c) => { if (alive) setConfig(c); });
    return () => { alive = false; if (widgetId.current) window.turnstile?.remove(widgetId.current); };
  }, []);

  function start(nextIdea: string, nextTarget = target) {
    const t = nextIdea.trim();
    if (t.length < 3) return;
    setRan({ idea: t.slice(0, 2000), target: nextTarget });
    setLive({ s: "idle" });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function token(): Promise<string | undefined> {
    if (!config?.turnstileSiteKey) return undefined;
    await loadTurnstile();
    return new Promise((resolve, reject) => {
      if (!widgetRef.current || !window.turnstile) return reject(new Error("turnstile"));
      if (widgetId.current) window.turnstile.remove(widgetId.current);
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: config.turnstileSiteKey, size: "flexible",
        callback: (t: string) => resolve(t),
        "error-callback": () => reject(new Error("turnstile")),
        "expired-callback": () => reject(new Error("turnstile")),
      });
    });
  }

  async function runLive() {
    if (!d) return;
    setLive({ s: config?.turnstileSiteKey ? "checking" : "running" });
    let t: string | undefined;
    try { t = await token(); } catch { setLive({ s: "error", code: "TURNSTILE", message: "Human check couldn't load. Please try again." }); return; }
    setLive({ s: "running" });
    try {
      const res = await fetch("/api/test-drive", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeader()) }, body: JSON.stringify({ rawIdea: d.rawIdea, improvedPrompt: d.improvedPrompt, target: d.target, turnstileToken: t }) });
      const j = (await res.json().catch(() => null)) as TestDriveResponse | null;
      if (j?.ok) setLive({ s: "done", r: j });
      else setLive({ s: "error", code: j?.code ?? "PROVIDER", message: j?.message ?? "Something went wrong. Please try again." });
    } catch {
      setLive({ s: "error", code: "PROVIDER", message: "Network error. Please try again." });
    } finally {
      if (widgetId.current) { window.turnstile?.remove(widgetId.current); widgetId.current = null; }
    }
  }

  function downloadCard() {
    if (!d || !canvasRef.current) return;
    const url = drawShareCard(canvasRef.current, d);
    if (!url) { toast("Couldn't draw the card in this browser"); return; }
    const a = document.createElement("a");
    a.href = url; a.download = "promptpilot-test-drive.png"; a.click();
    toast("Share card downloaded");
  }

  const providers = config?.providers ?? [];
  const busy = live.s === "checking" || live.s === "running";
  const liveFailed = live.s === "error" || (live.s === "done" && (live.r.live === "failed" || live.r.live === "off"));

  return (
    <div>
      <form className="card p-5" onSubmit={(e) => { e.preventDefault(); start(idea); }} aria-label="Test drive a prompt">
        <label htmlFor="td-idea" className="text-sm font-semibold text-fg">Your raw idea (the way you&apos;d normally type it)</label>
        <textarea id="td-idea" className="input mt-2 min-h-24" maxLength={2000} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g. write a cold email for my SaaS product" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="td-target" className="text-sm text-muted">Optimise for</label>
          <select id="td-target" className="input !w-auto" value={target} onChange={(e) => { setTarget(e.target.value); if (ran) setRan({ ...ran, target: e.target.value }); }}>
            {TARGET_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="submit" className="btn-primary min-h-11" disabled={idea.trim().length < 3}>Test drive</button>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-subtle">Or try a sample in one click:</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Sample ideas">
            {TEST_DRIVE_SAMPLES.map((s) => (
              <button key={s.id} type="button" className="btn-secondary btn-sm" data-testid={`td-sample-${s.id}`} onClick={() => { setIdea(s.idea); start(s.idea); }}>{s.label}</button>
            ))}
          </div>
        </div>
      </form>

      {d && (
        <div ref={resultRef} className="mt-8 scroll-mt-20" data-testid="td-result">
          <h2 className="h2">Before vs after</h2>
          <p className="mt-1 text-sm text-muted">Scored instantly in your browser by PromptPilot&apos;s prompt analyzer (9 checks: length, context, format, audience, constraints, example and clarity). No AI call needed.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="min-w-0 rounded-2xl bg-surface-2 p-4" aria-label="Raw idea">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">Raw idea</p>
                <ScoreBadge score={d.raw.score} label="raw" />
              </div>
              <p className="mt-3 font-mono text-sm break-words text-fg">{d.rawIdea}</p>
              {d.raw.issues.length > 0 && <>
                <p className="mt-4 text-xs font-semibold text-fg">What&apos;s missing</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted" data-testid="td-issues">
                  {d.raw.issues.slice(0, 5).map((i) => <li key={i.id}><span aria-hidden className={i.severity === "high" ? "text-rose-600" : i.severity === "medium" ? "text-amber-600" : "text-subtle"}>●</span> {i.message}</li>)}
                </ul>
              </>}
            </section>
            <section className="min-w-0 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] p-4" aria-label="PromptPilot prompt">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-wide text-accent-text uppercase">PromptPilot prompt</p>
                <ScoreBadge score={d.improved.score} delta={d.scoreDelta} label="improved" />
              </div>
              <pre className="output mt-3 !max-h-72 text-xs" tabIndex={0} aria-label="PromptPilot prompt text">{d.improvedPrompt}</pre>
              <div className="mt-3"><AddedChips chips={d.addedChips} /></div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={d.improvedPrompt} label="Copy prompt" toastMessage="Prompt copied" />
                <Link href={`/builder?goal=${encodeURIComponent(d.rawIdea)}&platform=${d.target}`} className="btn-secondary min-h-11 inline-flex items-center">Customise in builder</Link>
              </div>
            </section>
          </div>

          <section className="mt-8 card p-5" aria-label="Live test drive on free AI models" data-testid="td-live">
            <h2 className="text-lg font-semibold text-fg">Live test drive on free AI models</h2>
            <p className="mt-1 text-sm text-muted">Send both prompts to the same free models side by side and compare the real answers.</p>
            {config === undefined ? <p className="mt-3 text-sm text-subtle">Checking which free models are available…</p>
              : providers.length === 0 ? (
                <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-testid="td-live-off">
                  <p className="font-semibold">Live model runs aren&apos;t switched on here yet.</p>
                  <p className="mt-1">We won&apos;t show made-up AI answers. Paste both versions into your own free account and compare:</p>
                  <TryInButtons text={d.improvedPrompt} />
                </div>
              ) : <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-primary min-h-11" onClick={runLive} disabled={busy} data-testid="td-run-live">{busy ? (live.s === "checking" ? "Checking…" : "Running on free models…") : "Run Live on Free AI Models"}</button>
                  {providers.map((p) => <span key={p.id} className="badge" title={p.model}>{p.name}</span>)}
                  <span className="text-xs text-subtle">Uses 1 of your {config!.limit} free runs per day</span>
                </div>
                <div ref={widgetRef} className="mt-2 empty:hidden" />
                <p className="mt-2 text-xs text-subtle">Privacy: both prompts are sent to {providers.map((p) => p.name).join(" / ")}. Don&apos;t include personal info. We store only a daily counter, not your prompt.</p>
              </>}
            <div aria-live="polite">
              {live.s === "running" && <p className="mt-3 text-sm text-subtle" role="status">Running both prompts on {providers.length} model{providers.length === 1 ? "" : "s"}… up to 15 seconds.</p>}
              {live.s === "done" && live.r.models.length > 0 && (
                <div className="mt-4 space-y-4" data-testid="td-live-result">
                  {live.r.models.map((m) => <ModelCard key={m.id} m={m} />)}
                  <p className="text-xs text-subtle">Real answers from free models{live.r.remaining !== null ? ` · ${live.r.remaining} runs left today` : ""}. AI output can be wrong; check facts before using it.</p>
                </div>
              )}
              {liveFailed && (
                <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                  <p>{live.s === "error" ? live.message : "The free models couldn't answer right now. Your run wasn't counted."}</p>
                  <TryInButtons text={d.improvedPrompt} />
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 card p-5" aria-label="Share your result" data-testid="td-share">
            <h2 className="text-lg font-semibold text-fg">Share your result</h2>
            <p className="mt-1 text-sm text-muted">Raw {d.raw.score}/100 → PromptPilot {d.improved.score}/100 ({d.scoreDelta >= 0 ? "+" : ""}{d.scoreDelta} pts). The card is drawn in your browser.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={shareSummary(d)} label="Copy Share Summary" variant="secondary" toastMessage="Summary copied" />
              <button type="button" className="btn-secondary min-h-11" onClick={downloadCard} data-testid="td-download">Download Share Card (PNG)</button>
            </div>
            <canvas ref={canvasRef} className="hidden" aria-hidden />
          </section>
        </div>
      )}
    </div>
  );
}
