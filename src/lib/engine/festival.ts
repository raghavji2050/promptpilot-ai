/**
 * Festival-aware expert blocks. A festival prompt is a normal universal prompt whose expert block
 * is built from the festival (dates, regions, motifs, cultural care notes) and the content goal.
 * Selected with input.extra.festival (slug or "custom") and input.extra.fgoal.
 */
import { FESTIVALS, FESTIVAL_GOALS, formatDate, formatRange, istToday, nextInstance, type Festival, type FestivalGoal, type FestivalInstance } from "@/lib/festivals";
import type { CategoryId } from "@/lib/categories";
import type { ExpertBlock, Slot } from "./expert";

export const FESTIVAL_LANGUAGES = ["English", "Hindi", "Hinglish", "Punjabi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Odia", "Assamese", "Urdu"] as const;

export const FESTIVAL_PLATFORMS = ["Instagram", "WhatsApp", "Facebook", "LinkedIn", "YouTube Shorts", "X (Twitter)", "Greeting card / print", "Email", "In-store poster", "Google Business Profile"] as const;

/** Advanced fields (stored in input.extra) and which goals use them. */
export const FESTIVAL_FIELDS: { key: string; label: string; placeholder: string; goals: FestivalGoal[] }[] = [
  { key: "business", label: "Business type", placeholder: "e.g. sweet shop in Indore, online saree boutique", goals: ["business-campaign", "product-promo", "social-post", "reel", "image"] },
  { key: "offer", label: "Your offer (optional; we never invent one)", placeholder: "e.g. free gift wrapping on orders above ₹999", goals: ["business-campaign", "product-promo"] },
  { key: "product", label: "Product(s)", placeholder: "e.g. dry-fruit gift boxes, 500 g and 1 kg", goals: ["product-promo", "image", "reel"] },
  { key: "location", label: "Location", placeholder: "e.g. Pune, or 'ship across India'", goals: ["business-campaign", "product-promo", "event-planning", "social-post"] },
  { key: "recipient", label: "Who is it for?", placeholder: "e.g. my parents, team at work, clients", goals: ["greeting", "personal-message"] },
  { key: "details", label: "Personal detail to include", placeholder: "e.g. first Diwali away from home, new baby", goals: ["greeting", "personal-message"] },
  { key: "eventType", label: "Event", placeholder: "e.g. office Diwali party, RWA Lohri night", goals: ["event-planning"] },
  { key: "guests", label: "Guests", placeholder: "e.g. 40 people, kids included", goals: ["event-planning"] },
  { key: "budget", label: "Budget", placeholder: "e.g. ₹25,000", goals: ["event-planning", "business-campaign"] },
  { key: "level", label: "Class / level", placeholder: "e.g. Class 6, college, general readers", goals: ["educational"] },
  { key: "length", label: "Length", placeholder: "e.g. 2-minute assembly speech, 300 words", goals: ["educational", "personal-message", "reel"] },
  { key: "style", label: "Visual style", placeholder: "e.g. warm photo, flat illustration, 3D, watercolour", goals: ["image"] },
];

const GOAL_CATEGORY: Record<FestivalGoal, CategoryId> = {
  greeting: "writing", "personal-message": "writing", "social-post": "social", reel: "social",
  "business-campaign": "business", "product-promo": "business", educational: "education", "event-planning": "productivity", image: "design",
};
export const festivalGoalCategory = (g: FestivalGoal) => GOAL_CATEGORY[g];
export const festivalGoalLabel = (g: FestivalGoal) => FESTIVAL_GOALS.find((x) => x.id === g)?.label ?? g;
export const isFestivalGoal = (g: unknown): g is FestivalGoal => FESTIVAL_GOALS.some((x) => x.id === g);

/** A custom occasion typed by the user (no dates or tradition-specific notes). */
export function customFestival(name: string): Festival {
  const n = name.trim().slice(0, 60) || "the occasion";
  return {
    slug: "custom", name: n, aliases: [], summary: "", regions: [], traditions: [], goals: FESTIVAL_GOALS.map((g) => g.id),
    theme: { accent: "#4338ca", soft: "#eef2ff", accentDark: "#a5b4fc", motifs: [] }, leadDays: 10, occurrences: [], priority: 9, greetings: [],
    care: ["Be respectful; do not mock or stereotype any community or tradition", "Do not invent rituals, history or customs; if unsure, keep it general"],
  };
}

export interface FestivalContext { festival: Festival; goal: FestivalGoal; instance: FestivalInstance | null; extra?: Record<string, string> }

export function festivalContextFor(extra: Record<string, string> | undefined, today = istToday()): FestivalContext | null {
  const slug = extra?.festival?.trim();
  const goal = extra?.fgoal?.trim();
  if (!slug || !isFestivalGoal(goal)) return null;
  const festival = slug === "custom" ? customFestival(extra?.occasion ?? "") : FESTIVALS.find((f) => f.slug === slug);
  if (!festival) return null;
  return { festival, goal, instance: slug === "custom" ? null : nextInstance(festival, today), extra };
}

/** Context lines describing the festival and its date (always in IST, with uncertainty stated). */
export function festivalContextLines(c: FestivalContext): string[] {
  const f = c.festival;
  const out = [`Festival: ${f.name}${f.aliases.length ? ` (also called ${f.aliases.slice(0, 3).join(", ")})` : ""}`];
  if (c.instance) {
    const o = c.instance.occurrence;
    const when = o.start === o.end ? formatDate(o.primary) : `${formatRange(o.start, o.end)}, main day ${formatDate(o.primary)}`;
    out.push(`Date (India): ${when}${o.status === "provisional" ? ". Provisional: the date may differ by region or panchang; don't state it as certain" : ""}`);
  }
  if (f.regions.length) out.push(`Where it's celebrated: ${f.regions.join(", ")}`);
  return out;
}

/** Language rules that make non-English output natural instead of translated. */
export function languageRules(lang: string): string[] {
  const l = lang.trim();
  if (!l || /^english$/i.test(l)) return [];
  if (/^hinglish/i.test(l)) return ["Write in Hinglish: Hindi in Latin script mixed with English, the way people text on WhatsApp (e.g. \"Aap sabko Diwali ki dher saari shubhkamnayein\")"];
  if (/^hindi$/i.test(l)) return ["Write in natural, everyday Hindi in Devanagari script, not a word-for-word translation from English"];
  return [`Write in natural ${l} in its own script, not a word-for-word translation from English; if you are not fully confident in ${l}, say so and add an English version`];
}

const slot = (key: string, label: string, question: string, assume: string): Slot => ({ key, label, question, assume });
const AUD = (assume: string) => slot("audience", "Audience", "Who exactly is this for?", assume);
const PLATFORM = (assume: string) => slot("platform", "Platform", "Where will you post or send it?", assume);
const LANG = slot("language", "Language", "Which language (and script) should it be in?", "English, with the festival's usual greeting phrase where natural");
const NO_CLICHE = (f: Festival) => `Avoid stock phrases like "May this ${f.name} bring joy and prosperity", "light up your life" or "festival of happiness"; be specific instead`;
const motifs = (f: Festival, n = 4) => (f.theme.motifs.length ? f.theme.motifs.slice(0, n).join(", ") : "imagery that fits how the occasion is actually celebrated");
const greet = (f: Festival) => (f.greetings.length ? ` (e.g. "${f.greetings[0]}")` : "");
const NO_INVENT_OFFER = "Never invent discounts, prices, free gifts, stock levels, deadlines (\"limited time\", \"only today\") or testimonials. Use my offer exactly as written; if I gave none, write value-led copy and mark where an offer could go as [YOUR OFFER]";

export function festivalBlock(c: FestivalContext): ExpertBlock {
  const f = c.festival;
  const name = f.name;
  const dateNote = c.instance ? `the ${name} date (${formatDate(c.instance.occurrence.primary, { weekday: false })})` : `the date of ${name}`;
  switch (c.goal) {
    case "greeting": {
      const who = c.extra?.recipient?.trim();
      return {
      role: `bilingual Indian copywriter who writes ${name} greetings that sound personal, not forwarded, and adjusts register for elders, friends and colleagues`,
      success: `I get 6 ready-to-send ${name} greetings for the right person and platform, each sounding like I wrote it, in the language I chose.`,
      slots: [slot("recipient", "Who it's for", "Who are the greetings for, and what's your relationship?", "a mix: family elders, close friends and work colleagues"), PLATFORM("WhatsApp messages and one greeting card"), LANG, slot("details", "Personal detail", "Any detail to include (a shared memory, a first festival, distance)?", "none; leave a [personal detail] slot in two of the messages")],
      steps: who ? [
        `Match the tone to my relationship with ${who}: the way I would actually talk to them (respectful aap/ji if they are an elder, polite if it is work)`,
        `Choose 2–3 concrete ${name} images to draw from (${motifs(f)}) instead of abstract words like joy and prosperity`,
        `Write 6 greetings for ${who}: 2 short (under 20 words, for WhatsApp/SMS), 2 medium (40–60 words, for a card), 1 heartfelt, 1 light and playful; work in the usual greeting phrase${greet(f)} naturally`,
        "Make two of them personal with a [personal detail] slot or the detail I gave",
        "Say which one you'd send first and why (one line)",
      ] : [
        "Pick the register for each recipient: respectful for elders (aap, ji), warm for friends, polite and inclusive for colleagues and clients",
        `Choose 2–3 concrete ${name} images to draw from (${motifs(f)}) instead of abstract words like joy and prosperity`,
        `Write 6 greetings: 2 short (under 20 words, for WhatsApp/SMS), 2 medium (40–60 words, for a card), 1 for elders, 1 light and playful; work in the usual greeting phrase${greet(f)} naturally`,
        "Make two of them personal with a [personal detail] slot or the detail I gave",
        "Suggest the best one to send to each recipient type",
      ],
      constraints: [NO_CLICHE(f), "At most 2 emojis per message and none in the elder/formal version", "No chain-message lines (\"forward to 10 people\") and no religious claims beyond the greeting itself"],
      output: who ? ["**Greetings** table: # | length | where to use | message", "**Send first** (one line)"] : ["**Greetings** table: # | for whom | length | message", "**Best pick** per recipient type (one line each)"],
      checks: ["Short messages are under 20 words", "No stock phrases from the banned list", who ? "Every message suits my relationship with the recipient" : "The formal version is respectful and emoji-free", "The language and script match what I asked for"],
    };
    }
    case "personal-message": return {
      role: "thoughtful writer who helps people write heartfelt messages for family in Indian households, warm but never filmy",
      success: `I get one ${name} message in 3 formats (text, 30-second voice note, handwritten card) that only I could have sent, because it includes something real.`,
      slots: [slot("recipient", "Who it's for", "Who is the message for, and how do you address them (Maa, Bhaiya, Didi, Papa ji)?", "a parent; address them the way an Indian family usually would in the chosen language"), slot("details", "Personal detail", "One real memory or detail to include?", "leave a clearly marked [memory] slot"), LANG, slot("length", "Length", "How long should it be?", "text under 50 words; card 60–80 words")],
      steps: [
        "Open with how I actually address this person, in the chosen language",
        `Include one specific memory or detail and tie it to ${name} (${motifs(f, 3)})`,
        "Add one wish that's about them, not generic blessings",
        "Write 3 versions: WhatsApp text, a 30-second voice-note script with natural pauses, and a handwritten card",
        "If we live apart, acknowledge it warmly without making it sad",
      ],
      constraints: [NO_CLICHE(f), "Sincere, plain words; no shayari or quotes unless I ask", "At most 1 emoji, and only in the WhatsApp version", "Keep it inclusive: don't assume who fasts, prays or celebrates in what way"],
      output: ["**WhatsApp text**", "**Voice-note script** (with [pause] marks, about 30 seconds)", "**Handwritten card**"],
      checks: ["It includes the real detail or a clear [memory] slot", "Each version fits its length", "Nothing sounds copy-pasted"],
    };
    case "social-post": return {
      role: "Indian social media strategist who plans festive content for creators and small brands on Instagram, Facebook and LinkedIn",
      success: `I get one ${name} post ready to publish (hook, caption, CTA, hashtags, alt text) plus a carousel and stories version, all on-brand and specific to my account.`,
      slots: [slot("business", "Account / brand", "What's your account or business about?", "infer it from my goal; if unclear, a small business or creator account in India"), AUD("people in India who follow accounts like mine"), PLATFORM("Instagram feed"), LANG],
      steps: [
        `Propose 3 angles that connect ${name} to my account naturally (e.g. behind the scenes, a useful festive tip, a gifting idea), not just "Happy ${name}" with a logo; pick the strongest and say why`,
        "Write the post: a first line under 12 words that works as a hook, a 80–150 word caption, one clear CTA (save, share, comment with a specific question, or visit)",
        "Add 5–8 hashtags: a few festival tags plus niche and local tags; no irrelevant trending tags",
        "Write alt text for the image (one sentence)",
        "Turn the same idea into a 5-slide carousel and 3 story frames (with a poll or question sticker idea)",
        `Note when to post relative to ${dateNote}, and tell me to check my Insights for the best time instead of claiming a universal one`,
        ...(c.extra?.promo === "1" ? ["This is a sale/offer post: make the offer the clear focus, stated exactly as I wrote it; if I didn't give the details, use [YOUR OFFER], [VALID DATES] and [HOW TO ORDER] placeholders instead of inventing them"] : []),
      ],
      constraints: [NO_INVENT_OFFER, "No engagement bait (\"comment YES\", \"tag 10 friends\") and no fake urgency", "No claims that a format or hashtag is trending or will go viral"],
      output: ["**Angles** table: angle | why it fits | format", "**Final post**: hook · caption · CTA · hashtags · alt text", "**Carousel** table: slide | headline (max 8 words) | visual", "**Stories** table: frame | text | sticker"],
      checks: ["The hook is under 12 words", `The post is clearly about my account, not a generic ${name} wish`, "No invented offers, numbers or trends", "Alt text is present"],
    };
    case "reel": return {
      role: "short-form video producer who scripts Instagram Reels and YouTube Shorts for Indian creators and small brands, shot on a phone",
      success: `I get a ${name} Reel script I can film in under an hour on a phone: a 2-second hook, timed beats, on-screen text, voiceover and caption.`,
      slots: [slot("business", "Account / brand", "What's your account or business about?", "infer it from my goal"), slot("length", "Length", "How long should the Reel be?", "about 30 seconds"), PLATFORM("Instagram Reels"), LANG],
      steps: [
        "Write 3 hook options for the first 2 seconds (visual + on-screen text, max 7 words) and pick one",
        `Write the script as timed beats that fit the length, using real ${name} visuals (${motifs(f)})`,
        "For each beat: shot (with camera move), on-screen text (max 7 words), voiceover line",
        "List the B-roll shots to capture in one session, in shooting order",
        "Suggest audio as a type (e.g. soft dhol beat, acoustic) and tell me to pick a currently popular track from the app's own library; don't name songs as trending",
        "Write the caption (under 100 words) with a CTA and 5–8 hashtags, plus a cover-frame idea",
      ],
      constraints: [NO_INVENT_OFFER, "Every shot is filmable on a phone at home or in my shop; no drones or crews", "Safety: no open flames near fabric, no unsafe firecracker stunts", "Don't use copyrighted music or film clips in the script"],
      output: ["**Hooks** table: option | visual | on-screen text", "**Script** table: time | shot | on-screen text | voiceover", "**Shot list** (in shooting order)", "**Caption, hashtags and cover idea**"],
      checks: ["Beat timings add up to the length", "The hook lands within 2 seconds", "On-screen text lines are 7 words or fewer"],
    };
    case "business-campaign": return {
      role: "festive retail marketing consultant for Indian small businesses (kirana stores, sweet shops, boutiques, salons, home bakers, D2C sellers) who plans honest, low-budget campaigns",
      success: `I get a ${name} campaign plan with dated actions from teaser to thank-you, ready-to-use copy for each channel, and simple ways to measure it, using only the offer I actually have.`,
      slots: [slot("business", "Business", "What do you sell and to whom?", "infer it from my goal"), slot("offer", "Offer", "What offer, if any, will you run? (We won't invent one.)", "no offer: plan value-led content and mark [YOUR OFFER] where one could go"), slot("location", "Location", "Where are you, and do you sell in-store, online or both?", "a single city in India, in-store plus WhatsApp orders"), AUD("local repeat customers and people buying gifts"), LANG, slot("budget", "Budget", "What can you spend?", "under ₹5,000, mostly time rather than ads")],
      steps: [
        `Write a one-line campaign idea that links ${name} to what I sell (gifting, preparing the home, getting ready, family meals) without discount-shouting`,
        `Build a timeline from teaser to after the festival, anchored to ${dateNote}: teaser, launch, reminder, festival day greeting, thank-you`,
        "Pick 3–4 channels that fit a small business: WhatsApp broadcast (only customers who opted in), Instagram, Google Business Profile post, in-store poster or counter card",
        "Write the copy for each channel in my language and tone",
        "Add an operations checklist: stock and staff for the busy days, delivery cut-off dates (use only dates I give), store hours on the festival day",
        "Define 3 simple measures I can count myself (WhatsApp enquiries, orders, footfall) and when to check them",
      ],
      constraints: [NO_INVENT_OFFER, "WhatsApp messages only to customers who opted in; include an easy opt-out line", "All claims must be true and checkable (no \"best in city\", no fake reviews)"],
      output: ["**Campaign idea** (one line)", "**Timeline** table: date | channel | message summary | goal", "**Copy pack**: WhatsApp (under 60 words) · Instagram caption · Google Business Profile post · poster headline (max 6 words) + subline", "**Ops checklist**", "**Measures** table: what to count | how | when"],
      checks: ["The offer appears exactly as I wrote it, or as [YOUR OFFER]", `Dates line up with ${dateNote}`, "Nothing claims urgency, scarcity or reviews that I didn't provide"],
    };
    case "product-promo": return {
      role: "conversion copywriter for Indian e-commerce and Instagram/WhatsApp shops who writes festive gifting copy that sells without hype",
      success: `I get ${name} promo copy for my product(s): headlines, a product description, a WhatsApp catalogue blurb, an Instagram caption and a photo brief, with no invented claims.`,
      slots: [slot("product", "Product", "Which product(s), with sizes and price?", "infer from my goal; use [PRICE] where a price is needed"), slot("offer", "Offer", "Any offer? (We won't invent one.)", "no offer; mark [YOUR OFFER] if useful"), AUD("people buying gifts for family and colleagues"), PLATFORM("Instagram and WhatsApp catalogue"), LANG],
      steps: [
        `Find the ${name} angle: who would buy this as a gift or for the celebration, and for which moment`,
        "Turn features into benefits for that moment (3 bullets)",
        "Write 3 headline options (max 8 words) and a product description (80–120 words)",
        "Write a WhatsApp catalogue blurb (under 40 words) and an Instagram caption with CTA",
        `Write a product photo brief with ${name} props (${motifs(f, 3)}) and space for text added later`,
        "List 3 likely customer questions (delivery, packaging, customisation) with answers using only details I gave, or [CHECK] placeholders",
      ],
      constraints: [NO_INVENT_OFFER, "No invented delivery promises, certifications, ingredients or health claims", "Prices only as I gave them, otherwise [PRICE]"],
      output: ["**Angle** (one line)", "**Headlines** (3)", "**Description**", "**WhatsApp blurb** · **Instagram caption**", "**Photo brief**", "**FAQ** table: question | answer"],
      checks: ["No invented numbers, offers or claims", "The description is 80–120 words", `Copy ties the product to a real ${name} moment`],
    };
    case "educational": return {
      role: "teacher and cultural educator who explains Indian festivals accurately, respectfully and at the right level for the audience",
      success: `I get an accurate, age-appropriate explainer on ${name} in the format I need, that notes regional differences and doesn't present any one version as the only one.`,
      slots: [slot("level", "Audience level", "Who is it for (class, age, or general readers)?", "middle-school students (around Class 6)"), slot("length", "Format and length", "Speech, essay or explainer, and how long?", "a 2-minute school assembly speech (about 250 words)"), LANG],
      steps: [
        `Say what ${name} is and who celebrates it, in plain words${f.regions.length ? ` (regions: ${f.regions.slice(0, 4).join(", ")})` : ""}`,
        "Tell the main story or meaning as it is commonly told, and say clearly that versions differ by region and family",
        "Describe how it is celebrated in 2–3 different places, without ranking them",
        "Draw out 2 values or lessons (e.g. gratitude, community) and one safety or eco-friendly tip that fits",
        "End with 3 quiz questions and answers for the audience",
      ],
      constraints: ["Only include widely accepted facts; if something is uncertain or disputed, say so or leave it out", "No invented rituals, dates, statistics or quotes", "Do not state muhurat or puja timings; say they vary and are given by local panchangs", "Respectful to all faiths; no comparisons that put one tradition above another"],
      output: ["**Title**", "**Script or text** in short paragraphs", "**Quiz** table: question | answer", "**Facts to double-check** (any line a teacher should verify)"],
      checks: ["Language suits the audience level", "Regional variation is acknowledged", "No made-up facts or timings"],
    };
    case "event-planning": return {
      role: "event planner who organises festive gatherings for families, offices, schools and housing societies in India, on realistic budgets",
      success: `I get a complete plan for a ${name} event: run of show, a countdown checklist, a budget table, food, inclusive activities, safety and an invite.`,
      slots: [slot("eventType", "Event", "What kind of event and who is hosting?", "a home gathering for family and friends"), slot("guests", "Guests", "How many guests, and any kids or elders?", "about 25 guests including kids and elders"), slot("budget", "Budget", "What's the budget?", "a modest budget; show low and mid options"), slot("location", "Venue / city", "Where is it?", "a home or society hall in an Indian city")],
      steps: [
        `Suggest a theme and a run of show with times for ${name}`,
        "Make a countdown checklist (2 weeks, 1 week, 2 days, on the day)",
        "Split the budget into a table using my number (label every cost as an estimate)",
        "Plan food with vegetarian, Jain and vegan options, and note allergy labelling",
        "Suggest 4 activities that include guests who don't celebrate the festival",
        "Add safety (diyas and fire, crowd, kids), noise and eco notes, then write a short invite",
      ],
      constraints: ["Costs are estimates with a range, never quoted as prices", "Activities must be inclusive and age-appropriate", "Follow local rules for firecrackers and noise; don't recommend unsafe practices"],
      output: ["**Run of show** table: time | what | who", "**Checklist** table: when | task | done?", "**Budget** table: item | low estimate | mid estimate", "**Food plan** · **Activities** · **Safety & eco** · **Invite text**"],
      checks: ["The budget adds up and stays within my number", "There are options for dietary needs", "Safety notes are included"],
    };
    case "image": return {
      role: "art director", success: "", slots: [], steps: [], constraints: [], output: [], checks: [],
    };
  }
}

const PLATFORM_ASPECT: [RegExp, string][] = [
  [/story|status|reel|shorts|vertical|whatsapp/i, "9:16"], [/instagram|linkedin|facebook post/i, "4:5"], [/youtube|banner|facebook cover|x \(twitter\)|twitter|email/i, "16:9"],
  [/poster|print|in-store/i, "2:3"], [/card/i, "5:7"], [/google business/i, "4:3"],
];

/** Visual extras for a festival image prompt (fed to buildVisual). */
export function festivalVisualExtra(c: FestivalContext, extra: Record<string, string>, goal: string): Record<string, string> {
  const f = c.festival;
  const product = extra.product?.trim();
  const business = extra.business?.trim();
  const scene = extra.subject?.trim() || [
    product ? `${product} styled for ${f.name}` : `a ${f.name} scene`,
    f.theme.motifs.length ? `with ${f.theme.motifs.slice(0, 4).join(", ")}` : "",
    business && !product ? `for a ${business}` : "",
  ].filter(Boolean).join(" ");
  const platform = extra.platform?.trim() || goal;
  const aspect = extra.aspect?.trim() || PLATFORM_ASPECT.find(([re]) => re.test(platform))?.[1] || "4:5";
  const careAvoid = [
    /Gurus/.test(f.care.join(" ")) ? "depictions of the Sikh Gurus, Gurmukhi script" : "",
    /Arabic script/.test(f.care.join(" ")) ? "Arabic script" : "",
    /Flag Code/.test(f.care.join(" ")) ? "torn or upside-down national flag" : "",
  ].filter(Boolean);
  return {
    subject: scene,
    style: extra.style?.trim() || (product ? "festive commercial product photography, true-to-life colours" : "warm festive editorial photography, authentic Indian setting, natural colours"),
    lighting: extra.lighting?.trim() || (/diya|lamp|lights|bonfire|lantern|moon/i.test(f.theme.motifs.join(" ")) ? "warm golden glow from lamps, soft bokeh in the background" : "soft natural daylight"),
    composition: extra.composition?.trim() || "clear focal point, clean empty space in the upper third for adding text later",
    aspect,
    // Care items first: Midjourney keeps only the first 6 negatives.
    avoid: extra.avoid?.trim() || [...careAvoid, "text", "letters", "logos", "watermark", "distorted hands", "misspelled greetings", "extra fingers"].join(", "),
  };
}

export const IMAGE_TEXT_NOTE = "AI image tools often render text imperfectly, so this prompt asks for no text and leaves space for it. Add your greeting or offer afterwards in Canva, Figma or any photo editor.";

/** A readable goal sentence from the festival builder fields. */
export function festivalGoalSentence(c: { festivalName: string; goal: FestivalGoal; audience?: string; language?: string; platform?: string; extra?: Record<string, string> }): string {
  const e = c.extra ?? {};
  const n = c.festivalName;
  const lang = c.language && c.language !== "English" ? ` in ${c.language}` : "";
  const on = c.platform ? ` for ${c.platform}` : "";
  const forWho = e.recipient ? ` for ${e.recipient}` : c.audience ? ` for ${c.audience}` : "";
  const biz = e.business ? ` for my ${e.business}` : "";
  switch (c.goal) {
    case "greeting": return `Write ${n} greetings${forWho}${on}${lang}`;
    case "personal-message": return `Write a personal ${n} message${forWho}${lang}`;
    case "social-post": return `Create a ${n} social media post${biz}${on}${lang}`;
    case "reel": return `Write a ${n} Reel script${biz}${on}${lang}`;
    case "business-campaign": return `Plan a ${n} marketing campaign${biz || " for my small business"}${e.location ? ` in ${e.location}` : ""}${lang}`;
    case "product-promo": return `Write ${n} promotion copy for ${e.product || "my product"}${on}${lang}`;
    case "educational": return `Explain ${n}${e.level ? ` for ${e.level}` : c.audience ? ` for ${c.audience}` : " for students"}${lang}`;
    case "event-planning": return `Plan a ${e.eventType || `${n} celebration`}${e.guests ? ` for ${e.guests}` : ""}${lang}`;
    case "image": return `Create an image prompt for a ${n} ${e.product ? `${e.product} photo` : "poster"}${on}`;
  }
}

// ------------------------------------------------------------------ free-text festival intent
/** Aliases too ambiguous to trigger festival mode from free text (e.g. "khichdi" recipes). */
const AMBIGUOUS_ALIASES = new Set(["khichdi", "sakat", "bhogi", "padwa", "maghi", "26 january", "christmas day", "new year's day"]);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/['’]/g, "['’]?").replace(/[\s-]+/g, "[\\s-]*");

interface NameMatcher { slug: string; re: RegExp; len: number }
let matchers: NameMatcher[] | null = null;
function festivalMatchers(): NameMatcher[] {
  if (matchers) return matchers;
  const out: NameMatcher[] = [];
  for (const f of FESTIVALS) {
    const names = new Set([f.name, ...f.name.split(/\s*&\s*/), ...f.aliases].map((n) => n.trim()).filter((n) => n.length > 2 && !AMBIGUOUS_ALIASES.has(n.toLowerCase())));
    if (f.slug === "christmas") names.add("Xmas");
    for (const n of names) out.push({ slug: f.slug, re: new RegExp(`(?:^|[^a-z0-9])${esc(n)}(?:'s)?(?=$|[^a-z0-9])`, "i"), len: n.length });
  }
  matchers = out.sort((a, b) => b.len - a.len); // longest name first ("Gudi Padwa" before "Padwa", "Gujarati New Year" before "New Year")
  return matchers;
}

/** First festival named in the text (by name or alias), or null. */
export function findFestivalInText(text: string): Festival | null {
  for (const m of festivalMatchers()) if (m.re.test(text)) return FESTIVALS.find((f) => f.slug === m.slug) ?? null;
  return null;
}

const has = (t: string, re: RegExp) => re.test(t);
const SALE = /\b(sale|sales|offer|offers|discount|discounts|deal|deals|promo|promotion|promotional|clearance)\b/i;
const POSTISH = /\b(post|posts|caption|captions|story|stories|status|carousel|ad|ads|tweet)\b/i;

/** Which festival goal a free-text request asks for, or null if it only mentions the festival. */
export function festivalGoalFromText(t: string): FestivalGoal | null {
  if (has(t, /\b(essay|speech|explain|explainer|history|significance|meaning|why (do |is |we )|story of|quiz|lesson|for (kids|students|class))\b/i)) return "educational";
  if (has(t, /\b(reel|reels|shorts|tiktok|video|videos)\b/i)) return "reel";
  if (has(t, /\b(poster|banner|flyer|image|picture|photo|wallpaper|thumbnail|illustration|graphic)\b/i)) return "image";
  if (has(t, /\b(campaign|marketing|strategy)\b/i)) return "business-campaign";
  if (has(t, POSTISH)) return "social-post";
  if (has(t, /\b(product description|gift box|hamper|catalogue|catalog|product copy)\b/i)) return "product-promo";
  if (has(t, SALE)) return "business-campaign";
  if (has(t, /\b(greeting|greetings|wish|wishes|wishing|card|cards|message|messages|msg|shayari|quote|quotes|happy)\b/i)) return "greeting";
  if (has(t, /\b(letter|note to)\b/i)) return "personal-message";
  if (has(t, /\b(party|event|celebration|decor|decoration|menu|games|potluck|puja at (home|office))\b/i)) return "event-planning";
  return null;
}

const PLATFORM_WORDS: [RegExp, string][] = [
  [/\binstagram|\binsta\b|\big\b/i, "Instagram"], [/\bwhats ?app\b/i, "WhatsApp"], [/\bfacebook|\bfb\b/i, "Facebook"], [/\blinked ?in\b/i, "LinkedIn"],
  [/\byoutube|\bshorts\b/i, "YouTube Shorts"], [/\btwitter\b|\btweet\b|\bon x\b/i, "X (Twitter)"], [/\bgoogle business\b/i, "Google Business Profile"], [/\bemail\b/i, "Email"],
];
const RECIPIENT = /\b(mom|mother|maa|mummy|dad|father|papa|parents|sister|brother|bhai|didi|wife|husband|son|daughter|friend|friends|family|grandparents|nani|dadi|in-laws|boss|team|colleagues|clients|customers|teacher)\b/i;

/** Parse a one-line request like "Diwali sale post for my boutique in Mohali, Hinglish, Instagram" into festival builder fields. */
export function detectFestivalIntent(goal: string): { festival: Festival; goal: FestivalGoal; extra: Record<string, string>; language?: string } | null {
  const t = goal.trim();
  if (!t) return null;
  const festival = findFestivalInText(t);
  if (!festival) return null;
  const g = festivalGoalFromText(t);
  if (!g || !festival.goals.includes(g)) return null;
  const extra: Record<string, string> = { festival: festival.slug, fgoal: g };
  const platform = PLATFORM_WORDS.find(([re]) => re.test(t))?.[1];
  if (platform) extra.platform = platform;
  if (g === "social-post" && SALE.test(t)) extra.promo = "1";
  const forWho = t.match(/\bfor (?:my|our|the) ([a-z][a-z &'-]{1,40}?)(?=\s+(?:in|at|on|from|with)\b|[,.;!?]|$)/i)?.[1]?.trim();
  if (forWho) {
    if ((g === "greeting" || g === "personal-message") && RECIPIENT.test(forWho)) extra.recipient = forWho;
    else if (g !== "greeting" && g !== "personal-message" && g !== "educational") extra.business = forWho;
    else extra.recipient = forWho;
  }
  const loc = t.match(/\b(?:in|at|from) ([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?)\b/)?.[1];
  if (loc && !(FESTIVAL_LANGUAGES as readonly string[]).includes(loc) && !PLATFORM_WORDS.some(([re]) => re.test(loc))) extra.location = loc;
  const lang = FESTIVAL_LANGUAGES.find((l) => l !== "English" && new RegExp(l === "Hinglish" ? "\\bhinglish\\b" : `(?:\\bin ${l}\\b|(?:^|,)\\s*${l}\\s*(?:,|$)|\\b${l} (?:language|mein|me)\\b)`, "i").test(t));
  return { festival, goal: g, extra, ...(lang ? { language: lang } : {}) };
}
