import type { Target } from "./types";

/**
 * Formatting conventions here are editorial choices based on public vendor guidance
 * (e.g. Anthropic recommends XML tags for structuring prompts; Cursor rules use .mdc
 * frontmatter). They are not guarantees of better output. Re-verify periodically.
 */
export const TARGETS: Target[] = [
  { id: "chatgpt", name: "ChatGPT", family: "chat", style: "markdown", note: "Markdown headings and bullet lists." },
  { id: "claude", name: "Claude", family: "chat", style: "xml", note: "XML-tagged sections such as <context> and <task>." },
  { id: "gemini", name: "Gemini", family: "chat", style: "markdown", note: "Clear headed sections; plain language." },
  { id: "grok", name: "Grok", family: "chat", style: "markdown", note: "Markdown sections; state tone explicitly." },
  { id: "other-chat", name: "Other AI assistant (Copilot, DeepSeek, Meta AI…)", family: "chat", style: "markdown", note: "Plain markdown sections that work in most chat assistants." },
  { id: "perplexity", name: "Perplexity", family: "search", style: "markdown", note: "Asks for cited sources and a date range." },
  { id: "cursor", name: "Cursor / coding agents", family: "coding_agent", style: "markdown", note: "Task, files in scope, constraints, and a verification step." },
  { id: "claude-code", name: "Claude Code", family: "coding_agent", style: "xml", note: "XML-tagged task brief with explicit verification." },
  { id: "midjourney", name: "Midjourney", family: "image", style: "image", note: "Comma-separated descriptors plus parameters such as --ar." },
  { id: "image-generic", name: "Image (FLUX, Gemini, ChatGPT images, Ideogram)", family: "image", style: "image", note: "Natural-language scene description; no Midjourney flags." },
  { id: "video", name: "Video (Veo, Kling, Runway)", family: "video", style: "video", note: "Shot type, subject action, camera move, duration, audio." },
];

export function getTarget(id: string): Target {
  const t = TARGETS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown target: ${id}`);
  return t;
}
