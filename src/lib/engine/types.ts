export type TargetFamily = "chat" | "search" | "coding_agent" | "image" | "video";
export type TargetStyle = "markdown" | "xml" | "plain" | "image" | "video";

export interface Target {
  id: string;
  name: string;
  family: TargetFamily;
  style: TargetStyle;
  /** Editorial formatting note shown in the UI. Re-verify against vendor docs periodically. */
  note: string;
}

export type FieldType = "text" | "textarea" | "select";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  maxLen?: number;
}

export interface TaskTemplate {
  id: string;
  version: number;
  name: string;
  description: string;
  families: TargetFamily[];
  /** Fields specific to this task, shown after the common fields. */
  fields: FieldDef[];
  /** Default role line if user leaves role empty. */
  defaultRole?: string;
  /** Task-specific requirements always appended to constraints. */
  baseConstraints?: string[];
  /** Default output format if user leaves format empty. */
  defaultFormat?: string;
}

export type Mode = "standard" | "concise" | "detailed";

export interface BuilderInput {
  templateId: string;
  targetId: string;
  mode?: Mode;
  /** Apply deterministic "improve" pass (fills gaps with safe defaults). */
  improve?: boolean;
  values: Record<string, string>;
}

export interface Section {
  id: string;
  title: string;
  /** Lines of content. Bullet-able lists are represented as multiple lines. */
  lines: string[];
  list?: boolean;
}

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  tip: string;
  weight: number;
}

export interface BuildResult {
  text: string;
  sections: Section[];
  score: number;
  checks: CheckResult[];
  templateKey: string;
  target: Target;
  warnings: string[];
}
