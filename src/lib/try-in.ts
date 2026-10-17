/**
 * "Try in ChatGPT / Claude / Gemini / Grok": copy the prompt, then open the platform's official site.
 *
 * We deliberately do NOT put the prompt in the URL. ChatGPT's `?q=` parameter is community-documented
 * but not in OpenAI's official docs, and a security advisory (Tenable TRA-2025-22) showed it could
 * auto-submit prompts. Claude, Gemini and Grok have no documented prefill parameter. So we always copy
 * and the user pastes.
 */
export interface TryPlatform { id: "chatgpt" | "claude" | "gemini" | "grok"; name: string; url: string }

export const TRY_PLATFORMS: TryPlatform[] = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app" },
  { id: "grok", name: "Grok", url: "https://grok.com/" },
];

export function getTryPlatform(id: string): TryPlatform | undefined {
  return TRY_PLATFORMS.find((p) => p.id === id);
}

export interface TryEnv {
  /** Usually navigator.clipboard.writeText; undefined when the Clipboard API is unavailable. */
  writeText?: (text: string) => Promise<void>;
  /** Usually window.open. */
  open: (url: string, target: string) => Window | null;
}

export type TryLaunch =
  | { status: "empty" }
  | { status: "launched"; platform: TryPlatform; opened: boolean; copied: Promise<boolean> };

/**
 * Must be called synchronously inside the click handler.
 * 1. Starts the clipboard write first (while our page still has focus and user activation).
 * 2. Opens a blank tab synchronously (so popup blockers treat it as user-initiated), cuts the opener
 *    link (same protection as `noopener`), then navigates it to the official URL. We don't pass the
 *    `noopener` feature string itself because then window.open always returns null and a blocked
 *    popup can't be detected.
 */
export function launchTry(text: string, platform: TryPlatform, env: TryEnv): TryLaunch {
  if (!text.trim()) return { status: "empty" };
  let copied: Promise<boolean>;
  try {
    copied = env.writeText ? env.writeText(text).then(() => true, () => false) : Promise.resolve(false);
  } catch {
    copied = Promise.resolve(false);
  }
  let opened = false;
  try {
    const w = env.open("", "_blank");
    if (w) {
      try { w.opener = null; } catch { /* ignore */ }
      w.location.href = platform.url;
      opened = true;
    }
  } catch {
    opened = false;
  }
  return { status: "launched", platform, opened, copied };
}

export function successMessage(p: TryPlatform): string {
  return `Prompt copied! Paste it into ${p.name} to try it.`;
}
