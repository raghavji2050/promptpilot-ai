import { ENHANCER_SYSTEM_PROMPT_V1 } from "@/lib/llm";
import { improveText } from "@/lib/engine";
import { textChain, type Fetch } from "@/lib/run/providers";

type Env = Record<string, string | undefined>;
export interface SmartResult { text: string; source: "ai" | "fallback"; provider?: string }

/** Smart mode: free hosted provider chain (Groq first). Any failure falls back to the deterministic improver. */
export async function smartImprove(input: string, targetId = "chatgpt", opts: { env?: Env; fetch?: Fetch } = {}): Promise<SmartResult> {
  const chain = textChain(opts.env ?? process.env);
  const prompt = `${ENHANCER_SYSTEM_PROMPT_V1}\nTarget model: ${targetId}.\n\nPrompt to improve:\n"""\n${input}\n"""`;
  for (const p of chain) {
    try {
      const text = await p.run(prompt, opts.fetch ?? fetch);
      return { text, source: "ai", provider: p.name };
    } catch { /* try next, then fall back */ }
  }
  return { text: improveText(input, targetId), source: "fallback" };
}

export function smartEnabled(env: Env = process.env): boolean { return textChain(env).length > 0; }
