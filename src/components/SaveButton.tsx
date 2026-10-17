"use client";
import { useState } from "react";
import { useSavedPrompts, type SavedPrompt } from "@/lib/saved";

export function SaveButton({ title, output, source, targetId, builderInput, templateKey }: {
  title: string; output: string; source: SavedPrompt["source"]; targetId?: string | null; builderInput?: unknown; templateKey?: string;
}) {
  const { save, remote } = useSavedPrompts();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="btn-secondary"
        disabled={!output || state === "saving"}
        onClick={async () => {
          setState("saving");
          try { await save({ title: title || "Untitled prompt", output, source, target_id: targetId ?? null, builder_input: builderInput, template_key: templateKey }); setState("saved"); setMsg(remote ? "Saved to your account" : "Saved in this browser"); }
          catch (e) { setState("error"); setMsg((e as Error).message); }
          setTimeout(() => setState("idle"), 2500);
        }}
      >
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save"}
      </button>
      {msg && state !== "idle" && <span className="text-xs text-slate-500">{msg}</span>}
    </span>
  );
}
