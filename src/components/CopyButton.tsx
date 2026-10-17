"use client";
import { useState } from "react";
import { useToast } from "./ui/Toast";

export function CopyButton({ text, label = "Copy", className = "", variant = "primary", toastMessage = "Copied to clipboard" }: {
  text: string; label?: string; className?: string; variant?: "primary" | "secondary" | "ghost"; toastMessage?: string;
}) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        let ok = true;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { ok = document.execCommand("copy"); } catch { ok = false; }
          ta.remove();
        }
        if (ok) { setDone(true); toast(toastMessage); setTimeout(() => setDone(false), 1500); }
        else toast("Couldn't copy automatically. Select the text and press Ctrl/⌘ + C.", { tone: "error", duration: 6000 });
      }}
      className={`btn-${variant} ${className}`}
    >
      <span aria-hidden>{done ? "✓" : "⧉"}</span>{done ? "Copied" : label}
    </button>
  );
}
