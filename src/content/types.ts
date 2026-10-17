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
}
