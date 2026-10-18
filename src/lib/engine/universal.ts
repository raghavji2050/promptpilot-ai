/**
 * Universal deterministic prompt generator.
 * Goal (required) -> detected category/subcategory -> structured prompt formatted for the chosen platform.
 * No network, no randomness: same input, same output.
 */
import { CATEGORIES, GUARDRAILS, getCategory, findSubcategory, type Category, type Subcategory } from "@/lib/categories";
import { buildVisual } from "./visual";
import { expertFor, GENERIC_BLOCK, type ExpertBlock, type Slot } from "./expert";
import { getTarget, TARGETS } from "./targets";
import type { CheckResult, FieldDef, Mode, Section, Target } from "./types";

export const TONES = ["", "friendly", "professional", "casual", "persuasive", "encouraging", "formal", "playful", "direct", "empathetic", "academic"] as const;
export const LANGUAGES = ["", "English", "Hindi", "Hinglish (Hindi in Latin script)", "Spanish", "French", "German", "Portuguese", "Arabic", "Bengali", "Marathi", "Tamil", "Telugu", "Gujarati", "Punjabi", "Japanese", "Indonesian"] as const;
export const OUTPUT_FORMATS = ["Bullet points", "Step-by-step guide", "Table", "Short paragraph", "Detailed report", "Checklist", "Email", "Script", "JSON", "Code"] as const;

/** Fields every text prompt can use. Only `goal` is required. */
export const UNIVERSAL_FIELDS: FieldDef[] = [
  { key: "goal", label: "What do you want AI to help you with?", type: "textarea", required: true, maxLen: 1500 },
  { key: "context", label: "Background / context", type: "textarea", maxLen: 4000 },
  { key: "audience", label: "Audience", type: "text", maxLen: 300 },
  { key: "tone", label: "Tone", type: "select", options: [...TONES] },
  { key: "language", label: "Response language", type: "select", options: [...LANGUAGES] },
  { key: "format", label: "Output format", type: "text", maxLen: 300 },
  { key: "constraints", label: "Constraints (one per line)", type: "textarea", maxLen: 2000 },
  { key: "example", label: "Example or reference (optional)", type: "textarea", maxLen: 3000 },
];

export interface UniversalInput {
  goal: string;
  targetId: string;
  categoryId?: string;
  subcategoryId?: string;
  context?: string;
  audience?: string;
  tone?: string;
  language?: string;
  format?: string;
  constraints?: string;
  example?: string;
  /** Subcategory-specific and image/video fields, keyed by FieldDef.key. */
  extra?: Record<string, string>;
  mode?: Mode;
  improve?: boolean;
  /** "Add missing context": insert placeholders and ask clarifying questions. */
  fillGaps?: boolean;
  /** Ask the AI to ask clarifying questions about missing key details before answering. */
  askFirst?: boolean;
}

export interface Detection {
  categoryId: Category["id"];
  subcategoryId: string | null;
  score: number;
  matched: string[];
}

export interface MissingItem { key: string; label: string; question: string }

export interface UniversalResult {
  text: string;
  sections: Section[];
  target: Target;
  category: Category | null;
  sub: Subcategory | null;
  /** How the category was chosen. */
  source: "user" | "detected" | "none";
  detection: Detection | null;
  kind: "text" | "image" | "video";
  warnings: string[];
  missing: MissingItem[];
  checks: CheckResult[];
  score: number;
}

// ------------------------------------------------------------------ text utils
export function cleanText(value: unknown, maxLen = 6000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxLen);
}

function lines(s: string): string[] {
  return s.split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((i) => { const k = i.toLowerCase().replace(/[.\s]+$/, ""); if (seen.has(k)) return false; seen.add(k); return true; });
}

function sentence(s: string): string {
  const t = s.trim();
  if (!t) return t;
  const cap = t[0].toUpperCase() + t.slice(1);
  return /[.!?]$/.test(cap) ? cap : `${cap}.`;
}

function withArticle(role: string): string {
  const r = role.replace(/^(a|an|the)\s+/i, "");
  return `${/^[aeiou]/i.test(r) ? "an" : "a"} ${r}`;
}

// ------------------------------------------------------------------ intent detection
const SUFFIX = "(?:s|es|ing|ed|er|ers|d)?";
const reCache = new Map<string, RegExp>();
function kwRegex(kw: string): RegExp {
  let re = reCache.get(kw);
  if (!re) {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s-]+");
    re = new RegExp(`(?:^|[^a-z0-9])${esc}${SUFFIX}(?=$|[^a-z0-9])`, "i");
    reCache.set(kw, re);
  }
  return re;
}

/** Weight: weak (~prefixed) 1, single word 2, words with symbols (agents.md, c++) 3, phrases 1 + word count. */
export function keywordWeight(raw: string): number {
  if (raw.startsWith("~")) return 1;
  const words = raw.trim().split(/\s+/).length;
  if (words > 1) return 1 + words;
  return /[^a-z0-9]/i.test(raw) ? 3 : 2;
}

function normalise(goal: string): string {
  return goal.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

/**
 * Keyword intent matcher. Scores every subcategory (its keywords + a small bonus for its category's
 * generic keywords) and returns the best. Ties resolve to registry order. Returns null if nothing matches.
 */
export function detectIntent(goal: string): Detection | null {
  const text = normalise(cleanText(goal, 1500));
  if (!text) return null;
  let best: Detection | null = null;
  for (const cat of CATEGORIES) {
    const catMatched = cat.keywords.filter((k) => kwRegex(k.replace(/^~/, "")).test(text));
    const catBonus = catMatched.length;
    for (const sub of cat.subcategories) {
      let score = 0;
      const matched: string[] = [];
      for (const k of sub.keywords) {
        if (kwRegex(k.replace(/^~/, "")).test(text)) { score += keywordWeight(k); matched.push(k.replace(/^~/, "")); }
      }
      if (score === 0) continue;
      score += catBonus;
      if (!best || score > best.score) best = { categoryId: cat.id, subcategoryId: sub.id, score, matched: [...matched, ...catMatched] };
    }
    if (catBonus > 0 && (!best || catBonus > best.score)) best = { categoryId: cat.id, subcategoryId: null, score: catBonus, matched: catMatched };
  }
  return best;
}

// ------------------------------------------------------------------ resolution
export function resolveIntent(input: Pick<UniversalInput, "goal" | "categoryId" | "subcategoryId">): { category: Category | null; sub: Subcategory | null; source: UniversalResult["source"]; detection: Detection | null } {
  const detection = detectIntent(input.goal);
  if (input.subcategoryId) {
    const f = findSubcategory(input.subcategoryId);
    if (f) return { category: f.category, sub: f.sub, source: "user", detection };
  }
  if (input.categoryId) {
    const cat = getCategory(input.categoryId);
    if (cat) {
      // User picked a category: use the detected subcategory only if it belongs to that category.
      const sub = detection?.categoryId === cat.id && detection.subcategoryId ? cat.subcategories.find((s) => s.id === detection.subcategoryId) ?? null : null;
      return { category: cat, sub, source: "user", detection };
    }
  }
  if (detection) {
    const cat = getCategory(detection.categoryId)!;
    const sub = detection.subcategoryId ? cat.subcategories.find((s) => s.id === detection.subcategoryId) ?? null : null;
    return { category: cat, sub, source: "detected", detection };
  }
  return { category: null, sub: null, source: "none", detection: null };
}

// ------------------------------------------------------------------ building
function platformRules(target: Target, cat: Category | null): string[] {
  switch (target.family) {
    case "search": return ["Search for current, reliable sources and cite a source link with its publication date for each factual claim", "Say clearly when sources disagree or information is unavailable"];
    case "coding_agent": return cat?.id === "coding"
      ? ["Explore the relevant files before editing and keep changes minimal", "Do not modify unrelated files", "Run the tests/linters (or explain how to) before saying the task is done"]
      : [];
    default: return [];
  }
}

function fieldsForSub(sub: Subcategory | null): FieldDef[] {
  return sub?.fields ?? [];
}

const TOP_LEVEL = new Set(["audience", "context", "tone", "format", "constraints"]);
function slotValue(input: UniversalInput, key: string | undefined): string {
  if (!key) return "";
  if (TOP_LEVEL.has(key)) return cleanText((input as unknown as Record<string, string | undefined>)[key], 4000);
  return cleanText(input.extra?.[key], 6000);
}

export interface SlotState { slot: Slot; value: string; detected: boolean }

/** Which of the task's key details the user gave (in fields or in the goal itself) and which are missing. */
export function slotStates(input: UniversalInput, block: ExpertBlock): SlotState[] {
  const goal = cleanText(input.goal, 1500);
  return block.slots.map((slot) => {
    const value = slotValue(input, slot.key);
    return { slot, value, detected: !value && !!slot.detect?.test(goal) };
  });
}

export function missingContext(input: UniversalInput, sub: Subcategory | null, cat: Category | null = sub ? findSubcategory(sub.id)?.category ?? null : null): MissingItem[] {
  const block = expertFor(cat, sub) ?? GENERIC_BLOCK;
  const out: MissingItem[] = slotStates(input, block).filter((x) => !x.value && !x.detected).map((x) => ({ key: x.slot.key ?? x.slot.label, label: x.slot.label, question: x.slot.question }));
  if (!cleanText(input.format) && !out.some((m) => m.key === "format")) out.push({ key: "format", label: "Output format", question: "What format and length do you want?" });
  return out;
}

const shortRole = (role: string) => role.split(/,? who |\. |, known for /)[0];

function textSections(input: UniversalInput, target: Target, cat: Category | null, sub: Subcategory | null): Section[] {
  const mode: Mode = input.mode ?? "standard";
  const concise = mode === "concise";
  const improve = !!input.improve;
  const fill = !!input.fillGaps;
  const askFirst = !!input.askFirst;
  const block = expertFor(cat, sub) ?? GENERIC_BLOCK;
  const goal = cleanText(input.goal, 1500);
  const s: Section[] = [];

  // Role: precise and domain-specific (short form when concise).
  s.push({ id: "role", title: "Role", lines: [`You are ${withArticle(concise ? shortRole(block.role) : block.role)}.`] });

  // Context: the user's actual details.
  const states = slotStates(input, block);
  const ctx: string[] = [];
  const used = new Set<string>();
  for (const st of states) {
    if (st.slot.key) used.add(st.slot.key);
    if (st.value) ctx.push(st.value.includes("\n") ? `${st.slot.label}:\n${st.value}` : `${st.slot.label}: ${st.value}`);
    else if (fill && !st.detected) ctx.push(`${st.slot.label}: [${st.slot.label.toLowerCase()}]`);
  }
  for (const f of fieldsForSub(sub)) {
    if (used.has(f.key)) continue;
    const v = cleanText(input.extra?.[f.key], f.maxLen ?? 4000);
    if (v) ctx.push(v.includes("\n") ? `${f.label}:\n${v}` : `${f.label}: ${v}`);
  }
  for (const k of ["context", "audience"] as const) {
    if (used.has(k)) continue;
    const v = cleanText(input[k], 4000);
    if (v) ctx.push(k === "audience" ? `Audience: ${v}` : v);
  }
  if (ctx.length) s.push({ id: "context", title: "Context", lines: ctx });

  // Task + success criterion.
  s.push({ id: "task", title: "Task", lines: [sentence(goal), `Success looks like: ${block.success}`] });

  // Missing details: ask first, or proceed on stated assumptions.
  const missing = states.filter((x) => !x.value && !x.detected);
  if (missing.length) {
    if (askFirst || fill) {
      s.push({ id: "questions", title: "Before you start", lines: [
        `Ask me these ${missing.length === 1 ? "question" : `${missing.length} questions`} in one message, then wait for my answers before doing the task:`,
        ...missing.map((m, i) => `${i + 1}. ${m.slot.question}`),
      ] });
    } else if (concise) {
      s.push({ id: "assumptions", title: "Assume", lines: [`${missing.map((m) => `${m.slot.label.toLowerCase()}: ${m.slot.assume}`).join("; ")}. State these assumptions first.`] });
    } else {
      s.push({ id: "assumptions", title: "If details are missing", lines: [
        "I haven't told you these yet, so assume:",
        ...missing.map((m) => `- ${m.slot.label}: ${m.slot.assume}`),
        "State these assumptions in one line at the top of your answer. If one would change the answer a lot, ask me about it first.",
      ] });
    }
  }

  // Steps tailored to the task type.
  let steps = [...block.steps];
  if (concise) steps = steps.slice(0, 3);
  if (improve) steps.push("Replace anything generic with something concrete: an example, a number from my details, a template or a script");
  if (mode === "detailed") steps.push("For each recommendation, add one line on why it fits my situation", "Finish with the single most important next step and how long it will take");
  s.push({ id: "instructions", title: "Steps", lines: steps, list: true });

  // Concrete constraints.
  const user: string[] = [];
  const tone = cleanText(input.tone, 60);
  if (tone) user.push(`Tone: ${tone}`);
  const lang = cleanText(input.language, 60);
  if (lang && lang !== "English") user.push(`Respond in ${lang}`);
  user.push(...lines(cleanText(input.constraints, 2000)));
  const guard = sub?.sensitive ? GUARDRAILS[sub.sensitive] : [];
  let constraints = concise
    ? [...user, ...block.constraints.slice(0, 1), ...guard, ...platformRules(target, cat)]
    : [...user, ...block.constraints, ...guard, ...platformRules(target, cat),
      "No filler: skip intros, restating my request and closing summaries",
      "Don't invent facts, statistics, quotes, sources or details about me; flag anything I should verify"];
  constraints = uniq(constraints);
  if (constraints.length) s.push({ id: "constraints", title: "Constraints", lines: constraints, list: true });

  // Structured output spec.
  const format = cleanText(input.format, 300);
  s.push(format
    ? { id: "format", title: "Output format", lines: [format] }
    : { id: "format", title: "Output format", lines: concise ? [block.output.map((o) => o.replace(/\*\*/g, "")).join(" · ")] : block.output, list: !concise });

  const example = cleanText(input.example, 3000);
  if (example && !concise) s.push({ id: "example", title: "Example / reference", lines: [example] });

  // Task-specific self-check.
  if (!concise) s.push({ id: "quality_checks", title: "Before you answer, check", list: true, lines: uniq([...block.checks, ...(user.length ? ["Every constraint I gave is followed"] : [])]) });
  return s;
}

const XML_IDS = new Set(["role", "context", "task", "objective", "assumptions", "questions", "instructions", "constraints", "format", "example", "quality_checks"]);
function neutralise(s: string): string {
  return s.replace(/<\/?([a-z_]+)>/gi, (m, tag: string) => (XML_IDS.has(tag.toLowerCase()) ? m.replace("<", "[").replace(">", "]") : m));
}

export function formatUniversal(sections: Section[], target: Target, mode: Mode): string {
  const body = (sec: Section) => (sec.list ? (sec.id === "instructions" ? sec.lines.map((l, i) => `${i + 1}. ${l}`) : sec.lines.map((l) => `- ${l}`)).join("\n") : sec.lines.join("\n"));
  if (target.style === "xml") {
    return sections.map((sec) => {
      const tag = sec.id;
      if (mode === "concise") return `<${tag}>${neutralise(sec.lines.join(sec.list ? "; " : " "))}</${tag}>`;
      return `<${tag}>\n${neutralise(body(sec))}\n</${tag}>`;
    }).join(mode === "concise" ? "\n" : "\n\n");
  }
  if (mode === "concise") {
    return sections.map((sec) => {
      const b = sec.list ? sec.lines.join("; ") : sec.lines.join(" ");
      return sec.id === "task" ? b : `${sec.title}: ${b}`;
    }).join("\n");
  }
  return sections.map((sec) => `## ${sec.title}\n${body(sec)}`).join("\n\n");
}

function visualValues(input: UniversalInput): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.extra ?? {})) { const c = cleanText(v, 600); if (c) out[k] = c; }
  return out;
}

// ------------------------------------------------------------------ scoring
function checksFor(input: UniversalInput, sub: Subcategory | null, kind: UniversalResult["kind"]): CheckResult[] {
  const c = (id: string, label: string, passed: boolean, tip: string, weight: number): CheckResult => ({ id, label, passed, tip, weight });
  const e = input.extra ?? {};
  if (kind !== "text") {
    const subj = cleanText(e.subject) || cleanText(input.goal);
    return [
      c("subject", "Specific subject", subj.length >= 15, "Describe who/what, doing what, where.", 30),
      c("style", "Style", !!cleanText(e.style), "Name a look (e.g. 35mm photo, watercolor, cinematic).", 20),
      c("lighting", kind === "video" ? "Camera movement" : "Lighting", !!cleanText(kind === "video" ? e.camera : e.lighting), kind === "video" ? "Video tools respond to explicit camera moves." : "Lighting changes the result a lot.", 20),
      c("composition", kind === "video" ? "Shot type" : "Composition", !!cleanText(kind === "video" ? e.shot : e.composition), "Add framing such as close-up or wide shot.", 15),
      c("aspect", "Aspect ratio", !!cleanText(e.aspect), "Pick an aspect ratio for where it will be used.", 15),
    ];
  }
  const subFields = fieldsForSub(sub);
  const filled = subFields.filter((f) => cleanText(e[f.key])).length;
  const checks = [
    c("goal", "Clear goal", cleanText(input.goal).length >= 20, "Describe what you want in one full sentence.", 25),
    c("context", "Context", cleanText(input.context).length >= 20, "Add background the AI can't guess.", 20),
    c("audience", "Audience", !!cleanText(input.audience), "Who is the result for?", 10),
    c("format", "Output format", !!cleanText(input.format), "Name the format and length (a sensible default is used otherwise).", 10),
    c("constraints", "Tone or constraints", !!cleanText(input.tone) || lines(cleanText(input.constraints)).length > 0, "Add a tone or at least one rule.", 10),
    c("example", "Example / reference", !!cleanText(input.example), "An example of good output improves consistency.", 10),
  ];
  if (subFields.length) checks.push(c("details", "Task details", filled > 0, `Fill in the ${sub!.name} details (e.g. ${subFields[0].label}).`, 15));
  return checks;
}

function scoreOf(checks: CheckResult[]): number {
  const total = checks.reduce((a, x) => a + x.weight, 0);
  const got = checks.reduce((a, x) => a + (x.passed ? x.weight : 0), 0);
  return total ? Math.round((got / total) * 100) : 0;
}

// ------------------------------------------------------------------ public API
export function buildUniversal(input: UniversalInput): UniversalResult {
  const target = TARGETS.some((t) => t.id === input.targetId) ? getTarget(input.targetId) : getTarget("chatgpt");
  const { category, sub, source, detection } = resolveIntent(input);
  const mode: Mode = input.mode ?? "standard";
  const warnings: string[] = [];
  const goal = cleanText(input.goal, 1500);

  let kind: UniversalResult["kind"] = "text";
  if (target.family === "image" || target.family === "video") kind = target.family;
  else if (sub?.visual === "video") kind = "video";
  else if (sub?.visual === "image") kind = "image";

  const missing = kind === "text" ? missingContext(input, sub) : [];
  let text = "";
  let sections: Section[] = [];

  if (kind !== "text") {
    const visualTarget = target.family === kind ? target : getTarget(kind === "image" ? "image-generic" : "video");
    const r = buildVisual({ kind, subId: sub?.id, goal, extra: visualValues(input), target: target.family === "image" || target.family === "video" ? visualTarget : target, mode, improve: !!input.improve || !!input.fillGaps });
    text = r.text;
    sections = r.sections;
    if (target.family !== kind) warnings.push(`This looks like a${kind === "image" ? "n image" : " video"} task, so the prompt is a visual description you can paste into ${target.name} or any ${kind} tool. Whether ${target.name} can create ${kind}s depends on your plan and the tool.`);
    if (target.family === "image" && sub && !sub.visual) warnings.push(`${target.name} is an image tool, so your goal was turned into an image description.`);
  } else {
    sections = textSections(input, target, category, sub);
    text = goal ? formatUniversal(sections, target, mode) : "";
    if (target.family === "coding_agent" && category?.id !== "coding") warnings.push(`${target.name} is built for coding. For this task a chat assistant (ChatGPT, Claude, Gemini, Grok) is usually a better fit.`);
  }
  if (!goal && !cleanText(input.extra?.subject)) { text = ""; warnings.unshift("Describe what you want first."); }
  if (goal && source === "none") warnings.push("We couldn't match a category, so a general-purpose structure was used. Pick a category for a more specific prompt.");

  const checks = checksFor(input, sub, kind);
  return { text, sections, target, category, sub, source, detection, kind, warnings, missing, checks, score: scoreOf(checks) };
}

export interface Variation { id: string; label: string; description: string; text: string }

/** Three deterministic alternatives built from the same inputs. */
export function variations(input: UniversalInput): Variation[] {
  const base = buildUniversal(input);
  if (!base.text) return [];
  if (base.kind !== "text") {
    const mk = (id: string, label: string, description: string, over: Partial<UniversalInput>, extra: Record<string, string> = {}) =>
      ({ id, label, description, text: buildUniversal({ ...input, ...over, extra: { ...(input.extra ?? {}), ...extra } }).text });
    return [
      mk("concise", "Short & punchy", "Fewest words; good for quick iterations.", { mode: "concise" }),
      mk("detailed", "Highly detailed", "Adds safe defaults for lighting, composition and things to avoid.", { mode: "detailed", improve: true }),
      mk("cinematic", "Cinematic style", "Same subject with a cinematic look.", {}, { style: input.extra?.style || "cinematic, film still, shallow depth of field" }),
    ];
  }
  const t = base.target;
  const ask = buildUniversal({ ...input, askFirst: true });
  const options = buildUniversal({ ...input, constraints: [input.constraints ?? "", "Give 3 distinct approaches, compare them briefly (pros/cons), then recommend one and explain why"].filter(Boolean).join("\n") });
  const coach = buildUniversal({ ...input, mode: "detailed", improve: true });
  void t;
  return [
    { id: "ask-first", label: "Interview me first", description: "The AI asks a few questions before answering. Best when you're unsure what details matter.", text: ask.text },
    { id: "options", label: "Compare options", description: "Asks for 3 approaches with pros and cons, then a recommendation.", text: options.text },
    { id: "thorough", label: "Thorough & self-checking", description: "Detailed steps, stated assumptions and a final quality check.", text: coach.text },
  ];
}

/** Plain-language reasons this prompt should work better than a one-line request. */
export function explainPrompt(result: UniversalResult): string[] {
  if (!result.text) return [];
  const has = (id: string) => result.sections.some((s) => s.id === id);
  const out: string[] = [];
  if (result.kind !== "text") {
    out.push("It names the subject, style, lighting/camera and aspect ratio separately. Image and video tools respond better to concrete visual details than to abstract wishes.");
    if (result.target.id === "midjourney") out.push("It uses comma-separated descriptors plus parameters such as --ar, the format Midjourney documents.");
    out.push("It lists things to avoid when you add them, which reduces common artefacts.");
    return out;
  }
  const block = expertFor(result.category, result.sub) ?? GENERIC_BLOCK;
  out.push(`Role: the AI acts as ${withArticle(shortRole(block.role))}, which sets the expertise, vocabulary and standards of the answer.`);
  if (has("context")) out.push("Context: your real details are passed in, so the answer is about your situation rather than an average one.");
  out.push("Success criterion: the prompt says what a great answer must achieve, so the AI knows what \"done\" looks like.");
  if (has("questions")) out.push("Clarifying questions: the AI asks for the missing key details first instead of guessing.");
  else if (has("assumptions")) out.push("Assumptions: for details you didn't give, the AI uses sensible defaults and states them up front so you can correct them.");
  out.push(`Steps: a workflow specific to ${result.sub ? result.sub.name.toLowerCase() : "this kind of task"} makes the AI work in the order an expert would, instead of jumping to a generic answer.`);
  if (has("constraints")) out.push("Constraints: concrete limits (length, banned clichés, no invented facts) stop the usual padding and made-up details.");
  if (result.sub?.sensitive) out.push(`Guardrails: because this touches on ${result.sub.sensitive} topics, the prompt asks for reliable sources and recommends consulting a qualified professional.`);
  out.push("Output format: named sections and tables make the result easy to scan and reuse.");
  if (has("quality_checks")) out.push("Self-check: the AI reviews its answer against task-specific checks before replying.");
  if (result.target.style === "xml") out.push(`Formatting: sections are wrapped in XML tags, a structure ${result.target.name}'s publisher recommends for clarity.`);
  else if (result.target.family === "search") out.push(`Formatting: it asks ${result.target.name} for cited, dated sources because it is a search-focused assistant.`);
  else out.push(`Formatting: clear markdown headings work well in ${result.target.name.split(" (")[0]}.`);
  if (result.missing.length) out.push(`Could be even better: add ${result.missing.slice(0, 3).map((m) => m.label.toLowerCase()).join(", ")}.`);
  return out;
}

/** Encode builder state into URL params so a prompt can be shared and reproduced without an account. */
export function toShareParams(input: UniversalInput): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v?: string) => { const c = cleanText(v ?? "", 1500); if (c) p.set(k, c); };
  set("goal", input.goal); set("platform", input.targetId); set("cat", input.categoryId); set("sub", input.subcategoryId);
  set("audience", input.audience); set("tone", input.tone); set("lang", input.language); set("format", input.format);
  set("context", input.context); set("constraints", input.constraints);
  if (input.mode && input.mode !== "standard") p.set("mode", input.mode);
  if (input.askFirst) p.set("ask", "1");
  for (const [k, v] of Object.entries(input.extra ?? {})) if (/^[a-zA-Z]{1,20}$/.test(k)) set(`x_${k}`, v);
  return p;
}

export function fromShareParams(get: (k: string) => string | null | undefined, keys: Iterable<string> = []): Partial<UniversalInput> {
  const v = (k: string) => cleanText(get(k) ?? "", 1500) || undefined;
  const extra: Record<string, string> = {};
  for (const k of keys) if (k.startsWith("x_") && /^x_[a-zA-Z]{1,20}$/.test(k)) { const val = v(k); if (val) extra[k.slice(2)] = val; }
  const platform = v("platform");
  const mode = v("mode");
  return {
    goal: v("goal") ?? "", targetId: platform && TARGETS.some((t) => t.id === platform) ? platform : "chatgpt",
    categoryId: v("cat") && getCategory(v("cat")) ? v("cat") : undefined,
    subcategoryId: v("sub") && findSubcategory(v("sub")) ? v("sub") : undefined,
    audience: v("audience"), tone: v("tone"), language: v("lang"), format: v("format"), context: v("context"), constraints: v("constraints"),
    mode: mode === "concise" || mode === "detailed" ? mode : "standard",
    askFirst: v("ask") === "1" || undefined,
    extra,
  };
}
