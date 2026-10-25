"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { RunConfig, RunResponse } from "@/lib/run/types";
import { CopyButton } from "./CopyButton";
import { TryInButtons } from "./TryInButtons";
import { TRY_PLATFORMS } from "@/lib/try-in";

declare global {
  interface Window { turnstile?: { render(el: HTMLElement, o: Record<string, unknown>): string; reset(id?: string): void; remove(id?: string): void } }
}

let configPromise: Promise<RunConfig | null> | null = null;
async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } catch { return {}; }
}
function loadConfig(): Promise<RunConfig | null> {
  configPromise ??= authHeader().then((h) => fetch("/api/run", { headers: h, cache: "no-store" })).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return configPromise;
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

const FALLBACK = TRY_PLATFORMS.filter((p) => p.id !== "claude");

type State =
  | { s: "idle" }
  | { s: "checking" }
  | { s: "running" }
  | { s: "done"; r: Extract<RunResponse, { ok: true }> }
  | { s: "error"; code: string; message: string };

/** Free "Run this prompt" with a small daily quota. Video never runs here. */
export function RunButton({ text, kind }: { text: string; kind: "text" | "image" | "video" }) {
  const [config, setConfig] = useState<RunConfig | null | undefined>(undefined);
  const [raw, setRaw] = useState<{ for: string; st: State }>({ for: "", st: { s: "idle" } });
  // A new prompt hides an old result.
  const state: State = raw.for === text ? raw.st : { s: "idle" };
  const setState = (st: State) => setRaw({ for: text, st });
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => { let live = true; loadConfig().then((c) => { if (live) setConfig(c); }); return () => { live = false; }; }, []);
  useEffect(() => () => { if (widgetId.current) window.turnstile?.remove(widgetId.current); }, []);

  if (!text.trim()) return null;

  if (kind === "video") {
    return <p className="mt-3 text-xs text-subtle">Video can&apos;t be generated here for free. Use <strong>Try in Gemini</strong> or <strong>Try in Grok</strong> above, which use your own free quota there.</p>;
  }
  if (config === undefined) return null;
  const available = Boolean(config?.available[kind]);
  const label = kind === "image" ? "Run free: make image" : "Run free";

  if (!available) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="run-coming-soon">
        <button type="button" className="btn-secondary min-h-11" disabled aria-describedby="run-soon">{label} · coming soon</button>
        <span id="run-soon" className="text-xs text-subtle">Free in-site runs are coming soon. For now, use Try in ChatGPT/Gemini/Grok above.</span>
      </div>
    );
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

  async function run() {
    setState({ s: config?.turnstileSiteKey ? "checking" : "running" });
    let t: string | undefined;
    try { t = await token(); } catch { setState({ s: "error", code: "TURNSTILE", message: "Human check couldn't load. Please try again." }); return; }
    setState({ s: "running" });
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeader()) }, body: JSON.stringify({ kind, prompt: text.slice(0, 8000), turnstileToken: t }) });
      const j = (await res.json().catch(() => null)) as RunResponse | null;
      if (j?.ok) setState({ s: "done", r: j });
      else setState({ s: "error", code: j?.code ?? "PROVIDER", message: j?.message ?? "Something went wrong. Please try again." });
    } catch {
      setState({ s: "error", code: "PROVIDER", message: "Network error. Please try again." });
    } finally {
      if (widgetId.current) { window.turnstile?.remove(widgetId.current); widgetId.current = null; }
    }
  }

  const busy = state.s === "checking" || state.s === "running";
  const quotaOut = state.s === "error" && (state.code === "QUOTA" || state.code === "SITE_CAP");

  return (
    <section className="mt-4 rounded-lg border border-line p-3" aria-label="Run this prompt for free" data-testid="run-panel">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary min-h-11" onClick={run} disabled={busy}>{busy ? (state.s === "checking" ? "Checking…" : kind === "image" ? "Making image…" : "Running…") : label}</button>
        <span className="text-xs text-subtle">{config!.limits[kind]} free {kind === "image" ? "image" : "run"}{config!.limits[kind] === 1 ? "" : "s"} per day{config!.tier === "anon" ? " · log in for a few more" : ""}</span>
      </div>
      <div ref={widgetRef} className="mt-2 empty:hidden" />
      <p className="mt-2 text-xs text-subtle">Privacy: your prompt is sent to {config!.providers.join(" / ") || "the AI provider"} to generate the answer. Don&apos;t include personal info. We store only a daily counter, not your prompt.</p>
      <div aria-live="polite">
        {state.s === "running" && <p className="mt-3 text-sm text-subtle" role="status">Generating… this can take up to 30 seconds.</p>}
        {state.s === "done" && (
          <div className="mt-3" data-testid="run-result">
            <p className="text-xs font-medium text-subtle">Generated by {state.r.label}{state.r.remaining !== null ? ` · ${state.r.remaining} left today` : ""}</p>
            {state.r.text && <><pre className="output mt-2 !max-h-[26rem]" tabIndex={0} aria-label="AI answer">{state.r.text}</pre><div className="mt-2"><CopyButton text={state.r.text} label="Copy answer" toastMessage="Answer copied" /></div></>}
            {state.r.image && <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.r.image} alt="AI-generated image from your prompt" className="mt-2 w-full max-w-md rounded-lg border border-line" />
              <a href={state.r.image} download="promptpilot-image.jpg" className="btn-secondary mt-2 inline-flex">Download image</a>
            </>}
            <p className="mt-2 text-xs text-subtle">AI output can be wrong. Check facts before using it.</p>
          </div>
        )}
        {state.s === "error" && !quotaOut && <p className="mt-3 text-sm text-amber-800" role="alert">{state.message}</p>}
        {quotaOut && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert" data-testid="run-quota">
            <p className="font-semibold">Aaj ka free quota khatam.</p>
            <p className="mt-1">Kal phir free run milega. Abhi ke liye apne free account mein try karein:</p>
            <TryInButtons text={text} platforms={FALLBACK} />
            <p className="mt-2">Or <Link href="/enhancer" className="underline">use your own API key</Link>.</p>
          </div>
        )}
      </div>
    </section>
  );
}
