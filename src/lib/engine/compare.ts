/**
 * "What we added": a plain-language diff between what the user typed and the prompt we generated.
 * Computed from the prompt's sections, so it always matches the actual output.
 */
import type { UniversalResult } from "./universal";

export interface AddedChip { id: string; label: string; detail: string }

export function whatWeAdded(result: UniversalResult): AddedChip[] {
  if (!result.text) return [];
  const sec = (id: string) => result.sections.find((s) => s.id === id);
  const chips: AddedChip[] = [];
  const add = (id: string, label: string, detail: string) => chips.push({ id, label, detail });

  if (result.kind !== "text") {
    if (sec("style")) add("style", "Style", (sec("style")!.lines[0] ?? ""));
    if (sec("lighting")) add("lighting", "Lighting", (sec("lighting")!.lines[0] ?? ""));
    if (sec("camera")) add("camera", result.kind === "video" ? "Shot & camera" : "Camera & composition", (sec("camera")!.lines[0] ?? ""));
    if (sec("keep")) add("keep", "Keep face unchanged", (sec("keep")!.lines[0] ?? ""));
    if (sec("aspect")) add("aspect", "Aspect ratio", (sec("aspect")!.lines[0] ?? ""));
    if (sec("avoid")) add("negative", "Negative prompt", (sec("avoid")!.lines[0] ?? ""));
    if (result.target.id === "midjourney") add("flags", "Midjourney flags", "--ar and --no parameters");
    return chips;
  }
  const role = sec("role");
  if (role) add("role", "Expert role", (role.lines[0] ?? "").replace(/^You are (an? )?/, "").split(/,? who |\. /)[0] ?? "");
  const ctx = sec("context");
  if (ctx) add("context", "Your details", `${ctx.lines.length} detail${ctx.lines.length === 1 ? "" : "s"} passed in`);
  if (sec("task")?.lines.some((l) => l.startsWith("Success looks like"))) add("success", "Success criterion", "what a great answer must achieve");
  if (sec("questions")) add("questions", "Clarifying questions", `${sec("questions")!.lines.length - 1} questions asked first`);
  else if (sec("assumptions")) add("assumptions", "Stated assumptions", "sensible defaults you can correct");
  const steps = sec("instructions");
  if (steps) add("steps", "Step-by-step workflow", `${steps.lines.length} steps for this task type`);
  const cons = sec("constraints");
  if (cons) add("constraints", "Constraints", `${cons.lines.length} rules (length, clichés, no invented facts)`);
  const fmt = sec("format");
  if (fmt) add("format", fmt.lines.some((l) => /table/i.test(l)) ? "Output format with tables" : "Output format", `${fmt.lines.length} section${fmt.lines.length === 1 ? "" : "s"} defined`);
  if (sec("quality_checks")) add("checks", "Self-check", "the AI reviews its answer before replying");
  if (result.sub?.sensitive) add("guardrails", "Responsible guardrails", `${result.sub.sensitive} topic safeguards`);
  if (result.target.style === "xml") add("platform", "XML tags for Claude", "structure Anthropic recommends");
  else if (result.target.family === "search") add("platform", "Cited sources", "dated source links for claims");
  return chips;
}

/** Heuristic version for hand-written library prompts (plain text). */
export function analyzePromptText(body: string): AddedChip[] {
  const chips: AddedChip[] = [];
  const add = (id: string, label: string, detail: string, ok: boolean) => { if (ok) chips.push({ id, label, detail }); };
  const visual = /--ar\b|aspect ratio|\blens\b|lighting/i.test(body) && !/^\s*#+ /m.test(body);
  if (visual) {
    add("style", "Style", "medium and look named", /photograph|illustration|render|style|cinematic|vector/i.test(body));
    add("lighting", "Lighting", "light source and quality", /light/i.test(body));
    add("camera", "Camera & composition", "angle, lens or framing", /\blens\b|angle|close-?up|composition|framing|shot/i.test(body));
    add("aspect", "Aspect ratio", "sized for where it's used", /--ar\b|aspect ratio/i.test(body));
    add("negative", "Negative prompt", "things to avoid", /--no\b|\bavoid\b|\bno text\b/i.test(body));
    add("placeholders", "Fill-in slots", "[brackets] for your details", /\[[^\]]+\]/.test(body));
    return chips;
  }
  add("role", "Expert role", "sets expertise and standards", /\byou are\b/i.test(body));
  add("placeholders", "Your details", "[brackets] for the facts only you know", /\[[^\]]+\]/.test(body));
  add("success", "Success criterion", "defines a great answer", /success looks like/i.test(body));
  add("steps", "Step-by-step workflow", "numbered steps", /^\s*\d+[.)]\s/m.test(body));
  add("constraints", "Constraints", "rules and limits", /\brules?\b|constraints|under \d+ words|\bmax(imum)?\b|never invent|\bno\b [a-z"]/i.test(body));
  add("format", /table/i.test(body) ? "Output format with tables" : "Output format", "structure of the answer", /output|format|table|give:/i.test(body));
  add("questions", "Clarifying questions", "asks before guessing", /ask me|wait for my/i.test(body));
  return chips;
}
