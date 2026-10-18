import { builderHref } from "@/lib/site";
import type { Festival, FestivalGoal } from "./types";

/** Quick-start goals shown as "collections" for a festival (first matching 4). */
export const QUICK_GOALS: { goal: FestivalGoal; label: string; text: (f: Festival) => string }[] = [
  { goal: "social-post", label: "Instagram post & caption", text: (f) => `Write an Instagram post and caption for ${f.name}` },
  { goal: "greeting", label: "Greetings & wishes", text: (f) => `Write warm ${f.name} wishes for family, friends and colleagues` },
  { goal: "reel", label: "Reel script", text: (f) => `Write a 30-second Instagram Reel script for ${f.name}` },
  { goal: "business-campaign", label: "Small-business campaign", text: (f) => `Plan a ${f.name} marketing campaign for my small business` },
  { goal: "image", label: "Poster / image prompt", text: (f) => `Create an image prompt for a ${f.name} poster` },
  { goal: "educational", label: "Explainer for students", text: (f) => `Explain ${f.name} respectfully for school students` },
];

export function quickGoals(f: Festival, n = 4) {
  return QUICK_GOALS.filter((q) => f.goals.includes(q.goal)).slice(0, n);
}

/** Where "Create Festival Content" goes for a festival. */
export function festivalHref(f: Festival, goal?: FestivalGoal): string {
  const q = goal ? QUICK_GOALS.find((x) => x.goal === goal) : undefined;
  return builderHref(q ? q.text(f) : `Create ${f.name} content for my audience`);
}
