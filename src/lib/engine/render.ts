import { getTarget } from "./targets";
import { fieldsFor, getTemplate } from "./templates";
import type { BuildResult, BuilderInput, CheckResult, Mode, Section, Target, TaskTemplate } from "./types";

const XML_TAGS = ["role", "context", "task", "audience", "constraints", "format", "example", "approach", "quality_checks", "instructions", "details"];

/** Normalise user text: trim, unify newlines, collapse 3+ blank lines, strip control chars. */
export function clean(value: unknown, maxLen = 12000): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLen);
}

/** Prevent user content from closing our XML sections early. */
function neutraliseTags(s: string): string {
  const re = new RegExp(`</?(${XML_TAGS.join("|")})>`, "gi");
  return s.replace(re, (m) => m.replace("<", "[").replace(">", "]"));
}

export function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of items) {
    const k = i.toLowerCase().replace(/[.\s]+$/, "");
    if (!seen.has(k)) { seen.add(k); out.push(i); }
  }
  return out;
}

function values(input: BuilderInput): Record<string, string> {
  const fields = fieldsFor(input.templateId);
  const v: Record<string, string> = {};
  for (const f of fields) v[f.key] = clean(input.values?.[f.key], f.maxLen ?? 4000);
  return v;
}

// ---------------------------------------------------------------- text family
function textSections(t: TaskTemplate, target: Target, v: Record<string, string>, mode: Mode, improve: boolean): Section[] {
  const s: Section[] = [];
  const role = v.role || (improve || mode === "detailed" ? t.defaultRole ?? "" : "");
  if (role && mode !== "concise") s.push({ id: "role", title: "Role", lines: [`You are ${withArticle(role)}.`] });

  if (v.context) s.push({ id: "context", title: "Context", lines: [v.context] });

  const task: string[] = [v.goal];
  const extras: [string, string][] = [];
  for (const f of t.fields) if (v[f.key]) extras.push([f.label, v[f.key]]);
  for (const [label, val] of extras) task.push(`${label}: ${val}`);
  s.push({ id: "task", title: "Task", lines: task.filter(Boolean) });

  if (v.audience) s.push({ id: "audience", title: "Audience", lines: [v.audience] });

  let constraints = splitLines(v.constraints);
  if (v.tone) constraints.unshift(`Tone: ${v.tone}`);
  if (mode !== "concise" || constraints.length === 0) constraints.push(...(t.baseConstraints ?? []));
  if (target.family === "search") constraints.push("Cite a source URL for each factual claim and note the publication date");
  if (improve) {
    constraints.push("If important information is missing, ask up to 3 clarifying questions before answering");
    constraints.push("If you are unsure about a fact, say so instead of guessing");
  }
  constraints = uniq(constraints);
  if (constraints.length) s.push({ id: "constraints", title: "Constraints", lines: constraints, list: true });

  const format = v.format || (improve || mode === "detailed" ? t.defaultFormat ?? "" : "");
  if (format) s.push({ id: "format", title: "Output format", lines: [format] });

  if (v.example && mode !== "concise") s.push({ id: "example", title: "Example of the desired output", lines: [v.example] });

  if (mode === "detailed") {
    s.push({
      id: "approach", title: "Approach", list: true,
      lines: t.families.includes("coding_agent") || target.family === "coding_agent"
        ? ["Restate the task and list the files you will touch", "Propose a short plan before editing", "Implement in small steps", "Run or describe the tests that prove it works"]
        : ["Briefly restate the goal in one sentence", "Work through the task step by step", "Produce the final output in the requested format"],
    });
    s.push({
      id: "quality_checks", title: "Before you answer, check", list: true,
      lines: ["Every constraint above is satisfied", "The output matches the requested format and length", "No invented facts, numbers or quotes"],
    });
  }
  return s;
}

function formatMarkdown(sections: Section[], mode: Mode): string {
  if (mode === "concise") {
    return sections
      .map((sec) => {
        const body = sec.list ? sec.lines.join("; ") : sec.lines.join(" ");
        return sec.id === "task" ? body : `${sec.title}: ${body}`;
      })
      .join("\n");
  }
  return sections
    .map((sec) => `## ${sec.title}\n${sec.list ? sec.lines.map((l) => `- ${l}`).join("\n") : sec.lines.join("\n")}`)
    .join("\n\n");
}

function formatXml(sections: Section[], mode: Mode): string {
  const tagFor = (id: string) => (id === "task" ? "task" : id);
  return sections
    .map((sec) => {
      const tag = tagFor(sec.id);
      const lines = sec.lines.map(neutraliseTags);
      const body = sec.list ? lines.map((l) => `- ${l}`).join("\n") : lines.join("\n");
      return mode === "concise" ? `<${tag}>${body.replace(/\n/g, " ")}</${tag}>` : `<${tag}>\n${body}\n</${tag}>`;
    })
    .join(mode === "concise" ? "\n" : "\n\n");
}

// ---------------------------------------------------------------- image / video
function imageText(target: Target, v: Record<string, string>, mode: Mode, improve: boolean): { text: string; sections: Section[] } {
  const lighting = v.lighting || (improve ? "soft natural lighting" : "");
  const composition = v.composition || (improve ? "balanced composition, sharp focus on the subject" : "");
  const avoid = v.avoid || (improve ? "text, watermark, distorted hands, extra limbs" : "");
  const aspect = v.aspect || "1:1";
  const parts = [v.subject, v.style, lighting, composition, v.mood].filter(Boolean);
  if (mode === "detailed") parts.push("highly detailed, coherent anatomy, realistic textures");
  const sections: Section[] = [
    { id: "subject", title: "Subject", lines: [v.subject] },
    ...(v.style ? [{ id: "style", title: "Style", lines: [v.style] }] : []),
    ...(lighting ? [{ id: "lighting", title: "Lighting", lines: [lighting] }] : []),
    ...(composition ? [{ id: "composition", title: "Composition", lines: [composition] }] : []),
    ...(v.mood ? [{ id: "mood", title: "Mood", lines: [v.mood] }] : []),
    { id: "aspect", title: "Aspect ratio", lines: [aspect] },
    ...(avoid ? [{ id: "avoid", title: "Avoid", lines: [avoid] }] : []),
  ];
  if (target.id === "midjourney") {
    const flags = [`--ar ${aspect}`];
    if (avoid) flags.push(`--no ${avoid.replace(/\s*,\s*/g, ", ")}`);
    return { text: `${parts.join(", ")} ${flags.join(" ")}`.trim(), sections };
  }
  const sentences = [`Create an image of ${lowerFirst(v.subject)}.`];
  if (v.style) sentences.push(`Style: ${v.style}.`);
  if (lighting) sentences.push(`Lighting: ${lighting}.`);
  if (composition) sentences.push(`Composition: ${composition}.`);
  if (v.mood) sentences.push(`Mood and colors: ${v.mood}.`);
  if (mode === "detailed") sentences.push("Make it highly detailed with realistic textures and coherent anatomy.");
  sentences.push(`Aspect ratio ${aspect}.`);
  if (avoid) sentences.push(`Avoid: ${avoid}.`);
  return { text: sentences.join(mode === "concise" ? " " : "\n"), sections };
}

function videoText(v: Record<string, string>, mode: Mode, improve: boolean): { text: string; sections: Section[] } {
  const shot = v.shot || (improve ? "medium shot" : "");
  const camera = v.camera || (improve ? "slow dolly in" : "");
  const duration = v.duration || (improve ? "8 seconds" : "");
  const rows: [string, string][] = [
    ["Shot", shot], ["Subject & action", v.subject], ["Camera", camera], ["Setting", v.setting],
    ["Style", v.style + (mode === "detailed" ? (v.style ? ", " : "") + "consistent lighting, natural motion, no flicker" : "")],
    ["Duration", duration], ["Audio", v.audio], ["Aspect ratio", v.aspect || "16:9"],
  ];
  const filled = rows.filter(([, val]) => val);
  const sections = filled.map(([title, val]) => ({ id: title.toLowerCase().replace(/[^a-z]+/g, "_"), title, lines: [val] }));
  if (mode === "concise") return { text: filled.map(([, val]) => val).join(", "), sections };
  return { text: filled.map(([k, val]) => `${k}: ${val}`).join("\n"), sections };
}

function withArticle(role: string): string {
  const r = role.replace(/^(a|an|the)\s+/i, "");
  return `${/^[aeiou]/i.test(r) ? "an" : "a"} ${r}`;
}

function lowerFirst(s: string) { return s ? s[0].toLowerCase() + s.slice(1) : s; }

// ---------------------------------------------------------------- scoring
export function scoreInput(input: BuilderInput): CheckResult[] {
  const t = getTemplate(input.templateId);
  const v = values(input);
  if (t.families.includes("image")) {
    return [
      chk("subject", "Specific subject", v.subject.length >= 15, "Describe who/what, doing what, where.", 30),
      chk("style", "Style", !!v.style, "Name a medium or look (e.g. 35mm photo, watercolor).", 15),
      chk("lighting", "Lighting", !!v.lighting, "Lighting changes the result more than most words.", 15),
      chk("composition", "Composition / camera", !!v.composition, "Add framing such as close-up or wide shot.", 15),
      chk("mood", "Mood / colors", !!v.mood, "Add 2–3 mood or color words.", 10),
      chk("avoid", "Things to avoid", !!v.avoid, "List unwanted elements (text, watermark…).", 15),
    ];
  }
  if (t.families.includes("video")) {
    return [
      chk("subject", "Subject & action", v.subject.length >= 15, "Say what moves and how.", 30),
      chk("shot", "Shot type", !!v.shot, "Pick a shot type.", 15),
      chk("camera", "Camera movement", !!v.camera, "Video models respond to explicit camera moves.", 15),
      chk("setting", "Setting", !!v.setting, "Where and when does it happen?", 15),
      chk("style", "Visual style", !!v.style, "Add a visual style.", 10),
      chk("duration", "Duration", !!v.duration, "State the clip length.", 15),
    ];
  }
  const checks = [
    chk("goal", "Clear goal", v.goal.length >= 20, "Say exactly what you want in at least one full sentence.", 25),
    chk("context", "Context", v.context.length >= 30, "Add background the AI can't guess (who you are, situation, facts).", 25),
    chk("audience", "Audience", !!v.audience, "Who is the output for?", 10),
    chk("format", "Output format", !!v.format, "Name the format and length.", 15),
    chk("constraints", "Constraints", splitLines(v.constraints).length > 0 || !!v.tone, "Add at least one rule or a tone.", 15),
    chk("example", "Example", !!v.example, "One example of good output sharply improves consistency.", 10),
  ];
  for (const f of t.fields) if (f.required && !v[f.key]) checks.push(chk(`req-${f.key}`, f.label, false, `${f.label} is required for this template.`, 10));
  return checks;
}

function chk(id: string, label: string, passed: boolean, tip: string, weight: number): CheckResult {
  return { id, label, passed, tip, weight };
}

export function scoreFromChecks(checks: CheckResult[]): number {
  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.reduce((a, c) => a + (c.passed ? c.weight : 0), 0);
  return total ? Math.round((got / total) * 100) : 0;
}

// ---------------------------------------------------------------- public API
export function buildPrompt(input: BuilderInput): BuildResult {
  const t = getTemplate(input.templateId);
  const target = getTarget(input.targetId);
  const mode: Mode = input.mode ?? "standard";
  const improve = !!input.improve;
  const v = values(input);
  const warnings: string[] = [];

  const familyOk = t.families.includes(target.family) || (t.families.includes("chat") && (target.family === "coding_agent" || target.family === "search"));
  if (!familyOk) warnings.push(`"${t.name}" is designed for ${t.families.join("/")} targets; output may not suit ${target.name}.`);

  let text: string;
  let sections: Section[];
  if (t.families.includes("image")) {
    if (!v.subject) warnings.push("Subject is required.");
    ({ text, sections } = imageText(target.family === "image" ? target : getTarget("image-generic"), v, mode, improve));
  } else if (t.families.includes("video")) {
    if (!v.subject) warnings.push("Subject & action is required.");
    ({ text, sections } = videoText(v, mode, improve));
  } else {
    if (!v.goal) warnings.push("Describe what you want first.");
    for (const f of t.fields) if (f.required && !v[f.key]) warnings.push(`${f.label} is required.`);
    sections = textSections(t, target, v, mode, improve);
    text = target.style === "xml" ? formatXml(sections, mode) : formatMarkdown(sections, mode);
  }

  // Nothing meaningful to render until the primary field is filled.
  const primary = t.families.includes("image") || t.families.includes("video") ? v.subject : v.goal;
  if (!primary) text = "";

  const checks = scoreInput(input);
  return { text, sections, checks, score: scoreFromChecks(checks), templateKey: `${t.id}@${t.version}`, target, warnings };
}
