"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Accessible modal built on the native <dialog> (focus trap, Esc to close, inert background). Only opens on user action. */
export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-labelledby="dlg-title"
      className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-[var(--shadow-lg)] backdrop:bg-black/40">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id="dlg-title" className="text-lg font-semibold">{title}</h2>
        <button type="button" className="btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">✕</button>
      </div>
      <div className="px-5 py-4 text-sm text-muted">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
    </dialog>
  );
}
