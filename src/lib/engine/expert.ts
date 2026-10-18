/**
 * Expert task blocks: the content that makes a generated prompt specific to the task type.
 * Rich, hand-written blocks exist for the most-used subcategories (see expert-blocks.ts);
 * every other subcategory gets its own role/workflow/output from the category registry plus
 * category-level slots, constraints and self-checks defined here.
 */
import type { Category, CategoryId, Subcategory } from "@/lib/categories";
import { EXPERT_BLOCKS } from "./expert-blocks";

/** A piece of information the AI needs. Filled from the user's input when present; otherwise asked or assumed. */
export interface Slot {
  /** Builder field that fills this slot (sub field key, or audience/context/tone/format). */
  key?: string;
  label: string;
  /** Clarifying question when the AI should ask first. */
  question: string;
  /** Sensible default when the AI should proceed without asking. */
  assume: string;
  /** If the goal text already contains this information, the slot counts as filled. */
  detect?: RegExp;
}

export interface ExpertBlock {
  role: string;
  /** What "done well" means, in one sentence. */
  success: string;
  slots: Slot[];
  steps: string[];
  constraints: string[];
  /** Output spec: one line per section/table. */
  output: string[];
  checks: string[];
}

/** Partial overrides allowed in rich blocks. */
export type ExpertSpec = ExpertBlock;

const AUD: Slot = { key: "audience", label: "Audience", question: "Who is this for?", assume: "a general audience with no special background" };

export const CATEGORY_DEFAULTS: Record<CategoryId, { slots: Slot[]; constraints: string[]; checks: string[] }> = {
  social: {
    slots: [
      { key: "niche", label: "Niche / topic", question: "What is your niche and who do you want to reach?", assume: "infer the niche from my goal and state it" },
      { key: "current", label: "Where you are now", question: "What's your current audience size and posting frequency?", assume: "a small account (under 1,000 followers) posting irregularly" },
      { key: "timePerWeek", label: "Time per week", question: "How much time can you spend on content each week?", assume: "about 4 hours a week, filming on a phone" },
    ],
    constraints: ["Hooks and titles must be specific to my niche; no generic clickbait (\"You won't believe…\", \"Wait for it\")", "No promises of virality or follower numbers"],
    checks: ["Every idea is specific to my niche and doable with my time and tools", "No generic advice like \"be consistent\" without a concrete action"],
  },
  business: {
    slots: [
      { key: "product", label: "Product / service", question: "What exactly do you sell, and at what price?", assume: "infer it from my goal and state it" },
      { key: "region", label: "Location / market", question: "Where do you operate and who are your customers?", assume: "a local market in India, selling to individual customers", detect: /\b(in|at)\s+[A-Z][a-z]+/ },
      { key: "budget", label: "Budget", question: "What budget and time can you commit?", assume: "a small budget (under ₹50,000) and part-time effort", detect: /(₹|\$|rs\.?\s?\d|\d+\s?(k|lakh|lakhs|crore))/i },
    ],
    constraints: ["Use only numbers I give you; label any estimates as estimates with the reasoning", "Prefer cheap, testable actions over big upfront spending"],
    checks: ["Every recommendation names a concrete action, owner or cost", "Estimates are labelled and explained, not presented as facts"],
  },
  writing: {
    slots: [
      { key: "recipient", label: "Reader", question: "Who will read this, and what's your relationship to them?", assume: "a professional reader who is busy and skims" },
      { key: "context", label: "Key facts", question: "What facts, dates or details must be included?", assume: "use [placeholders] for any specific facts I haven't given" },
      { key: "length", label: "Length", question: "How long should it be?", assume: "as short as possible while complete" },
    ],
    constraints: ["Plain, specific language; cut filler phrases (\"I hope this finds you well\", \"in today's fast-paced world\")", "Use [placeholders] for facts I haven't provided instead of inventing them"],
    checks: ["The main point is in the first two sentences", "No invented facts, names or numbers", "Reads naturally aloud; no clichés"],
  },
  education: {
    slots: [
      { key: "level", label: "Current level", question: "What do you already know about this?", assume: "a beginner with no prior knowledge" },
      { key: "time", label: "Time available", question: "How much time can you study, and by when?", assume: "about 1 hour a day", detect: /\b\d+\s*(min|minute|hour|hr)s?\b/i },
      { key: "context", label: "Purpose", question: "Why are you learning this (exam, job, project, curiosity)?", assume: "practical use at work or in projects" },
    ],
    constraints: ["Active practice over passive reading: every session ends with something I do or answer", "Define any technical term the first time it appears"],
    checks: ["The plan fits my time exactly", "Each step has a way to check I've actually learned it"],
  },
  design: {
    slots: [
      { key: "subject", label: "Subject", question: "What exactly should be shown?", assume: "the subject in my goal" },
      { key: "style", label: "Style", question: "What look do you want?", assume: "a clean, modern style that suits the subject" },
      { key: "aspect", label: "Where it will be used", question: "Where will it be used (feed, story, print, website)?", assume: "a square social media post" },
    ],
    constraints: ["Describe concrete visual details (subject, setting, lighting, camera, colours) rather than abstract adjectives", "No imitation of trademarks or living artists' signature styles"],
    checks: ["Subject, style, lighting, composition and aspect ratio are all specified", "Nothing contradicts itself (e.g. 'minimal' plus 'busy background')"],
  },
  coding: {
    slots: [
      { key: "stack", label: "Language / framework and version", question: "Which language, framework and versions are you using?", assume: "infer the stack from my goal; ask if it changes the answer", detect: /\b(python|javascript|typescript|php|laravel|react|next\.?js|node|java|kotlin|swift|go|golang|rust|c#|\.net|django|flask|vue|angular|sql|mysql|postgres)\b/i },
      { key: "code", label: "Relevant code", question: "Can you paste the relevant code?", assume: "I'll paste code when you ask; don't guess at code you haven't seen" },
      { key: "context", label: "Constraints", question: "Any constraints (existing architecture, performance, deadlines)?", assume: "keep changes minimal and consistent with typical conventions for the stack" },
    ],
    constraints: ["Don't invent APIs, functions or library options; say if you're unsure a method exists in my version", "Show complete, runnable code for changed parts, not fragments with \"...\""],
    checks: ["Code compiles/runs for the stated version", "Edge cases and error handling are covered", "Explains how to verify the change"],
  },
  career: {
    slots: [
      { key: "role", label: "Target role", question: "What role and seniority are you targeting?", assume: "infer the role from my goal" },
      { key: "background", label: "Your background", question: "What's your relevant experience (years, key achievements)?", assume: "use [placeholders] where my experience is needed; never invent it" },
      { key: "region", label: "Location / industry", question: "Which country and industry?", assume: "India, private sector" },
    ],
    constraints: ["Never invent experience, employers, metrics or achievements; use [placeholders]", "Use concrete examples and scripts, not generic career advice"],
    checks: ["Nothing about my experience is invented", "Advice is specific to the role and seniority"],
  },
  productivity: {
    slots: [
      { key: "context", label: "Current situation", question: "What does a typical day/week look like for you right now?", assume: "a full-time job with evenings partly free" },
      { key: "hours", label: "Time available", question: "How much time do you have for this?", assume: "limited time; design for the busiest realistic week" },
      AUD,
    ],
    constraints: ["Plans must survive a bad day: include a minimum version", "Use specific times and durations, not \"some time each day\""],
    checks: ["Plan fits the stated time", "There's a fallback for missed days"],
  },
  data: {
    slots: [
      { key: "source", label: "Data / document", question: "Can you paste the data or text (or describe its columns)?", assume: "I'll paste the data next; work only from what I provide" },
      { key: "questions", label: "Questions to answer", question: "What decisions should this analysis support?", assume: "the most decision-relevant patterns" },
      { key: "app", label: "Tool", question: "Which tool are you using (Excel, Sheets, Python, SQL)?", assume: "Excel or Google Sheets" },
    ],
    constraints: ["Compute only from the provided data; show the calculation for every number", "Separate findings (what the data shows) from interpretation (what it might mean)"],
    checks: ["Every number traces back to the data", "Limitations and data-quality issues are stated"],
  },
  finance: {
    slots: [
      { key: "income", label: "Monthly income", question: "What's your monthly take-home income?", assume: "use [income] as a placeholder; don't invent a figure", detect: /(₹|\$|rs\.?\s?\d|\d+\s?(k|lakh|lakhs|crore)|\d{4,})/i },
      { key: "expenses", label: "Main expenses", question: "What are your fixed costs (rent, EMIs, bills) and typical spending?", assume: "use placeholders for each category" },
      { key: "region", label: "Country / currency", question: "Which country and currency?", assume: "India, rupees (₹)" },
    ],
    constraints: ["Use only numbers I provide; label any example figures as hypothetical", "Show the arithmetic so I can check it"],
    checks: ["All maths is correct and shown", "Advice is educational and states its assumptions"],
  },
};

const derivedRole = (sub: Subcategory) =>
  `${sub.role}. You give specific, practical guidance for my exact situation and explain trade-offs in a sentence, not a lecture`;

/** Expert block for a subcategory: hand-written when available, otherwise derived from the registry + category defaults. */
export function expertFor(cat: Category | null, sub: Subcategory | null): ExpertBlock | null {
  if (!sub || !cat) return null;
  const rich = EXPERT_BLOCKS[sub.id];
  if (rich) return rich;
  const d = CATEGORY_DEFAULTS[cat.id];
  const fieldSlots: Slot[] = (sub.fields ?? []).map((f) => d.slots.find((s) => s.key === f.key) ?? { key: f.key, label: f.label, question: `${f.label}?`, assume: `use a [${f.label.toLowerCase()}] placeholder` });
  const slots = [...fieldSlots, ...d.slots.filter((s) => !fieldSlots.some((f) => f.key === s.key))].slice(0, 4);
  return {
    role: derivedRole(sub),
    success: sub.objective,
    slots,
    steps: sub.workflow,
    constraints: [...(sub.rules ?? []), ...d.constraints],
    output: sub.output.split(/\s*[·;]\s*/).filter(Boolean),
    checks: d.checks,
  };
}

/** Generic block when no category matched. */
export const GENERIC_BLOCK: ExpertBlock = {
  role: "senior expert in the subject of my request, known for practical, specific answers. You think through the problem before answering and explain trade-offs briefly",
  success: "I can act on the answer immediately: it is specific to my situation, structured, and tells me the next step.",
  slots: [
    { key: "context", label: "Background", question: "What's your situation and what have you tried?", assume: "infer the most likely situation from my request and state it" },
    AUD,
    { key: "format", label: "Format and length", question: "What format and length do you want?", assume: "a concise, structured answer with headings" },
  ],
  steps: ["Restate the core problem in one sentence", "Identify the 2–3 factors that matter most for my situation", "Work through the answer step by step, with a concrete example", "Finish with a clear recommendation and next step"],
  constraints: [],
  output: ["Short answer (2–3 sentences)", "Details with headings or a table where it helps", "Next steps (numbered)"],
  checks: ["The answer is specific to my situation, not generic", "Every claim is accurate or flagged as uncertain"],
};
