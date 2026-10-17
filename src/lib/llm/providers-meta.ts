export type ProviderId = "openai" | "anthropic" | "xai" | "openai_compatible";

// Model ids change often; we deliberately do not hard-code defaults. Users enter a current id from their provider's docs.
export const PROVIDERS: Record<ProviderId, { name: string; keyHint: string }> = {
  openai: { name: "OpenAI", keyHint: "sk-…" },
  anthropic: { name: "Anthropic", keyHint: "sk-ant-…" },
  xai: { name: "xAI (Grok)", keyHint: "xai-…" },
  openai_compatible: { name: "OpenAI-compatible (custom base URL)", keyHint: "provider key" },
};
