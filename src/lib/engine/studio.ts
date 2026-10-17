/** Instagram Studio: deterministic photo-edit prompt composer (EN/HI). */
export interface StudioStyle { id: string; name: string; en: string; hi: string }

export const STUDIO_STYLES: StudioStyle[] = [
  { id: "yearbook-80s", name: "80s yearbook", en: "a 1980s high-school yearbook portrait: mottled blue backdrop, soft studio light, faded warm film colors, era hairstyle and clothing", hi: "1980 के दशक का स्कूल ईयरबुक पोर्ट्रेट: नीला धब्बेदार बैकग्राउंड, सॉफ्ट स्टूडियो लाइट, हल्के फीके गर्म रंग, उस दौर का हेयरस्टाइल और कपड़े" },
  { id: "movie-poster", name: "Movie poster", en: "a cinematic movie poster with dramatic teal-and-orange grade, rim lighting and an epic background", hi: "सिनेमैटिक मूवी पोस्टर: नाटकीय टील-ऑरेंज कलर ग्रेड, रिम लाइट और भव्य बैकग्राउंड" },
  { id: "polaroid-70s", name: "70s Polaroid", en: "a 1970s Polaroid instant photo with faded warm colors, slight vignette and a white Polaroid frame", hi: "1970 के दशक की पोलरॉइड फोटो: फीके गर्म रंग, हल्का विग्नेट और सफ़ेद पोलरॉइड फ्रेम" },
  { id: "flash-90s", name: "90s disposable flash", en: "a 1990s disposable-camera photo with harsh direct flash, dark background falloff and visible grain", hi: "1990 के दशक के डिस्पोजेबल कैमरे जैसी फोटो: तेज़ फ्लैश, गहरा बैकग्राउंड और ग्रेन" },
  { id: "golden-hour", name: "Golden hour portrait", en: "a golden-hour street portrait with warm low sun, soft rim light, shallow depth of field and subtle film tones", hi: "गोल्डन आवर स्ट्रीट पोर्ट्रेट: ढलते सूरज की गर्म रोशनी, सॉफ्ट रिम लाइट, धुंधला बैकग्राउंड" },
  { id: "headshot", name: "Professional headshot", en: "a professional headshot on a plain soft-grey studio backdrop with soft key light, natural skin texture and smart business attire", hi: "प्रोफेशनल हेडशॉट: सादा हल्का ग्रे बैकग्राउंड, सॉफ्ट लाइट, प्राकृतिक त्वचा और फॉर्मल कपड़े" },
  { id: "figurine", name: "Collectible figurine", en: "a photorealistic 1/7 scale collectible figure on a clear acrylic base on a desk, next to its illustrated retail box", hi: "1/7 स्केल का असली जैसा कलेक्टिबल फिगर, डेस्क पर पारदर्शी बेस के साथ, बगल में उसका बॉक्स" },
  { id: "festive", name: "Festive (Diwali)", en: "a festive Diwali portrait in elegant traditional wear, lit clay diyas, marigold garlands and warm bokeh lights", hi: "दिवाली का त्योहारी पोर्ट्रेट: पारंपरिक कपड़े, जलते दीये, गेंदे की माला और गर्म रोशनी" },
];

export interface StudioInput { styleId: string; aspect: string; locale: "en" | "hi"; details?: string; people?: "one" | "group" }

export function buildStudioPrompt(input: StudioInput): string {
  const style = STUDIO_STYLES.find((s) => s.id === input.styleId) ?? STUDIO_STYLES[0];
  const details = (input.details ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  const aspect = /^\d{1,2}:\d{1,2}$/.test(input.aspect) ? input.aspect : "4:5";
  if (input.locale === "hi") {
    const keep = input.people === "group"
      ? "फोटो में हर व्यक्ति का चेहरा, चेहरे की बनावट, त्वचा का रंग और भाव बिल्कुल वैसे ही रखें — किसी की पहचान न बदलें।"
      : "चेहरा, चेहरे की बनावट, त्वचा का रंग और भाव बिल्कुल वैसे ही रखें — व्यक्ति की पहचान न बदलें।";
    return [`अपलोड की गई फोटो को इस स्टाइल में बदलें: ${style.hi}।`, keep, details ? `अतिरिक्त विवरण: ${details}।` : "", `आस्पेक्ट रेशियो ${aspect}। कोई टेक्स्ट या वॉटरमार्क नहीं।`].filter(Boolean).join("\n");
  }
  const keep = input.people === "group"
    ? "Keep every person's exact face, facial features, skin tone and expression unchanged. Do not change anyone's identity."
    : "Keep the exact same face, facial features, skin tone and expression as the uploaded photo. Do not change the person's identity.";
  return [`Transform the uploaded photo into ${style.en}.`, keep, details ? `Additional details: ${details}.` : "", `Aspect ratio ${aspect}. No text or watermark unless requested.`].filter(Boolean).join("\n");
}
