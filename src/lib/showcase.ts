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

export function getShowcase(): ShowcaseCard[] {
  const t = TEXT.map((c) => {
    const built = buildUniversal({ goal: c.goal, targetId: c.targetId }).text;
    return { id: c.id, title: c.title, weak: c.weak, built, output: c.output, outputLabel: "Example output" as const, tryHref: `/builder?${toShareParams({ goal: c.goal, targetId: c.targetId }).toString()}` };
  });
  const i = IMAGE.map((c) => ({ id: c.id, title: c.title, weak: c.weak, built: buildImageReelPrompt(c), output: c.output, outputLabel: "Example output" as const,
    tryHref: `/image-reel-builder?${new URLSearchParams({ uc: c.useCase, model: c.model, subject: c.subject }).toString()}` }));
  return [...t, ...i];
}
