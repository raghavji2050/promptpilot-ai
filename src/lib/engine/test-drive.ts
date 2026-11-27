/**
 * Prompt Test Drive, deterministic half: raw idea vs PromptPilot prompt, scored with the same rules as the analyzer.
 * Client-safe (no secrets, no network), so the page can show the before/after instantly.
 */
import { analyzePrompt, type Issue } from "./analyze";
import { whatWeAdded, type AddedChip } from "./compare";
import { TARGETS } from "./targets";
import { buildUniversal } from "./universal";

export interface ScoreSummary {
  score: number;
  words: number;
  issues: Pick<Issue, "id" | "severity" | "message">[];
  strengths: string[];
}

export interface DeterministicTestDrive {
  target: string;
  rawIdea: string;
  improvedPrompt: string;
  /** true when PromptPilot built the improved prompt; false when the caller supplied it. */
  generated: boolean;
  raw: ScoreSummary;
  improved: ScoreSummary;
  scoreDelta: number;
  addedChips: AddedChip[];
}

/** Chat targets only: the live drive runs text models. Unknown or non-text targets fall back to ChatGPT. */
export function testDriveTarget(id: string | undefined): string {
  const t = TARGETS.find((x) => x.id === id);
  return t && (t.family === "chat" || t.family === "search" || t.family === "coding_agent") ? t.id : "chatgpt";
}

export function scoreSummary(text: string): ScoreSummary {
  const a = analyzePrompt(text);
  return { score: a.score, words: a.stats.words, issues: a.issues.map(({ id, severity, message }) => ({ id, severity, message })), strengths: a.strengths };
}

export function deterministicTestDrive(rawIdea: string, improvedPrompt?: string, target?: string): DeterministicTestDrive {
  const idea = rawIdea.trim();
  const targetId = testDriveTarget(target);
  let text = improvedPrompt?.trim() ?? "";
  let addedChips: AddedChip[] = [];
  const generated = !text;
  if (generated) {
    const r = buildUniversal({ goal: idea, targetId, mode: "standard" });
    text = r.text;
    addedChips = whatWeAdded(r);
  }
  const raw = scoreSummary(idea);
  const improved = scoreSummary(text);
  return { target: targetId, rawIdea: idea, improvedPrompt: text, generated, raw, improved, scoreDelta: improved.score - raw.score, addedChips };
}

export interface OutputSignals { words: number; hasStructure: boolean; hasPlaceholders: boolean }

/** Plain, checkable facts about an AI answer. No quality judgement is invented. */
export function outputSignals(text: string | undefined): OutputSignals {
  const s = (text ?? "").trim();
  return {
    words: s ? s.split(/\s+/).length : 0,
    hasStructure: /^\s*(#{1,6}\s|[-*•]\s|\d+[.)]\s|\|.*\|)/m.test(s),
    hasPlaceholders: /\[[^\]\n]{1,60}\]/.test(s),
  };
}

export const TEST_DRIVE_SAMPLES = [
  { id: "cold-email", label: "Cold email for a SaaS", idea: "write a cold outreach email for my SaaS startup" },
  { id: "laravel", label: "Debug a slow Laravel query", idea: "fix this slow SQL query in my Laravel app" },
  { id: "reel", label: "30-sec product reel script", idea: "30 sec reel script for my new product launch" },
] as const;
