import type { FieldDef, TaskTemplate } from "./types";

/** Common fields shared by all text-family templates. */
export const COMMON_TEXT_FIELDS: FieldDef[] = [
  { key: "goal", label: "What do you want?", type: "textarea", required: true, placeholder: "e.g. Write a cold email to a dental clinic offering website redesign", maxLen: 1500 },
  { key: "context", label: "Background / context", type: "textarea", placeholder: "Who you are, what the AI can't guess, relevant facts", help: "Context is the most common thing prompts are missing.", maxLen: 4000 },
  { key: "audience", label: "Audience", type: "text", placeholder: "e.g. clinic owners in Mohali, non-technical", maxLen: 300 },
  { key: "role", label: "Role for the AI (optional)", type: "text", placeholder: "e.g. senior B2B copywriter", maxLen: 200 },
  { key: "tone", label: "Tone", type: "select", options: ["", "neutral", "friendly", "professional", "persuasive", "playful", "academic", "direct"] },
  { key: "format", label: "Output format", type: "text", placeholder: "e.g. 120-word email with subject line", maxLen: 300 },
  { key: "constraints", label: "Constraints (one per line)", type: "textarea", placeholder: "No jargon\nMention free audit", maxLen: 2000 },
  { key: "example", label: "Example of good output (optional)", type: "textarea", maxLen: 3000 },
];

export const COMMON_IMAGE_FIELDS: FieldDef[] = [
  { key: "subject", label: "Subject", type: "textarea", required: true, placeholder: "e.g. a chai vendor at dawn in an old Punjab market", maxLen: 600 },
  { key: "style", label: "Style", type: "text", placeholder: "e.g. cinematic photo, 35mm film, watercolor", maxLen: 200 },
  { key: "lighting", label: "Lighting", type: "text", placeholder: "e.g. soft golden hour, rim light", maxLen: 200 },
  { key: "composition", label: "Composition / camera", type: "text", placeholder: "e.g. close-up, shallow depth of field", maxLen: 200 },
  { key: "mood", label: "Mood / colors", type: "text", placeholder: "e.g. warm, nostalgic, muted teal and orange", maxLen: 200 },
  { key: "aspect", label: "Aspect ratio", type: "select", options: ["1:1", "4:5", "9:16", "16:9", "3:2"] },
  { key: "avoid", label: "Avoid", type: "text", placeholder: "e.g. text, watermark, extra fingers", maxLen: 300 },
];

export const COMMON_VIDEO_FIELDS: FieldDef[] = [
  { key: "subject", label: "Subject & action", type: "textarea", required: true, placeholder: "e.g. a barista pours latte art in slow motion", maxLen: 600 },
  { key: "shot", label: "Shot type", type: "select", options: ["", "wide shot", "medium shot", "close-up", "extreme close-up", "aerial shot", "over-the-shoulder"] },
  { key: "camera", label: "Camera movement", type: "select", options: ["", "static", "slow dolly in", "dolly out", "pan left", "pan right", "orbit", "handheld", "crane up", "tracking shot"] },
  { key: "setting", label: "Setting", type: "text", placeholder: "e.g. cozy cafe, morning light through windows", maxLen: 300 },
  { key: "style", label: "Visual style", type: "text", placeholder: "e.g. cinematic, shallow depth of field, film grain", maxLen: 200 },
  { key: "duration", label: "Duration", type: "select", options: ["", "4 seconds", "6 seconds", "8 seconds", "10 seconds"] },
  { key: "audio", label: "Audio (if supported)", type: "text", placeholder: "e.g. soft cafe ambience, milk steaming", maxLen: 200 },
  { key: "aspect", label: "Aspect ratio", type: "select", options: ["16:9", "9:16", "1:1"] },
];

export const TEMPLATES: TaskTemplate[] = [
  {
    id: "general", version: 1, name: "General task", description: "Any writing, analysis or Q&A task.",
    families: ["chat", "search"], fields: [], defaultFormat: "Clear, well-structured answer",
  },
  {
    id: "cold-email", version: 1, name: "Cold email", description: "Outreach email with a clear offer and CTA.",
    families: ["chat"], defaultRole: "experienced B2B copywriter",
    fields: [
      { key: "offer", label: "Your offer", type: "text", required: true, placeholder: "e.g. free website audit", maxLen: 300 },
      { key: "cta", label: "Call to action", type: "text", placeholder: "e.g. reply to book a 15-min call", maxLen: 200 },
    ],
    baseConstraints: ["Keep it under 150 words", "One clear call to action", "No exaggerated claims"],
    defaultFormat: "Subject line + email body",
  },
  {
    id: "blog-outline", version: 1, name: "Blog / article outline", description: "SEO-aware article outline.",
    families: ["chat"], defaultRole: "editor who writes practical, accurate articles",
    fields: [
      { key: "keyword", label: "Primary topic / keyword", type: "text", required: true, maxLen: 200 },
      { key: "length", label: "Target length", type: "select", options: ["", "800 words", "1200 words", "2000 words"] },
    ],
    baseConstraints: ["Do not invent statistics; mark any number that needs a source as [source needed]"],
    defaultFormat: "H2/H3 outline with one-line notes per section and an FAQ section",
  },
  {
    id: "summarize", version: 1, name: "Summarize", description: "Summarize text, notes or a document.",
    families: ["chat"], fields: [
      { key: "source", label: "Text to summarize", type: "textarea", required: true, maxLen: 12000 },
      { key: "length", label: "Summary length", type: "select", options: ["", "3 bullets", "1 paragraph", "1 page"] },
    ],
    baseConstraints: ["Only use information from the provided text", "Flag anything ambiguous"],
    defaultFormat: "Bullet summary followed by key takeaways",
  },
  {
    id: "research-brief", version: 1, name: "Research brief", description: "Sourced research question (best for Perplexity).",
    families: ["search", "chat"], fields: [
      { key: "timeframe", label: "Time range", type: "text", placeholder: "e.g. last 12 months", maxLen: 100 },
      { key: "region", label: "Region", type: "text", placeholder: "e.g. India", maxLen: 100 },
    ],
    baseConstraints: ["Cite a source URL for every factual claim", "Say clearly when sources disagree or data is unavailable"],
    defaultFormat: "Short answer, then evidence bullets with citations, then open questions",
  },
  {
    id: "study-plan", version: 1, name: "Learning / study plan", description: "Structured plan to learn a skill.",
    families: ["chat"], defaultRole: "patient teacher",
    fields: [
      { key: "level", label: "Current level", type: "select", options: ["", "beginner", "intermediate", "advanced"] },
      { key: "time", label: "Time available", type: "text", placeholder: "e.g. 1 hour/day for 4 weeks", maxLen: 100 },
    ],
    defaultFormat: "Week-by-week plan with daily tasks and a self-check at the end of each week",
  },
  {
    id: "code-task", version: 1, name: "Coding task (agent)", description: "Task brief for Cursor, Claude Code or other coding agents.",
    families: ["coding_agent", "chat"], defaultRole: "careful senior software engineer",
    fields: [
      { key: "stack", label: "Stack", type: "text", placeholder: "e.g. Laravel 12, PHP 8.3, MySQL, Pest", maxLen: 200 },
      { key: "files", label: "Files / areas in scope", type: "textarea", placeholder: "app/Http/Controllers/InvoiceController.php", maxLen: 1000 },
      { key: "done", label: "Definition of done", type: "textarea", placeholder: "Tests pass; no new N+1 queries", maxLen: 1000 },
    ],
    baseConstraints: [
      "Make the smallest change that solves the task",
      "Do not modify unrelated files",
      "Explain any assumption before acting on it",
    ],
    defaultFormat: "Short plan, then the change, then how you verified it",
  },
  {
    id: "image", version: 1, name: "Image prompt", description: "Prompt for an image generator.",
    families: ["image"], fields: [],
  },
  {
    id: "video", version: 1, name: "Video shot prompt", description: "Prompt for a text-to-video model.",
    families: ["video"], fields: [],
  },
];

export function getTemplate(id: string): TaskTemplate {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown template: ${id}`);
  return t;
}

export function fieldsFor(templateId: string): FieldDef[] {
  const t = getTemplate(templateId);
  if (t.families.includes("image")) return COMMON_IMAGE_FIELDS;
  if (t.families.includes("video")) return COMMON_VIDEO_FIELDS;
  return [...COMMON_TEXT_FIELDS, ...t.fields];
}

export function templatesForFamily(family: string): TaskTemplate[] {
  return TEMPLATES.filter((t) => (t.families as string[]).includes(family));
}
