import { CATEGORIES } from "./data";
import type { Category, CategoryId, Sensitivity, Subcategory } from "./types";

export * from "./types";
export { CATEGORIES };

export function getCategory(id: string | undefined | null): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getSubcategory(catId: string | undefined | null, subId: string | undefined | null): Subcategory | undefined {
  return getCategory(catId)?.subcategories.find((s) => s.id === subId);
}

/** Find a subcategory by id across all categories (ids are globally unique; enforced by tests). */
export function findSubcategory(subId: string | undefined | null): { category: Category; sub: Subcategory } | undefined {
  for (const category of CATEGORIES) {
    const sub = category.subcategories.find((s) => s.id === subId);
    if (sub) return { category, sub };
  }
  return undefined;
}

export const GUARDRAILS: Record<Sensitivity, string[]> = {
  medical: [
    "Present this as general health information, not a diagnosis or treatment plan",
    "Base answers on reliable sources (e.g. WHO, national health services, peer-reviewed guidance) and name them",
    "Clearly list warning signs that need prompt medical attention",
    "Recommend consulting a qualified doctor or healthcare professional before acting",
  ],
  legal: [
    "Present this as general legal information, not legal advice; laws vary by jurisdiction and change",
    "Cite the relevant law or an official source where possible, and say if unsure",
    "Recommend consulting a qualified lawyer for decisions with legal consequences",
  ],
  financial: [
    "Present this as educational information, not personalised financial advice",
    "Use only numbers I provide; label any example figures as hypothetical",
    "Mention risks, costs and that returns are not guaranteed; verify current rules and rates from official sources",
    "Recommend consulting a licensed financial advisor before major decisions",
  ],
};

export type { CategoryId as CatId };
