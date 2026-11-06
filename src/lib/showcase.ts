import { APP_BUILDER_PACK } from "@/content/more-packs";
import { buildUniversal, toShareParams } from "@/lib/engine";
import { buildImageReelPrompt, type ImageReelInput } from "@/lib/engine/image-reel";

export type ShowcaseCard = { id: string; title: string; weak: string; built: string; output: string; outputLabel: "Example output"; tryHref: string };

const TEXT = [
  { id: "cover-letter", title: "Cover letter", weak: "write cover letter", goal: "Write a cover letter for a junior data analyst job at a Bengaluru fintech startup", targetId: "chatgpt",
    output: "Dear Hiring Manager,\nI'm applying for the Junior Data Analyst role. In my final-year project I cleaned and analysed sales data in SQL and Python and presented the findings as a dashboard…" },
  { id: "shop-caption", title: "Shop Instagram caption", weak: "caption for my shop", goal: "Diwali sale Instagram caption for my saree shop in Lucknow, Hinglish", targetId: "chatgpt",
    output: "Is Diwali, apni roshni ke saath naya saree look bhi! ✨ Lucknow ki sabse pyaari collection ab sale pe. Aaj hi aaiye 🪔 #DiwaliSale #Lucknow" },
];
const IMAGE: (ImageReelInput & { id: string; title: string; weak: string; output: string })[] = [
  { id: "diwali-poster", title: "Festival poster (Midjourney)", weak: "diwali poster", useCase: "festival-poster", model: "midjourney", subject: "Diwali sale for my mithai dukaan in Jaipur", textOnImage: "Happy Diwali – 20% off",
    output: "Example of what to expect: a 4:5 poster with diyas and marigolds around a sweets counter, warm lighting, and a clear headline area. (No image shown: we only show images we actually generated.)" },
  { id: "reel", title: "Instagram reel (Sora / Veo / Runway)", weak: "make reel for cafe", useCase: "instagram-reel", model: "video", subject: "chai cafe opening in Pune",
    output: "Example of what to expect: a 10-second 9:16 clip in three shots, a wide view of the cafe, a push-in on a cup of chai, then a close-up with the caption." },
];

/** Weak one-liner vs structured Claude Code / Cursor brief from the App Builder pack. */
const APP = [
  {
    id: "browser-game",
    title: "Browser game brief (Claude Code / Cursor)",
    weak: "make a browser game",
    packId: "browser-game",
    output:
      "Example of what to expect: an agent opens index.html, ships a canvas loop with keyboard + touch, score/game-over/restart, and localStorage best score — then reports what it verified after each step.",
  },
  {
    id: "crud-app",
    title: "CRUD app brief (Claude Code / Cursor)",
    weak: "banao ek CRUD app",
    packId: "crud-app",
    output:
      "Example of what to expect: create/list/edit/delete for the resource, Zod/server validation, empty state + delete confirm, and unit tests for validation and API routes — no invented fields or paid services.",
  },
] as const;

export function getShowcase(): ShowcaseCard[] {
  const t = TEXT.map((c) => {
    const built = buildUniversal({ goal: c.goal, targetId: c.targetId }).text;
    return { id: c.id, title: c.title, weak: c.weak, built, output: c.output, outputLabel: "Example output" as const, tryHref: `/builder?${toShareParams({ goal: c.goal, targetId: c.targetId }).toString()}` };
  });
  const i = IMAGE.map((c) => ({ id: c.id, title: c.title, weak: c.weak, built: buildImageReelPrompt(c), output: c.output, outputLabel: "Example output" as const,
    tryHref: `/image-reel-builder?${new URLSearchParams({ uc: c.useCase, model: c.model, subject: c.subject }).toString()}` }));
  const a = APP.map((c) => {
    const tpl = APP_BUILDER_PACK.find((p) => p.id === c.packId)!;
    const built = buildUniversal(tpl.input).text;
    return {
      id: c.id,
      title: c.title,
      weak: c.weak,
      built,
      output: c.output,
      outputLabel: "Example output" as const,
      tryHref: `/builder?${toShareParams(tpl.input).toString()}`,
    };
  });
  return [...t, ...i, ...a];
}
