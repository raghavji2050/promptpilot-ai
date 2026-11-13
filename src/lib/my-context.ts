/** "My context": business, audience and voice saved once on this device (localStorage, no account) and added to every generated prompt. */
export type MyContext = { business: string; audience: string; voice: string; enabled: boolean };
export const MY_CONTEXT_KEY = "pp:my-context:v1";
export const EMPTY_CONTEXT: MyContext = { business: "", audience: "", voice: "", enabled: true };
const MAX = 300;

export function sanitizeContext(raw: unknown): MyContext {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX) : "");
  return { business: s(o.business), audience: s(o.audience), voice: s(o.voice), enabled: o.enabled !== false };
}

export const hasContext = (c: MyContext) => !!(c.business || c.audience || c.voice);

/** Fill business-type placeholders and prepend a short context block. Pure, so the same input always gives the same text. */
export function applyContext(text: string, c: MyContext): string {
  if (!c.enabled || !hasContext(c)) return text;
  let out = text;
  if (c.business) out = out.replace(/\[(NICHE|YOUR BUSINESS|BUSINESS|BRAND)\]/g, c.business);
  if (c.audience) out = out.replace(/\[(AUDIENCE|TARGET AUDIENCE)\]/g, c.audience);
  const lines = [
    c.business && `- About me / my business: ${c.business}`,
    c.audience && `- My audience: ${c.audience}`,
    c.voice && `- My voice and tone: ${c.voice}`,
  ].filter(Boolean);
  return `My context (use it for every answer):\n${lines.join("\n")}\n\n${out}`;
}

// ---- tiny localStorage store for useSyncExternalStore ----
const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheVal: MyContext = EMPTY_CONTEXT;
export function readContext(): MyContext {
  let raw: string | null = null;
  try { raw = localStorage.getItem(MY_CONTEXT_KEY); } catch { raw = null; }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try { cacheVal = raw ? sanitizeContext(JSON.parse(raw)) : EMPTY_CONTEXT; } catch { cacheVal = EMPTY_CONTEXT; }
  }
  return cacheVal;
}
export function writeContext(c: MyContext | null) {
  try {
    if (c && hasContext(sanitizeContext(c))) localStorage.setItem(MY_CONTEXT_KEY, JSON.stringify(sanitizeContext(c)));
    else localStorage.removeItem(MY_CONTEXT_KEY);
  } catch { /* storage blocked */ }
  listeners.forEach((l) => l());
}
export function subscribeContext(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === MY_CONTEXT_KEY) l(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}
export const serverContext = () => EMPTY_CONTEXT;
