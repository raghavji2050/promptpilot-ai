"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import { MODELS, USE_CASES, buildImageReelPrompt, type Model, type UseCase } from "@/lib/engine/image-reel";

export function ImageReelBuilder({ initial = {} }: { initial?: { useCase?: string; model?: string; subject?: string } }) {
  const [useCase, setUseCase] = useState<UseCase>(initial.useCase && initial.useCase in USE_CASES ? initial.useCase as UseCase : "festival-poster");
  const [model, setModel] = useState<Model>(initial.model && initial.model in MODELS ? initial.model as Model : "midjourney");
  const [subject, setSubject] = useState(initial.subject?.slice(0, 300) || "Diwali sale for my mithai dukaan in Jaipur");
  const [style, setStyle] = useState("");
  const [textOnImage, setText] = useState("");
  const out = useMemo(() => buildImageReelPrompt({ useCase, model, subject, style, textOnImage }), [useCase, model, subject, style, textOnImage]);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <label className="block text-sm font-medium">Use case
          <select aria-label="Use case" className="input mt-1 w-full" value={useCase} onChange={(e) => setUseCase(e.target.value as UseCase)}>
            {Object.entries(USE_CASES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></label>
        <label className="block text-sm font-medium">Model
          <select aria-label="Model" className="input mt-1 w-full" value={model} onChange={(e) => setModel(e.target.value as Model)}>
            {Object.entries(MODELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></label>
        <label className="block text-sm font-medium">What is it about? (English or Hinglish)
          <input aria-label="Subject" className="input mt-1 w-full" value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
        <label className="block text-sm font-medium">Style (optional)
          <input aria-label="Style" className="input mt-1 w-full" placeholder="e.g. watercolor, cinematic, minimal" value={style} onChange={(e) => setStyle(e.target.value)} /></label>
        <label className="block text-sm font-medium">Text on image (optional)
          <input aria-label="Text on image" className="input mt-1 w-full" placeholder="e.g. Happy Diwali – 20% off" value={textOnImage} onChange={(e) => setText(e.target.value)} /></label>
      </div>
      <div>
        <pre aria-label="Image prompt output" data-testid="ir-output" className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 text-sm">{out}</pre>
        <CopyButton text={out} label="Copy prompt" className="mt-3" toastMessage="Prompt copied" />
      </div>
    </div>
  );
}
