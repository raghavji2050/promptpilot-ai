/**
 * SEO topic pages: one festival × one use case each, with hand-written guidance (no invented stats or trends).
 * The sample prompt on each page is generated live by the festival engine from `sample`.
 */
import type { FestivalGoal } from "@/lib/festivals";

export interface FestivalTopic {
  festival: string;
  topic: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  tips: string[];
  sample: { goal: FestivalGoal; platform?: string; language?: string; audience?: string; extra?: Record<string, string>; targetId?: string };
  variations: { label: string; goal: FestivalGoal; platform?: string; lang?: string }[];
  faqs: { q: string; a: string }[];
}

export const FESTIVAL_TOPICS: FestivalTopic[] = [
  {
    festival: "diwali", topic: "instagram-captions",
    title: "Diwali Instagram Caption & Post Prompts (Free AI Prompt Builder)",
    description: "Free Diwali Instagram prompt for ChatGPT, Claude or Gemini: hook, caption, CTA, hashtags, alt text and story ideas for your account. English, Hindi or Hinglish.",
    h1: "Diwali Instagram caption and post prompts",
    intro: "Most Diwali posts look the same: a diya, a logo and \"Happy Diwali\". This page builds a prompt that makes the AI connect Diwali to your account, whether that's a bakery's late-night mithai prep, a designer's rangoli palette or a creator's first Diwali in a new city.",
    tips: [
      "Lead with a specific first line (under 12 words) that only your account could post, not a generic wish",
      "Pick one angle (behind the scenes, a useful tip, a gifting idea) instead of cramming everything into one caption",
      "Use 5–8 hashtags that mix Diwali tags with your niche and city; skip unrelated popular tags",
      "Write alt text so the post is accessible to people using screen readers",
      "Reuse the same idea as a carousel and 3 story frames, so one prompt covers a week of content",
    ],
    sample: { goal: "social-post", platform: "Instagram", audience: "home bakers and dessert lovers in Pune", extra: { business: "home bakery" } },
    variations: [
      { label: "Hinglish caption", goal: "social-post", platform: "Instagram", lang: "Hinglish" },
      { label: "Diwali Reel script", goal: "reel", platform: "Instagram" },
      { label: "Post image prompt (4:5)", goal: "image", platform: "Instagram" },
    ],
    faqs: [
      { q: "Does this write the caption for me?", a: "No. It writes a detailed prompt you paste into ChatGPT, Claude, Gemini or Grok, which then writes the caption. PromptPilot itself doesn't call any AI." },
      { q: "Will the AI tell me the best time to post?", a: "The prompt asks it not to claim a universal best time and to tell you to check your Instagram Insights instead, because the right time depends on your followers." },
      { q: "Can I get the caption in Hindi or Hinglish?", a: "Yes. Pick the language in the builder; the prompt tells the AI to write natural Hindi in Devanagari or Hinglish in Latin script rather than a word-for-word translation." },
    ],
  },
  {
    festival: "diwali", topic: "greeting-cards",
    title: "Diwali Greeting Card Message Prompts: Family, Clients & Colleagues",
    description: "Free Diwali greeting prompt: 6 card and WhatsApp messages in your language, formal versions for elders and clients, no clichés, plus a card image prompt.",
    h1: "Diwali greeting card message prompts",
    intro: "A good Diwali card sounds like you wrote it for that person. This prompt makes the AI pick the right register (aap and ji for elders, warm for friends, polite for clients), use concrete Diwali images instead of stock phrases, and leave room for a personal detail.",
    tips: [
      "Decide who the card is for first: elders, friends, colleagues and clients each need a different tone",
      "Replace \"joy and prosperity\" with something concrete: the first diya you light, the rangoli at the door, the mithai box you share",
      "Keep WhatsApp versions under 20 words and card versions to 40–60 words",
      "Add one real detail (a first Diwali together, a family member far away) to make it personal",
      "Generate the card design separately with an image prompt, and add the text in Canva or a similar editor",
    ],
    sample: { goal: "greeting", platform: "Greeting card / print", audience: "family elders, close friends and business clients" },
    variations: [
      { label: "Messages in Hindi", goal: "greeting", platform: "WhatsApp", lang: "Hindi" },
      { label: "Card image prompt (5:7)", goal: "image", platform: "Greeting card / print" },
      { label: "Personal message to parents", goal: "personal-message" },
    ],
    faqs: [
      { q: "Can AI put the greeting text on the card image?", a: "Image tools often misspell or distort text, so our image prompt asks for no text and leaves clean space. Add your message afterwards in Canva, Figma or any editor." },
      { q: "Are the greetings religious?", a: "The prompt keeps them to common festive wishes and tells the AI not to add religious claims, and to remember that Jain, Sikh and Buddhist families mark the day differently." },
      { q: "Is it free?", a: "Yes. Building the prompt is free and needs no sign-up. You run it in your own AI tool." },
    ],
  },
  {
    festival: "diwali", topic: "small-business-marketing",
    title: "Diwali Marketing Prompts for Small Businesses (Honest, No Fake Offers)",
    description: "Plan a Diwali shop campaign with AI: dated timeline, WhatsApp, Instagram and Google Business Profile copy, poster lines. The prompt never invents discounts.",
    h1: "Diwali marketing prompts for small businesses",
    intro: "Many Indian shops plan around Diwali, from sweet shops and boutiques to home bakers and salons. This prompt asks the AI for a complete, honest plan: a timeline anchored to the real Diwali dates, copy for each channel, an operations checklist and simple numbers to track. It uses your offer exactly as written, or a placeholder if you don't have one.",
    tips: [
      "Tie the campaign to a real Diwali moment for your customers: gifting, preparing the home, getting ready, family meals",
      "Plan from teaser to thank-you, and post the greeting on the festival day without a sales pitch",
      "Send WhatsApp broadcasts only to customers who opted in, with an easy opt-out line",
      "Never add discounts, deadlines or reviews you don't actually have; customers notice",
      "Count something simple each day (enquiries, orders, footfall) so you know what worked next year",
    ],
    sample: { goal: "business-campaign", platform: "WhatsApp", language: "Hinglish", audience: "repeat customers and office gift buyers", extra: { business: "sweet shop", location: "Indore" } },
    variations: [
      { label: "Product promo copy", goal: "product-promo", platform: "Instagram" },
      { label: "Product photo prompt", goal: "image", platform: "Instagram" },
      { label: "Dhanteras campaign", goal: "business-campaign", platform: "WhatsApp" },
    ],
    faqs: [
      { q: "Will the AI make up a discount for my shop?", a: "No. The prompt forbids inventing discounts, prices, free gifts, deadlines or testimonials. If you don't enter an offer, the copy is value-led and marks where an offer could go as [YOUR OFFER]." },
      { q: "Which dates does the plan use?", a: "The prompt includes the Diwali dates in India from central government holiday lists and Drik Panchang (Dhanteras 6 Nov to Bhai Dooj 11 Nov 2026, main day 8 Nov). Check local practice for your region." },
      { q: "Can I use it for Dhanteras or Bhai Dooj too?", a: "Yes. Open the Dhanteras or Bhai Dooj studio, or pick that festival in the builder." },
    ],
  },
  {
    festival: "dussehra", topic: "reels",
    title: "Dussehra Reel Script Prompts: Hooks, Shots & Captions",
    description: "Free Dussehra Reel prompt: 2-second hooks, timed beats, on-screen text, voiceover and a phone-friendly shot list for creators and brands. Hindi or English.",
    h1: "Dussehra Reel script prompts",
    intro: "Dussehra is celebrated very differently across India: Ramlila and Ravan Dahan in the North, the Mysuru Dasara procession, Kullu's week-long fair and Bengal's Bijoya Dashami. This prompt gives the AI that context and asks for a Reel you can shoot on a phone in under an hour.",
    tips: [
      "Show the payoff in the first 2 seconds: on-screen text of 7 words or fewer, plus a strong visual",
      "Film real local moments (a Ramlila stage, a fair at dusk, marigold garlands) rather than stock-looking shots",
      "Keep Ravan Dahan imagery symbolic and stay safe around fire and crowds",
      "Choose audio inside Instagram or YouTube; don't rely on someone telling you a song is trending",
      "Write the caption last, with one clear CTA",
    ],
    sample: { goal: "reel", platform: "Instagram", language: "Hindi", extra: { business: "travel creator in Delhi", length: "30 seconds" } },
    variations: [
      { label: "Dussehra Instagram post", goal: "social-post", platform: "Instagram" },
      { label: "Dussehra greetings", goal: "greeting", platform: "WhatsApp" },
      { label: "School explainer", goal: "educational" },
    ],
    faqs: [
      { q: "When is Dussehra in 2026?", a: "Tuesday, 20 October 2026, per the central government holiday list and Drik Panchang. In Bengal, Bijoya Dashami (Durga visarjan) falls on 21 October." },
      { q: "Will the script use copyrighted songs?", a: "No. The prompt asks the AI to suggest a type of audio and tells you to pick a track from the app's own library." },
      { q: "Does it work for YouTube Shorts?", a: "Yes. Choose YouTube Shorts as the platform in the builder." },
    ],
  },
  {
    festival: "karwa-chauth", topic: "greetings",
    title: "Karwa Chauth Wishes & Message Prompts (Hindi, Punjabi, English)",
    description: "Write Karwa Chauth wishes for your wife, husband, friends or customers with AI. Personal, inclusive messages in Hindi, Punjabi, Hinglish or English.",
    h1: "Karwa Chauth wishes and message prompts",
    intro: "Karwa Chauth messages land best when they're personal and kind. This prompt asks the AI for short and card-length wishes built around real images of the day (the moonrise, the sieve and diya, mehendi), and to stay inclusive: not everyone fasts, and nobody should be made to feel bad either way.",
    tips: [
      "Write for one person at a time; a wife, a husband, a friend and a customer each need different words",
      "Use one real detail (your first Karwa Chauth, waiting for the moon together) instead of filmy lines",
      "Keep it inclusive: many couples share the fast or don't fast at all",
      "Don't give health advice about fasting",
      "Moonrise times vary by city, so don't put a time in a message unless you've checked it locally",
    ],
    sample: { goal: "greeting", platform: "WhatsApp", language: "Hindi", extra: { recipient: "my wife", details: "our first Karwa Chauth after moving to Bengaluru" } },
    variations: [
      { label: "Wishes in Punjabi", goal: "greeting", platform: "WhatsApp", lang: "Punjabi" },
      { label: "Boutique/salon promo", goal: "product-promo", platform: "Instagram" },
      { label: "Moonrise image prompt (9:16)", goal: "image", platform: "WhatsApp" },
    ],
    faqs: [
      { q: "When is Karwa Chauth in 2026?", a: "Thursday, 29 October 2026, per the central government restricted holiday list (as Karaka Chaturthi), Drik Panchang and timeanddate. Moonrise time depends on your city." },
      { q: "Can I write wishes for my husband too?", a: "Yes. Type who the wishes are for in \"Who is it for?\" and the prompt adapts." },
      { q: "Is the prompt respectful of different families' customs?", a: "It tells the AI not to invent rituals, not to shame anyone for fasting or not fasting, and to keep the wording inclusive." },
    ],
  },
  {
    festival: "chhath-puja", topic: "social-media",
    title: "Chhath Puja Social Media Post Prompts: Respectful Captions & Stories",
    description: "Free Chhath Puja post prompts for Instagram and Facebook: respectful captions, carousels and stories that honour the festival's observances. Hindi or English.",
    h1: "Chhath Puja social media post prompts",
    intro: "Chhath Puja is a festival of thanks to the Sun, observed with strict fasting and arghya at rivers and ponds, especially in Bihar, Jharkhand and eastern Uttar Pradesh, and by families from these regions everywhere. This prompt asks the AI for posts that respect those observances, avoid trivialising them and encourage clean ghats without lecturing.",
    tips: [
      "Lead with devotion and family, not sales; Chhath audiences notice tone",
      "Use real imagery: the riverbank at sunset, bamboo soop with fruits, thekua, lamps on water",
      "Don't joke about the fast or suggest shortcuts",
      "If you mention eco-friendly offerings or clean ghats, keep it gentle",
      "Families far from home are a big audience; a post for them can mean a lot",
    ],
    sample: { goal: "social-post", platform: "Facebook", language: "Hindi", audience: "families from Bihar living in other cities", extra: { business: "community page for Bihari families in Mumbai" } },
    variations: [
      { label: "Chhath greetings", goal: "greeting", platform: "WhatsApp" },
      { label: "Ghat sunrise image prompt", goal: "image", platform: "Instagram" },
      { label: "Explainer for students", goal: "educational" },
    ],
    faqs: [
      { q: "When is Chhath Puja in 2026?", a: "The main evening arghya (Surya Shashthi) is on Sunday, 15 November 2026, per the central government restricted holiday list, Drik Panchang and timeanddate. Chhath spans several days; we haven't verified the other days' dates, so the prompt doesn't state them." },
      { q: "Can I write it in Bhojpuri or Maithili?", a: "Choose \"Other\" in the language list and type the language. The prompt asks the AI to say if it isn't confident and to add an English version." },
      { q: "Will it suggest rituals?", a: "No. The prompt tells the AI not to invent rituals and to say that traditions vary by family." },
    ],
  },
  {
    festival: "guru-nanak-jayanti", topic: "greetings",
    title: "Guru Nanak Jayanti (Gurpurab) Wishes & Message Prompts",
    description: "Respectful Gurpurab wishes with AI for family, friends and colleagues in Punjabi, Hindi or English. Image prompts avoid depicting the Gurus or Gurmukhi text.",
    h1: "Guru Nanak Jayanti (Gurpurab) wishes and message prompts",
    intro: "Guru Nanak Jayanti marks the birth anniversary of Guru Nanak Dev Ji, the first Sikh Guru, with prabhat pheris, kirtan and langar. This prompt asks the AI for warm, respectful wishes centred on seva, equality and community, and its image prompts avoid depicting the Gurus or generating Gurmukhi script.",
    tips: [
      "Keep the focus on seva, equality and togetherness rather than sales",
      "Use simple, respectful language; formal versions for elders",
      "For images, use gurdwara lights, langar and lamps instead of depicting the Gurus",
      "Avoid AI-generated Gurmukhi or sacred symbols, which tools often distort",
      "If you quote Gurbani, use a source you trust; the prompt tells the AI not to invent quotes",
    ],
    sample: { goal: "greeting", platform: "WhatsApp", language: "Punjabi", audience: "family, friends and colleagues" },
    variations: [
      { label: "Wishes in Hindi", goal: "greeting", platform: "WhatsApp", lang: "Hindi" },
      { label: "Gurdwara lights image prompt", goal: "image", platform: "WhatsApp" },
      { label: "Langar seva event plan", goal: "event-planning" },
    ],
    faqs: [
      { q: "When is Guru Nanak Jayanti in 2026?", a: "Tuesday, 24 November 2026, a gazetted central government holiday (also listed by India Post and timeanddate)." },
      { q: "Why don't the image prompts show Guru Nanak Dev Ji?", a: "Many Sikhs consider AI depictions of the Gurus inappropriate, and AI tools often distort sacred script and symbols, so the prompts use other motifs." },
      { q: "Can the wishes be in Gurmukhi?", a: "Yes. Choose Punjabi; the prompt asks the AI to write in Punjabi's own script and to say if it isn't confident." },
    ],
  },
  {
    festival: "christmas", topic: "marketing",
    title: "Christmas Marketing Prompts for Indian Small Businesses",
    description: "Plan a Christmas campaign for your café, bakery or shop in India: timeline to 25 December, WhatsApp, Instagram and Google Business copy. No invented offers.",
    h1: "Christmas marketing prompts for small businesses in India",
    intro: "Christmas is celebrated across India with carols, stars, plum cake and family meals, and it's especially big in Goa, Kerala and the North-East. For bakeries, cafés, gift shops and decor sellers, this prompt plans an honest Christmas campaign with dated actions up to 25 December, copy for each channel and an operations checklist.",
    tips: [
      "Build around real Christmas moments in your city: midnight Mass, cake orders, office parties, family lunches",
      "Set order cut-off dates you can actually meet and say them clearly",
      "Respect the religious meaning for Christian customers while keeping messages welcoming for everyone",
      "Use your real offer, or none; never invent discounts or deadlines",
      "Plan staffing for 24–25 December before you promote",
    ],
    sample: { goal: "business-campaign", platform: "Instagram", audience: "families and offices ordering cakes", extra: { business: "bakery", location: "Shillong", offer: "pre-order plum cakes by 20 December" } },
    variations: [
      { label: "Plum cake promo copy", goal: "product-promo", platform: "Instagram" },
      { label: "Christmas Instagram post", goal: "social-post", platform: "Instagram" },
      { label: "Office party plan", goal: "event-planning" },
    ],
    faqs: [
      { q: "Is the offer in the sample real?", a: "It's an example input to show how your own offer flows into the prompt exactly as written. The prompt never adds discounts or deadlines you didn't enter." },
      { q: "Does it work for New Year too?", a: "Yes. Open the New Year studio or pick New Year in the builder." },
      { q: "Can I write the copy in Malayalam, Konkani or Khasi?", a: "Pick Malayalam from the list or choose \"Other\" and type the language. The prompt asks the AI to say if it isn't confident and to add an English version." },
    ],
  },
];

export function getTopic(festival: string, topic: string) {
  return FESTIVAL_TOPICS.find((t) => t.festival === festival && t.topic === topic);
}
export function topicsFor(festival: string) {
  return FESTIVAL_TOPICS.filter((t) => t.festival === festival);
}
