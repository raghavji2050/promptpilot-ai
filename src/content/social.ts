import type { LibraryItem, Source } from "./types";

/**
 * Trend labels policy:
 *  - "current": a dated third-party source reported it recently. Sources required. We do NOT
 *    have view counts or measured popularity; we only repeat what the cited pages say.
 *  - "seasonal": tied to a date or festival. No popularity claim.
 *  - "evergreen": a format that keeps working; no claim it is trending now.
 * All prompts below were written for PromptPilot (not copied from the sources).
 */
const VERIFIED = "2026-10-17";
const QPC: Source = { label: "Quick Prompt Co. (Oct 2026)", url: "https://quickpromptco.com/viral-ai-photo-trend-prompts/" };
const TPM: Source = { label: "The Prompt Master (16 Oct 2026)", url: "https://thepromptmaster.net/ai-multiverse-persona-trend/" };

const KEEP_FACE = "Keep the exact same face, facial features, skin tone and expression as the uploaded photo. Do not change the person's identity.";

const S = (x: Omit<LibraryItem, "kind">): LibraryItem => ({ kind: "social", ...x });

export const SOCIAL_PROMPTS: LibraryItem[] = [
  S({
    slug: "80s-yearbook-portrait", title: "80s yearbook portrait", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["retro", "80s", "portrait"],
    summary: "Turn a selfie into a 1980s school yearbook photo.", requiresPhoto: true, aspect: "4:5",
    trend: { status: "current", note: "Reported as a Reels/Shorts trend in September–October 2026 by the cited source. No independent view data.", sources: [QPC], lastVerified: VERIFIED },
    body: `Transform the uploaded photo into a 1980s American high-school yearbook portrait. ${KEEP_FACE}
Style: soft studio lighting, mottled blue laser-style backdrop, slightly faded warm film colors, subtle film grain, era-appropriate hairstyle and clothing (big hair, denim jacket or patterned sweater).
Framing: head-and-shoulders, centered, slight smile. Aspect ratio 4:5.
No text, no watermark.`,
  }),
  S({
    slug: "multiverse-persona-carousel", title: "Multiverse persona carousel (10 versions of you)", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["carousel", "persona", "instagram"],
    summary: "One selfie, ten alternate-life personas in a grid for a carousel.", requiresPhoto: true, aspect: "4:5",
    trend: { status: "current", note: "Reported on 16 Oct 2026 by the cited source (it cites one carousel's likes; we have not verified those numbers).", sources: [TPM], lastVerified: VERIFIED },
    body: `Using the uploaded photo, create a 2×5 grid of ten panels showing the same person as ten different personas: astronaut, chef, rock musician, 1920s detective, doctor, farmer, pop star, medieval knight, scientist, street artist.
Rules for every panel: ${KEEP_FACE} Keep the same pose (standing, facing camera, slight smile) and the same background (city park, warm golden-hour light). Only the outfit, props and hairstyle change.
Each panel the same size with a thin white border. No text.`,
  }),
  S({
    slug: "halloween-zombie-makeup", title: "Halloween zombie makeup portrait", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["halloween", "seasonal"],
    summary: "Cinematic zombie makeup look for October profile pictures.", requiresPhoto: true, aspect: "4:5",
    trend: { status: "seasonal", note: "Halloween (October). Listed by the cited source among October 2026 trends.", sources: [QPC], lastVerified: VERIFIED },
    body: `Apply realistic film-quality zombie special-effects makeup to the person in the uploaded photo. ${KEEP_FACE} The person must stay recognisable under the makeup.
Details: pale grey-green skin, subtle cracked texture, dark sunken eyes, light fake blood at the lip corner, torn clothing. Moody blue-green night lighting with fog. Horror movie poster feel, not gory. Aspect ratio 4:5.`,
  }),
  S({
    slug: "diwali-festive-portrait", title: "Diwali festive portrait", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["diwali", "festival", "india"],
    summary: "Warm diya-lit festive portrait in traditional wear.", requiresPhoto: true, aspect: "4:5",
    trend: { status: "seasonal", note: "Recurring festival theme. We make no claim about its current popularity.", sources: [], lastVerified: VERIFIED },
    body: `Edit the uploaded photo into a festive Diwali portrait. ${KEEP_FACE}
Outfit: elegant traditional Indian wear (silk kurta or saree in deep maroon and gold).
Setting: home balcony at dusk with rows of lit clay diyas, marigold garlands and soft bokeh fairy lights.
Lighting: warm candle glow on the face, natural skin texture. Aspect ratio 4:5. No text.`,
  }),
  S({
    slug: "collectible-figurine-box", title: "1/7 scale collectible figurine", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["figurine", "toy", "3d"],
    summary: "You as a boxed collector's figure on a desk.", requiresPhoto: true, aspect: "1:1",
    trend: { status: "evergreen", note: "Described by the cited source as the original 'Nano Banana' trend; treat as an established format, not a current spike.", sources: [QPC], lastVerified: VERIFIED },
    body: `Create a photorealistic 1/7 scale collectible figure of the person in the uploaded photo, standing on a round clear acrylic base on a wooden desk. ${KEEP_FACE}
Next to it: the figure's retail box with original artwork of the same character, and a computer monitor showing the 3D modelling software view of the figure.
Soft indoor daylight, shallow depth of field, product photography style. Aspect ratio 1:1.`,
  }),
  S({
    slug: "action-figure-blister-pack", title: "Action figure in a blister pack", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["toy", "action-figure"],
    summary: "Toy packaging with your own accessories.", requiresPhoto: true, aspect: "4:5",
    trend: { status: "evergreen", note: "Established format.", sources: [], lastVerified: VERIFIED },
    body: `Turn the person in the uploaded photo into a plastic action figure sealed in a toy blister pack. ${KEEP_FACE}
Packaging: bright card backing with the name "[YOUR NAME]" at the top and a tagline "[YOUR TAGLINE]". Accessories in separate plastic slots: [accessory 1], [accessory 2], [accessory 3].
Studio product lighting, glossy plastic reflections. Aspect ratio 4:5.`,
  }),
  S({
    slug: "blockbuster-movie-poster", title: "Blockbuster movie poster", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["poster", "cinematic"],
    summary: "You as the lead in a movie poster with your own title.", requiresPhoto: true, aspect: "2:3",
    trend: { status: "evergreen", note: "Established format.", sources: [], lastVerified: VERIFIED },
    body: `Create a cinematic movie poster starring the person in the uploaded photo. ${KEEP_FACE}
Genre: [action / romance / thriller]. Title text: "[MOVIE TITLE]" in bold cinematic typography at the bottom, with a tagline "[TAGLINE]" and small credit-block text.
Dramatic teal-and-orange color grade, rim lighting, epic background matching the genre. Aspect ratio 2:3.`,
  }),
  S({
    slug: "1970s-polaroid", title: "1970s Polaroid snapshot", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["retro", "polaroid", "couple"],
    summary: "Instant-film nostalgia for solo, couple or family photos.", requiresPhoto: true, aspect: "1:1",
    trend: { status: "evergreen", note: "Established nostalgic format.", sources: [], lastVerified: VERIFIED },
    body: `Recreate the uploaded photo as a 1970s Polaroid instant photo. ${KEEP_FACE} (applies to every person in the photo)
Look: faded warm colors, slight vignette, soft focus, light chemical streaks, white Polaroid frame with a thicker bottom border. Casual candid feel. Aspect ratio 1:1 inside the frame.`,
  }),
  S({
    slug: "90s-disposable-flash", title: "90s disposable camera flash", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["retro", "90s", "party"],
    summary: "Messy direct-flash party photo look.", requiresPhoto: true, aspect: "3:2",
    trend: { status: "evergreen", note: "Established aesthetic.", sources: [], lastVerified: VERIFIED },
    body: `Restyle the uploaded photo to look like it was taken on a cheap 1990s disposable film camera with direct flash. ${KEEP_FACE}
Look: harsh on-camera flash, dark falloff in the background, slightly overexposed skin highlights, visible grain, orange date stamp in the bottom-right corner reading "[DATE]". Aspect ratio 3:2.`,
  }),
  S({
    slug: "linkedin-headshot", title: "Professional LinkedIn headshot", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["professional", "headshot", "linkedin"],
    summary: "Clean corporate headshot from a casual photo.", requiresPhoto: true, aspect: "1:1",
    trend: { status: "evergreen", note: "Always-useful format.", sources: [], lastVerified: VERIFIED },
    body: `Turn the uploaded photo into a professional headshot suitable for LinkedIn. ${KEEP_FACE} Keep natural skin texture; no heavy retouching or face slimming.
Outfit: [navy blazer over white shirt]. Background: plain soft grey studio backdrop. Lighting: soft key light from the left with gentle fill. Framing: head and shoulders, eyes at upper third. Aspect ratio 1:1.`,
  }),
  S({
    slug: "restore-old-photo", title: "Restore and colorize an old photo", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["restoration", "family"],
    summary: "Fix scratches, fading and add natural color.", requiresPhoto: true,
    trend: { status: "evergreen", note: "Always-useful format.", sources: [], lastVerified: VERIFIED },
    body: `Restore the uploaded old photograph. Remove scratches, dust, creases and stains; fix fading and contrast; sharpen gently.
Then colorize it with natural, period-appropriate colors. ${KEEP_FACE} Do not add or remove people or objects, and do not change clothing or background details. Keep the original framing.`,
  }),
  S({
    slug: "golden-hour-street-portrait", title: "Golden hour street portrait", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["portrait", "aesthetic", "instagram"],
    summary: "Warm, cinematic feed-ready portrait.", requiresPhoto: true, aspect: "4:5",
    trend: { status: "evergreen", note: "Established aesthetic.", sources: [], lastVerified: VERIFIED },
    body: `Edit the uploaded photo into a cinematic golden-hour street portrait. ${KEEP_FACE}
Setting: a quiet old-city street with warm sunlight low behind the subject, creating soft rim light on the hair. Background softly blurred (shallow depth of field, 85mm lens look). Subtle Kodak Portra-style film tones and fine grain. Aspect ratio 4:5.`,
  }),
  S({
    slug: "cinematic-couple-still", title: "Cinematic couple film still", category: "Photo edit", targets: ["gemini", "chatgpt"], tags: ["couple", "cinematic"],
    summary: "Ordinary couple photo → movie frame.", requiresPhoto: true, aspect: "16:9",
    trend: { status: "evergreen", note: "Established format.", sources: [], lastVerified: VERIFIED },
    body: `Turn the uploaded couple photo into a still frame from a romantic film. Keep both people's exact faces, features, skin tones and expressions unchanged.
Scene: [rainy city street at night with neon reflections / beach at sunset]. Anamorphic widescreen look with subtle lens flare, soft film grain, letterbox bars. Aspect ratio 16:9 (2.39:1 inside the letterbox).`,
  }),
  S({
    slug: "reel-cover-bold-text", title: "Reel cover with bold title", category: "Image", targets: ["image-generic", "midjourney"], tags: ["reel-cover", "instagram"],
    summary: "Scroll-stopping 9:16 cover image for a Reel.", aspect: "9:16",
    trend: { status: "evergreen", note: "Format guidance only.", sources: [], lastVerified: VERIFIED },
    body: `A vertical 9:16 Reel cover image: [subject, e.g. a steaming cup of masala chai on a wooden table], bold minimal composition with large empty space in the top third for a title. Vibrant but natural colors, soft side light, high contrast subject against a clean background. If the model supports text, add the title "[TITLE]" in thick sans-serif at the top; otherwise leave the space empty.`,
  }),
  S({
    slug: "product-flatlay", title: "Aesthetic product flat-lay", category: "Image", targets: ["image-generic", "midjourney"], tags: ["product", "small-business"],
    summary: "Clean overhead product shot for small-business posts.", aspect: "4:5",
    trend: { status: "evergreen", note: "Format guidance only.", sources: [], lastVerified: VERIFIED },
    body: `Overhead flat-lay product photo of [your product] on a [linen / terrazzo / pastel paper] surface, surrounded by a few related props ([prop 1], [prop 2]) with plenty of negative space. Soft diffused daylight from a window, gentle shadows, true-to-life colors. Aspect ratio 4:5. No text, no logos other than the product's own.`,
  }),
  S({
    slug: "slow-motion-food-reel", title: "Slow-motion food Reel (video)", category: "Video", targets: ["video"], tags: ["food", "reel", "video"],
    summary: "8-second appetising close-up for Reels/Shorts.", aspect: "9:16",
    trend: { status: "evergreen", note: "Format guidance only.", sources: [], lastVerified: VERIFIED },
    body: `Shot: extreme close-up
Subject & action: [hot ghee being poured over a stack of fresh parathas], steam rising, slow motion
Camera: slow dolly in
Setting: rustic kitchen counter, warm morning window light
Style: cinematic food commercial, shallow depth of field, rich warm colors
Duration: 8 seconds
Audio: soft sizzle and gentle ambient kitchen sounds
Aspect ratio: 9:16`,
  }),
  S({
    slug: "travel-reel-drone-reveal", title: "Travel Reel drone reveal (video)", category: "Video", targets: ["video"], tags: ["travel", "reel", "video"],
    summary: "Aerial reveal shot for travel content.", aspect: "9:16",
    trend: { status: "evergreen", note: "Format guidance only.", sources: [], lastVerified: VERIFIED },
    body: `Shot: aerial shot
Subject & action: a lone traveller standing on a cliff edge, the camera rises to reveal [a misty Himalayan valley at sunrise]
Camera: crane up and slow push forward
Style: cinematic, natural colors, soft volumetric light through mist
Duration: 8 seconds
Audio: wind and distant birds, no music
Aspect ratio: 9:16`,
  }),
  // ---------------- Hindi ----------------
  S({
    slug: "hi-saree-portrait", title: "साड़ी पोर्ट्रेट (Hindi)", category: "Photo edit", locale: "hi", targets: ["gemini", "chatgpt"], tags: ["saree", "hindi", "portrait"],
    summary: "अपलोड की गई फोटो से सुंदर साड़ी पोर्ट्रेट।", requiresPhoto: true, aspect: "4:5",
    trend: { status: "evergreen", note: "लोकप्रिय फॉर्मेट; मौजूदा ट्रेंड का कोई दावा नहीं।", sources: [], lastVerified: VERIFIED },
    body: `अपलोड की गई फोटो को एक सुंदर साड़ी पोर्ट्रेट में बदलें। चेहरा, चेहरे की बनावट, त्वचा का रंग और भाव बिल्कुल वैसे ही रखें — व्यक्ति की पहचान न बदलें।
साड़ी: [रंग, जैसे गहरा लाल सिल्क, सुनहरी ज़री बॉर्डर]।
पृष्ठभूमि: पुरानी हवेली का आंगन, हल्की धूप।
रोशनी: शाम की सुनहरी रोशनी, प्राकृतिक त्वचा। आस्पेक्ट रेशियो 4:5। कोई टेक्स्ट या वॉटरमार्क नहीं।`,
  }),
  S({
    slug: "hi-old-photo-restore", title: "पुरानी फोटो ठीक करें (Hindi)", category: "Photo edit", locale: "hi", targets: ["gemini", "chatgpt"], tags: ["restoration", "hindi", "family"],
    summary: "पुरानी पारिवारिक फोटो को साफ़ और रंगीन बनाएं।", requiresPhoto: true,
    trend: { status: "evergreen", note: "हमेशा उपयोगी फॉर्मेट।", sources: [], lastVerified: VERIFIED },
    body: `इस पुरानी फोटो को रिस्टोर करें: खरोंच, धूल, मोड़ और दाग हटाएं; फीके रंग और कॉन्ट्रास्ट ठीक करें; हल्का शार्प करें।
फिर प्राकृतिक, उस समय के अनुसार रंग भरें। सभी लोगों के चेहरे और पहचान बिल्कुल न बदलें। कोई व्यक्ति या चीज़ न जोड़ें, न हटाएं। फ्रेमिंग वैसी ही रखें।`,
  }),
  S({
    slug: "hi-festive-family-portrait", title: "त्योहार फैमिली पोर्ट्रेट (Hindi)", category: "Photo edit", locale: "hi", targets: ["gemini", "chatgpt"], tags: ["festival", "hindi", "family"],
    summary: "दीयों और फूलों के साथ त्योहार वाली फैमिली फोटो।", requiresPhoto: true, aspect: "4:5",
    trend: { status: "seasonal", note: "त्योहार थीम; लोकप्रियता का कोई दावा नहीं।", sources: [], lastVerified: VERIFIED },
    body: `अपलोड की गई फैमिली फोटो को त्योहार वाले पोर्ट्रेट में बदलें। हर व्यक्ति का चेहरा और पहचान बिल्कुल वैसी ही रखें।
सभी ने पारंपरिक कपड़े पहने हों। पृष्ठभूमि: रंगोली, जलते दीये, गेंदे की मालाएं और हल्की फेयरी लाइट्स।
रोशनी: गर्म, दीयों जैसी रोशनी। आस्पेक्ट रेशियो 4:5। कोई टेक्स्ट नहीं।`,
  }),
];
