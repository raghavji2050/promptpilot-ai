import type { FieldDef } from "@/lib/engine/types";

export type CategoryId =
  | "social" | "business" | "writing" | "education" | "design"
  | "coding" | "career" | "productivity" | "data" | "finance";

/** Topics that need responsible-use guardrails in generated prompts. */
export type Sensitivity = "medical" | "legal" | "financial";

export interface Subcategory {
  id: string;
  name: string;
  /** Short description shown in the UI. */
  blurb: string;
  /**
   * Intent keywords. Single words match with simple plural/verb suffixes (s, es, ing, ed, er).
   * Multi-word phrases score higher than single words.
   */
  keywords: string[];
  /** Expert role the AI should adopt. */
  role: string;
  /** What a great answer must achieve, beyond the user's own goal sentence. */
  objective: string;
  /** Ordered steps the AI should follow. */
  workflow: string[];
  /** Default deliverable when the user doesn't specify a format. */
  output: string;
  /** Extra task-specific rules. */
  rules?: string[];
  /** Conditional fields shown when this subcategory is selected. */
  fields?: FieldDef[];
  /** Preferred platform family; image/video subcategories switch to visual prompt formats. */
  visual?: "image" | "video";
  sensitive?: Sensitivity;
  /** Example goal used in the UI placeholder and tests. */
  example: string;
}

export interface Category {
  id: CategoryId;
  letter: string;
  name: string;
  short: string;
  description: string;
  icon: string;
  /** Who this category helps (used on the homepage and landing pages). */
  audience: string;
  /** Weak, category-level keywords (score lower than subcategory keywords). */
  keywords: string[];
  subcategories: Subcategory[];
}
