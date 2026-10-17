import type { CategoryId } from "@/lib/categories/types";

export type LibraryKind = "developer" | "social" | "general";
export type TrendStatus = "current" | "seasonal" | "evergreen";

export interface Source { label: string; url: string }

export interface LibraryItem {
  slug: string;
  kind: LibraryKind;
  title: string;
  summary: string;
  body: string;
  category: string;
  targets: string[];
  tags: string[];
  stacks?: string[];
  locale?: "en" | "hi";
  /** Developer prompts: the failure mode this prompt is designed to prevent. */
  failureMode?: string;
  /** Social prompts: trend labelling. "current" and "seasonal" claims must cite sources. */
  trend?: { status: TrendStatus; note: string; sources: Source[]; lastVerified: string };
  aspect?: string;
  requiresPhoto?: boolean;
  /** Goal-based category (registry id). Derived for legacy items if missing. */
  cat?: CategoryId;
  /** Registry subcategory id, used to open the builder preset. */
  sub?: string;
  /** Who it's for. */
  audience?: string;
  /** Short use-case label. */
  useCase?: string;
  /** What the AI returns, e.g. "Plan", "Email", "Table", "Image prompt". */
  outputType?: string;
  /** ISO date the prompt was added (for "newest" sorting). */
  added?: string;
  /** Premium packs are not live; every current prompt is free. */
  premium?: boolean;
  /** Illustrative example of what an AI might return. Always labelled as an example in the UI. */
  exampleOutput?: string;
}
