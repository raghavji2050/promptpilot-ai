"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Tone = "success" | "info" | "error";
type ToastItem = { id: number; message: string; tone: Tone };
type ToastFn = (message: string, opts?: { tone?: Tone; duration?: number }) => void;

const Ctx = createContext<ToastFn | null>(null);

/** Small, polite toasts. One live region; nothing blocks the page and nothing auto-opens. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback<ToastFn>((message, opts = {}) => {
    const id = next.current++;
    setItems((l) => [...l.slice(-2), { id, message, tone: opts.tone ?? "success" }]);
    setTimeout(() => dismiss(id), opts.duration ?? 3500);
  }, [dismiss]);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" role="status" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className="fade-up pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg shadow-[var(--shadow-lg)]">
            <span aria-hidden className={t.tone === "error" ? "text-rose-600" : t.tone === "info" ? "text-accent-text" : "text-emerald-600"}>{t.tone === "error" ? "!" : t.tone === "info" ? "i" : "✓"}</span>
            <span className="flex-1">{t.message}</span>
            <button type="button" className="text-subtle hover:text-fg" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Returns a toast function; a no-op outside the provider (e.g. in isolated tests). */
export function useToast(): ToastFn {
  return useContext(Ctx) ?? (() => {});
}
