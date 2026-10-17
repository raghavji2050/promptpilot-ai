/**
 * Universal deterministic prompt generator.
 * Goal (required) -> detected category/subcategory -> structured prompt formatted for the chosen platform.
 * No network, no randomness: same input, same output.
 */
import { CATEGORIES, GUARDRAILS, getCategory, findSubcategory, type Category, type Subcategory } from "@/lib/categories";
import { buildPrompt } from "./render";
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
const GENERIC = {
  role: "knowledgeable, practical expert",
  objective: "Give a specific, accurate and useful answer that fits my situation.",
  workflow: ["Briefly restate what I want to achieve", "Ask about anything essential that is missing, or state your assumptions", "Work through the task step by step", "Give the final answer in the requested format with clear next steps"],
  output: "Clear, well-structured answer with headings or bullet points where helpful",
};

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

export function missingContext(input: UniversalInput, sub: Subcategory | null): MissingItem[] {
  const out: MissingItem[] = [];
  if (!cleanText(input.context)) out.push({ key: "context", label: "Background / context", question: "What background should the AI know about you or your situation?" });
  if (!cleanText(input.audience)) out.push({ key: "audience", label: "Audience", question: "Who is the result for?" });
  for (const f of fieldsForSub(sub)) if (!cleanText(input.extra?.[f.key])) out.push({ key: f.key, label: f.label, question: `${f.label}?` });
  if (!cleanText(input.format)) out.push({ key: "format", label: "Output format", question: "What format and length do you want?" });
  return out;
}

function textSections(input: UniversalInput, target: Target, cat: Category | null, sub: Subcategory | null, missing: MissingItem[]): Section[] {
  const mode: Mode = input.mode ?? "standard";
  const improve = !!input.improve;
  const fill = !!input.fillGaps;
  const p = sub ?? GENERIC;
  const goal = cleanText(input.goal, 1500);
  const s: Section[] = [];

  if (mode !== "concise") s.push({ id: "role", title: "Role", lines: [`You are ${withArticle(p.role)}.`] });

  const ctx: string[] = [];
  const context = cleanText(input.context, 4000);
  if (context) ctx.push(context);
  else if (fill) ctx.push("[Describe your situation: who you are, what you've tried, relevant facts]");
  const audience = cleanText(input.audience, 300);
  if (audience) ctx.push(`Audience: ${audience}`);
  else if (fill) ctx.push("Audience: [who the result is for]");
  for (const f of fieldsForSub(sub)) {
    const v = cleanText(input.extra?.[f.key], f.maxLen ?? 4000);
    if (v) ctx.push(f.type === "textarea" && v.includes("\n") ? `${f.label}:\n${v}` : `${f.label}: ${v}`);
    else if (fill) ctx.push(`${f.label}: [${f.label.toLowerCase()}]`);
  }
  if (ctx.length) s.push({ id: "context", title: "Context", lines: ctx });

  s.push({ id: "objective", title: "Objective", lines: mode === "concise" ? [sentence(goal)] : [sentence(goal), p.objective] });

  let steps = p.workflow.length ? [...p.workflow] : GENERIC.workflow;
  if (mode === "concise") steps = steps.slice(0, 3);
  if (fill) steps = ["Before starting, ask me up to 3 short questions about anything in [brackets] or anything essential that is missing; wait for my answers", ...steps];
  if (mode === "detailed") steps = [...steps, "Finish with a short summary and the single most important next step"];
  s.push({ id: "instructions", title: "Instructions", lines: steps, list: true, });

  let constraints: string[] = [];
  const tone = cleanText(input.tone, 60);
  if (tone) constraints.push(`Tone: ${tone}`);
  const lang = cleanText(input.language, 60);
  if (lang && lang !== "English") constraints.push(`Respond in ${lang}`);
  constraints.push(...lines(cleanText(input.constraints, 2000)));
  constraints.push(...(sub?.rules ?? []));
  if (sub?.sensitive) constraints.push(...GUARDRAILS[sub.sensitive]);
  constraints.push(...platformRules(target, cat));
  if (mode !== "concise") constraints.push("Be specific to my situation; avoid generic filler", "Do not invent facts, numbers, quotes or sources; say when you are unsure");
  if (improve) constraints.push("If essential information is missing, ask up to 3 clarifying questions before answering", "State any assumptions you make");
  constraints = uniq(constraints);
  if (constraints.length) s.push({ id: "constraints", title: "Constraints", lines: constraints, list: true });

  const format = cleanText(input.format, 300) || p.output || GENERIC.output;
  s.push({ id: "format", title: "Output format", lines: [format] });

  const example = cleanText(input.example, 3000);
  if (example && mode !== "concise") s.push({ id: "example", title: "Example / reference", lines: [example] });

  if (mode === "detailed" || improve) {
    s.push({ id: "quality_checks", title: "Before you answer, check", list: true, lines: ["Every instruction and constraint above is followed", "The answer matches the requested format and length", "Advice is concrete and actionable for my situation"] });
  }
  void missing;
  return s;
}

const XML_IDS = new Set(["role", "context", "objective", "instructions", "constraints", "format", "example", "quality_checks"]);
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
      return sec.id === "objective" ? b : `${sec.title}: ${b}`;
    }).join("\n");
  }
  return sections.map((sec) => `## ${sec.title}\n${body(sec)}`).join("\n\n");
}

function visualValues(input: UniversalInput): Record<string, string> {
  const e = input.extra ?? {};
  return { ...e, subject: cleanText(e.subject) || cleanText(input.goal, 600) };
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
    const visualTarget = target.family === kind ? target.id : kind === "image" ? "image-generic" : "video";
    const r = buildPrompt({ templateId: kind, targetId: visualTarget, mode, improve: !!input.improve || !!input.fillGaps, values: visualValues(input) });
    text = r.text;
    sections = r.sections;
    if (target.family !== kind) warnings.push(`This looks like a${kind === "image" ? "n image" : " video"} task, so the prompt is a natural-language ${kind} description you can paste into ${target.name} or any ${kind} tool. Whether ${target.name} can create ${kind}s depends on your plan and the tool.`);
    if (target.family === "image" && sub && !sub.visual) warnings.push(`${target.name} is an image tool, so your goal was turned into an image description.`);
  } else {
    sections = textSections(input, target, category, sub, missing);
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
  const ask = buildUniversal({ ...input, fillGaps: true, mode: "concise" });
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
  if (has("role")) out.push(`Role: asking the AI to act as ${withArticle((result.sub ?? GENERIC).role)} sets the expertise and vocabulary of the answer.`);
  if (has("context")) out.push("Context: background the AI cannot guess is the most common thing missing from prompts; it makes answers specific to you.");
  out.push(`Objective: your goal is restated with what a great answer must achieve${result.sub ? ` for ${result.sub.name.toLowerCase()}` : ""}, so the AI knows what "done" looks like.`);
  out.push("Instructions: numbered steps make the AI work through the task in a sensible order instead of jumping to a generic answer.");
  if (has("constraints")) out.push("Constraints: tone, language and rules keep the answer on track and discourage invented facts.");
  if (result.sub?.sensitive) out.push(`Guardrails: because this touches on ${result.sub.sensitive} topics, the prompt asks for reliable sources and recommends consulting a qualified professional.`);
  out.push("Output format: naming the structure makes the result easier to read and reuse.");
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
    extra,
  };
}
