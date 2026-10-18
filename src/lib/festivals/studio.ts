import type { FestivalGoal } from "./types";

export interface Starter { goal: FestivalGoal; platform?: string; title: string; desc: string }
export interface StudioSection { id: string; title: string; intro: string; note?: string; starters: Starter[] }

/** The five studio sections on every festival page. Starters a festival doesn't support are hidden. */
export const STUDIO_SECTIONS: StudioSection[] = [
  {
    id: "social", title: "Social Media", intro: "Posts, carousels, stories and Reel scripts that connect the festival to your account instead of a generic wish.",
    starters: [
      { goal: "social-post", platform: "Instagram", title: "Instagram post + carousel", desc: "Hook, caption, CTA, hashtags, alt text, a 5-slide carousel and 3 story frames." },
      { goal: "reel", platform: "Instagram", title: "Reel / Shorts script", desc: "A 2-second hook, timed beats, on-screen text, voiceover and a phone-friendly shot list." },
    ],
  },
  {
    id: "image", title: "Image & Poster Prompts", intro: "Prompts for Midjourney, ChatGPT images, Gemini, Ideogram and others, with the right aspect ratio and things to avoid.",
    note: "These are image prompts, not images. AI image tools often render text imperfectly, so each prompt asks for no text and leaves space: add your greeting or offer later in Canva, Figma or any editor.",
    starters: [
      { goal: "image", platform: "Instagram", title: "Instagram post image (4:5)", desc: "Festive scene or product shot with space for text added later." },
      { goal: "image", platform: "WhatsApp", title: "WhatsApp status image (9:16)", desc: "A vertical image for status updates and stories." },
    ],
  },
  {
    id: "business", title: "Business Marketing", intro: "Honest festive campaigns for small businesses: timeline, WhatsApp and Instagram copy, poster lines and simple measures.",
    note: "We never invent discounts, prices or deadlines. Add your real offer, or the prompt uses an [YOUR OFFER] placeholder.",
    starters: [
      { goal: "business-campaign", platform: "WhatsApp", title: "Festive campaign plan", desc: "Dated plan from teaser to thank-you, copy for each channel and an ops checklist." },
      { goal: "product-promo", platform: "Instagram", title: "Product promotion copy", desc: "Gifting angle, headlines, description, WhatsApp blurb, caption and photo brief." },
    ],
  },
  {
    id: "personal", title: "Personal & Family", intro: "Greetings and messages that sound like you, for family, friends, colleagues and clients.",
    starters: [
      { goal: "greeting", platform: "WhatsApp", title: "Greetings & wishes", desc: "6 greetings in your language: short WhatsApp lines, card messages, formal and playful." },
      { goal: "personal-message", title: "Personal family message", desc: "One heartfelt message as a text, a 30-second voice note and a handwritten card." },
    ],
  },
  {
    id: "culture", title: "Cultural & Educational", intro: "Respectful explainers, school speeches and event plans that acknowledge regional differences.",
    note: "Prompts tell the AI not to invent rituals or state muhurat timings as fact. For timings, check a local panchang or your family priest.",
    starters: [
      { goal: "educational", title: "Explainer or school speech", desc: "Accurate, age-appropriate text with regional variations and a short quiz." },
      { goal: "event-planning", title: "Plan a celebration", desc: "Run of show, checklist, budget table, inclusive activities, safety and invite." },
    ],
  },
];
