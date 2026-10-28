import { getTarget } from "./targets";
import { clean } from "./render";

export interface Issue { id: string; severity: "high" | "medium" | "low"; message: string; fix: string }
export interface Analysis {
  score: number;
  issues: Issue[];
  strengths: string[];
  stats: { words: number; chars: number; approxTokens: number; sentences: number };
}

const has = (re: RegExp, s: string) => re.test(s);

const RULES: { id: string; severity: Issue["severity"]; weight: number; test: (s: string, words: number) => boolean; message: string; fix: string; strength: string }[] = [
  { id: "length", severity: "high", weight: 15, test: (_s, w) => w >= 12, message: "The prompt is very short, so the model has to guess most details.", fix: "Add what you want, for whom, and in what format.", strength: "Enough detail to work with." },
  { id: "context", severity: "high", weight: 20, test: (s) => has(/\b(context|background|i am|i'm|we are|we're|my (company|team|business|project|app|site)|our (company|team|business|product)|currently|situation)\b/i, s), message: "No background/context detected.", fix: "Explain the situation and facts the model can't know.", strength: "Includes background context." },
  { id: "format", severity: "medium", weight: 15, test: (s) => has(/\b(format|bullet|table|json|markdown|list|paragraph|words?|sentences?|outline|steps|headings?|csv|yaml)\b/i, s), message: "Output format/length is not specified.", fix: "Say e.g. “5 bullets, under 120 words” or “a markdown table”.", strength: "Specifies an output format." },
  { id: "audience", severity: "medium", weight: 10, test: (s) => has(/\b(audience|readers?|customers?|users?|beginners?|students?|clients?|developers?|for (a|an|my|our) )/i, s), message: "Audience is not stated.", fix: "Name who will read or use the output.", strength: "Names an audience." },
  { id: "constraints", severity: "medium", weight: 15, test: (s) => has(/\b(must|don't|do not|avoid|only|never|limit|without|max(imum)?|at most|no more than|keep it)\b/i, s), message: "No constraints or rules.", fix: "Add rules such as “avoid jargon” or “do not invent numbers”.", strength: "Sets constraints." },
  { id: "example", severity: "low", weight: 10, test: (s) => has(/\b(example|e\.g\.|for instance|such as|like this|sample)\b/i, s), message: "No example given.", fix: "Paste one short example of the output you want.", strength: "Provides an example." },
  { id: "fluff", severity: "low", weight: 5, test: (s) => !has(/\b(\d+\+? years of experience|world[- ]class|genius|best in the world|10x|ultimate expert)\b/i, s), message: "Contains role-play hype (e.g. “world-class, 30 years of experience”) that adds little.", fix: "Replace hype with concrete requirements.", strength: "No hype phrases." },
  { id: "vague", severity: "low", weight: 5, test: (s) => (s.match(/\b(something|stuff|things|good|nice|better|etc\.?|some kind of)\b/gi) ?? []).length < 3, message: "Several vague words (something, stuff, good, etc.).", fix: "Replace vague words with specifics.", strength: "Mostly specific wording." },
  { id: "shouting", severity: "low", weight: 5, test: (s) => (s.match(/\b[A-Z]{4,}\b/g) ?? []).length < 4, message: "Lots of ALL-CAPS words.", fix: "Use calm, explicit rules instead of shouting.", strength: "Calm phrasing." },
];

export function analyzePrompt(raw: string): Analysis {
  const s = clean(raw, 20000);
  const words = s ? s.split(/\s+/).length : 0;
  const issues: Issue[] = [];
  const strengths: string[] = [];
  let total = 0, got = 0;
  for (const r of RULES) {
    total += r.weight;
    if (s && r.test(s, words)) { got += r.weight; strengths.push(r.strength); }
    else issues.push({ id: r.id, severity: r.severity, message: r.message, fix: r.fix });
  }
  const order = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  return {
    score: s ? Math.round((got / total) * 100) : 0,
    issues,
    strengths,
    stats: { words, chars: s.length, approxTokens: Math.ceil(s.length / 4), sentences: s ? (s.match(/[.!?]+(\s|$)/g) ?? []).length || 1 : 0 },
  };
}

const FILLERS: RegExp[] = [
  /\b(please|kindly)\b\s*/gi,
  /\b(i want you to|i would like you to|could you|can you|would you)\s+/gi,
  /\bact as (a|an) [^.,\n]*?with \d+\+? years of experience[^.,\n]*[.,]?\s*/gi,
  /\b(world[- ]class|ultimate|genius)\s+/gi,
  /\b(basically|actually|really|very|just)\s+/gi,
];

/** Remove filler and politeness padding; keep meaning. Deterministic. */
export function shortenText(raw: string): string {
  let s = clean(raw, 20000);
  for (const re of FILLERS) s = s.replace(re, "");
  return s.replace(/[ \t]{2,}/g, " ").replace(/ +([.,;:!?])/g, "$1").replace(/(^|[.!?]\s+)([a-z])/g, (_m, p, c) => p + c.toUpperCase()).trim();
}

/** Add process + quality sections that most prompts lack. Deterministic. */
export function expandText(raw: string, targetId = "chatgpt"): string {
  const s = clean(raw, 20000);
  const a = analyzePrompt(s);
  const missing = new Set(a.issues.map((i) => i.id));
  const extra: [string, string[]][] = [];
  if (missing.has("context")) extra.push(["Context", ["[Add background: who you are, the situation, key facts]"]]);
  if (missing.has("audience")) extra.push(["Audience", ["[Who is this for?]"]]);
  if (missing.has("format")) extra.push(["Output format", ["[e.g. 5 bullets under 120 words / markdown table / JSON]"]]);
  extra.push(["Approach", ["Restate the goal in one sentence", "Work step by step", "Return only the final output in the requested format"]]);
  extra.push(["Before answering, check", ["All constraints are met", "No invented facts, numbers or quotes", "Ask up to 3 clarifying questions if key information is missing"]]);
  return formatSections([["Task", [s]], ...extra], targetId);
}

/** Restructure free text into labelled sections for the chosen target, adding placeholders for gaps. */
export function improveText(raw: string, targetId = "chatgpt"): string {
  const s = shortenText(raw);
  const a = analyzePrompt(s);
  const missing = new Set(a.issues.map((i) => i.id));
  const sections: [string, string[]][] = [["Task", [s]]];
  if (missing.has("context")) sections.push(["Context", ["[Add background the model can't guess]"]]);
  if (missing.has("audience")) sections.push(["Audience", ["[Who is the output for?]"]]);
  const cons = ["If key information is missing, ask up to 3 clarifying questions first", "Do not invent facts, numbers or quotes"];
  if (missing.has("constraints")) cons.unshift("[Add your rules, e.g. tone, words to avoid, length]");
  sections.push(["Constraints", cons]);
  if (missing.has("format")) sections.push(["Output format", ["[Specify format and length]"]]);
  if (missing.has("example")) sections.push(["Example", ["[Optional: paste one example of good output]"]]);
  return formatSections(sections, targetId);
}

/** Re-format already-structured or plain text for another target. */
export function adaptText(raw: string, targetId: string): string {
  const s = clean(raw, 20000);
  const parsed = parseSections(s);
  return formatSections(parsed.length ? parsed : [["Task", [s]]], targetId);
}

function parseSections(s: string): [string, string[]][] {
  const out: [string, string[]][] = [];
  const md = /^##\s+(.+)$/gm;
  const xml = /<([a-z_]+)>\n?([\s\S]*?)\n?<\/\1>/gi;
  let m: RegExpExecArray | null;
  if (/<[a-z_]+>[\s\S]*<\/[a-z_]+>/i.test(s)) {
    while ((m = xml.exec(s))) out.push([titleCase((m[1] ?? "").replace(/_/g, " ")), (m[2] ?? "").split("\n").map((l) => l.replace(/^- /, ""))]);
    return out;
  }
  const heads: { title: string; idx: number; end: number }[] = [];
  while ((m = md.exec(s))) heads.push({ title: (m[1] ?? "").trim(), idx: m.index, end: m.index + m[0].length });
  heads.forEach((h, i) => {
    const body = s.slice(h.end, i + 1 < heads.length ? heads[i + 1]!.idx : undefined).trim();
    out.push([h.title, body.split("\n").map((l) => l.replace(/^- /, "")).filter(Boolean)]);
  });
  return out;
}

function titleCase(s: string) { return s.replace(/\b\w/g, (c) => c.toUpperCase()); }

export function formatSections(sections: [string, string[]][], targetId: string): string {
  const t = getTarget(targetId);
  const isList = (lines: string[]) => lines.length > 1;
  if (t.style === "xml") {
    return sections
      .map(([title, lines]) => {
        const tag = title.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
        return `<${tag}>\n${isList(lines) ? lines.map((l) => `- ${l}`).join("\n") : lines.join("\n")}\n</${tag}>`;
      })
      .join("\n\n");
  }
  if (t.style === "image" || t.style === "video") {
    return sections.map(([title, lines]) => (title === "Task" ? lines.join(" ") : `${title}: ${lines.join("; ")}`)).join("\n");
  }
  return sections
    .map(([title, lines]) => `## ${title}\n${isList(lines) ? lines.map((l) => `- ${l}`).join("\n") : lines.join("\n")}`)
    .join("\n\n");
}
