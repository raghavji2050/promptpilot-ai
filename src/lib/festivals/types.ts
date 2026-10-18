/** Festival data model. All dates are civil dates in India (IST), formatted YYYY-MM-DD. */
export type ISODate = string;

export type FestivalStatus = "verified" | "provisional";

/** Content goals a festival supports (drives studio sections and the festival builder). */
export const FESTIVAL_GOALS = [
  { id: "greeting", label: "Greeting / wishes" },
  { id: "social-post", label: "Social media post" },
  { id: "reel", label: "Reel / short video" },
  { id: "image", label: "Image / poster prompt" },
  { id: "business-campaign", label: "Business campaign" },
  { id: "product-promo", label: "Product promotion" },
  { id: "personal-message", label: "Personal / family message" },
  { id: "educational", label: "Educational / cultural explainer" },
  { id: "event-planning", label: "Event planning" },
] as const;
export type FestivalGoal = (typeof FESTIVAL_GOALS)[number]["id"];

export interface FestivalSource { label: string; url: string }

export interface Occurrence {
  year: number;
  /** First day of the observance (for multi-day festivals). */
  start: ISODate;
  /** Last day of the observance; the festival is retired the day after. */
  end: ISODate;
  /** The main day used for countdowns. */
  primary: ISODate;
  status: FestivalStatus;
  /** Source codes from SOURCES (see sources.ts). */
  sources: string[];
  lastVerified: ISODate;
  /** Why the date is provisional or how regions differ. */
  note?: string;
  /** Optional admin overrides of the promotional window. */
  campaignStart?: ISODate;
  campaignEnd?: ISODate;
  /** Admin can hide an occurrence without deleting data. */
  hidden?: boolean;
}

export interface FestivalTheme {
  /** Accent used for borders, chips and the countdown. Must meet 4.5:1 on white when used as text. */
  accent: string;
  /** Soft background tint. */
  soft: string;
  /** Accent for dark mode (lighter). */
  accentDark: string;
  /** Emoji-free visual motif names used in copy and image prompts. */
  motifs: string[];
}

export interface Festival {
  slug: string;
  name: string;
  aliases: string[];
  /** One neutral, factual line. No ritual or muhurat claims. */
  summary: string;
  regions: string[];
  traditions: string[];
  goals: FestivalGoal[];
  theme: FestivalTheme;
  /** Days before the start date when the seasonal campaign opens. */
  leadDays: number;
  /** Fixed Gregorian date (month 1-12, day): occurrences are generated for any year. */
  fixed?: { month: number; day: number };
  occurrences: Occurrence[];
  /** Cultural care notes the generated prompts must respect. */
  care: string[];
  /** Phrases commonly used in greetings (well-known only; the AI writes the rest). */
  greetings: string[];
  /** Lower number wins when campaigns overlap. */
  priority: number;
}

/** A festival resolved to one concrete occurrence with its campaign window. */
export interface FestivalInstance {
  festival: Festival;
  occurrence: Occurrence;
  campaignStart: ISODate;
  campaignEnd: ISODate;
}
