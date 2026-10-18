/**
 * Visual prompts for image and video tools: comma-style descriptors covering subject, style, lighting,
 * camera, mood and aspect ratio, plus negative prompts in the form each tool supports.
 * Smart defaults fill anything the user didn't specify, unless the goal already mentions it.
 */
import type { Mode, Section, Target } from "./types";

export interface VisualInput {
  kind: "image" | "video";
  subId?: string | null;
  goal: string;
  extra: Record<string, string>;
  target: Target;
  mode: Mode;
  improve: boolean;
}

const has = (text: string, re: RegExp) => re.test(text);
const LIGHT_RE = /\b(golden hour|sunset|sunrise|dawn|dusk|neon|studio light|moonlit|moonlight|backlit|candle ?lit|night|lighting|rim light|overcast|blue hour|softbox)\b/i;
const STYLE_RE = /\b(illustration|watercolou?r|oil painting|anime|cartoon|3d|render|vector|flat|pixel art|sketch|line art|cinematic|photoreal(istic)?|isometric|clay|low[- ]poly|comic|minimalist|vintage|retro)\b/i;
const CAMERA_RE = /\b(close-?up|wide shot|aerial|drone|macro|top-down|flat ?lay|overhead|portrait shot|full body|lens|\d+mm|bird's eye|low angle|high angle)\b/i;

interface Defaults { style: string; lighting: string; camera: string; aspect: string; avoid: string; mood?: string }

function defaultsFor(kind: "image" | "video", subId: string | null | undefined, goal: string): Defaults {
  const g = goal.toLowerCase();
  const vertical = /\b(reel|reels|story|stories|tiktok|shorts|phone wallpaper|vertical)\b/.test(g);
  const wide = /\b(youtube|banner|desktop|wallpaper|landscape|header|cover photo|thumbnail)\b/.test(g);
  if (kind === "video") {
    return {
      style: "cinematic, natural motion, realistic textures, 24fps film look",
      lighting: "soft natural light with gentle contrast",
      camera: "medium shot, slow dolly in",
      aspect: vertical ? "9:16" : "16:9",
      avoid: "flicker, morphing faces, warped hands, distorted text, sudden jump cuts, watermark",
    };
  }
  switch (subId) {
    case "product-photo": return { style: "commercial product photography, clean e-commerce look, true-to-life colours", lighting: "large softbox key light, soft shadows, subtle rim light", camera: "45-degree angle, 100mm macro lens, product centred and in sharp focus, shallow depth of field", aspect: vertical ? "9:16" : "4:5", avoid: "busy background, warped or misspelled label text, extra objects, harsh reflections, watermark" };
    case "logo-branding": return { style: "flat vector logo, simple geometric shapes, 2–3 solid colours, scalable", lighting: "", camera: "centred on a plain white background", aspect: "1:1", avoid: "photorealism, gradients, tiny details, mockup background, misspelled text" };
    case "posters-ads": return { style: "bold graphic poster design, clear focal point, space reserved for headline text", lighting: "dramatic directional light", camera: "centred composition with strong hierarchy", aspect: vertical ? "9:16" : "2:3", avoid: "cluttered layout, random text, watermark, low resolution" };
    case "thumbnails": return { style: "high-contrast YouTube thumbnail style, one clear focal subject, expressive face if a person", lighting: "bright, punchy key light with rim light", camera: "tight close-up, subject on the left third, empty space for 3 words of text", aspect: "16:9", avoid: "small details, clutter, more than 3 words of text, watermark" };
    case "ui-ux": return { style: "clean modern UI mockup, consistent spacing, accessible contrast", lighting: "", camera: "straight-on screen view", aspect: wide ? "16:9" : "9:16", avoid: "lorem ipsum clutter, inconsistent fonts, misaligned elements" };
    default: return { style: "photorealistic, editorial photography, natural colours", lighting: "soft natural window light", camera: "35mm lens, eye level, rule-of-thirds composition, shallow depth of field", aspect: vertical ? "9:16" : wide ? "16:9" : "1:1", avoid: "text, watermark, logo, blurry, distorted hands, extra fingers, oversaturated colours" };
  }
}

function lowerFirst(s: string) { return s ? s[0].toLowerCase() + s.slice(1) : s; }
function stripLead(goal: string) {
  return goal.replace(/^(please\s+)?(create|generate|make|design|draw|give me|i want|i need)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|video|clip|logo|poster|thumbnail)?\s*(of|for|showing)?\s*/i, "").replace(/[.\s]+$/, "") || goal;
}

export function buildVisual(v: VisualInput): { text: string; sections: Section[] } {
  const e = v.extra;
  const subject = (e.subject?.trim() || stripLead(v.goal.trim()));
  const d = defaultsFor(v.kind, v.subId, `${v.goal} ${subject}`);
  const text = `${v.goal} ${subject}`;
  const concise = v.mode === "concise";
  const detailed = v.mode === "detailed" || v.improve;

  if (v.kind === "image" && v.subId === "photo-edit") return photoEdit(subject, e, v);

  const style = e.style?.trim() || (has(text, STYLE_RE) ? "" : d.style);
  const lighting = e.lighting?.trim() || (has(text, LIGHT_RE) ? "" : d.lighting);
  const camera = (v.kind === "video" ? [e.shot, e.camera].filter(Boolean).join(", ") : e.composition)?.trim() || (has(text, CAMERA_RE) ? "" : d.camera);
  const mood = e.mood?.trim() || "";
  const aspect = e.aspect?.trim() || d.aspect;
  const avoid = e.avoid?.trim() || d.avoid;
  const detail = detailed ? (v.kind === "video" ? "consistent subject identity across frames, smooth motion" : "fine texture detail, accurate proportions, sharp focus on the subject") : "";

  const sections: Section[] = [
    { id: "subject", title: v.kind === "video" ? "Subject & action" : "Subject", lines: [subject] },
    ...(style ? [{ id: "style", title: "Style", lines: [style] }] : []),
    ...(lighting ? [{ id: "lighting", title: "Lighting", lines: [lighting] }] : []),
    ...(camera ? [{ id: "camera", title: v.kind === "video" ? "Shot & camera" : "Camera & composition", lines: [camera] }] : []),
    ...(mood ? [{ id: "mood", title: "Mood & colours", lines: [mood] }] : []),
    { id: "aspect", title: "Aspect ratio", lines: [aspect] },
    { id: "avoid", title: "Negative prompt", lines: [avoid] },
  ];

  if (v.kind === "video") {
    const setting = e.setting?.trim();
    const duration = e.duration?.trim() || "8 seconds";
    const line = [camera, subject, setting, lighting, style, mood, detail].filter(Boolean).join(", ");
    if (concise) return { text: `${line}. ${duration}, ${aspect}.`, sections };
    const out = [
      `Prompt: ${line}`,
      `Duration: ${duration} · Aspect ratio: ${aspect}`,
      ...(e.audio?.trim() ? [`Audio (if your tool supports it): ${e.audio.trim()}`] : []),
      `Negative prompt (paste into the negative-prompt field if your tool has one, e.g. Veo or Kling): ${avoid}`,
    ];
    return { text: out.join("\n"), sections };
  }

  const descriptors = [lowerFirst(subject), style, lighting, camera, mood, detail].filter(Boolean);
  if (v.target.id === "midjourney") {
    const noList = avoid.split(/\s*,\s*/).slice(0, 6).join(", ");
    return { text: `${descriptors.join(", ")} --ar ${aspect}${noList ? ` --no ${noList}` : ""}`, sections };
  }
  // FLUX, Gemini, ChatGPT images, Ideogram and chat assistants: comma-style prompt plus explicit aspect ratio and an "avoid" line
  // (most of these tools have no separate negative-prompt field, so it is written as an instruction).
  if (concise) return { text: `${descriptors.join(", ")}. Aspect ratio ${aspect}. Avoid: ${avoid}.`, sections };
  const intro = v.target.family === "image" ? [] : ["Generate an image with these specifications."];
  return { text: [...intro, `Prompt: ${descriptors.join(", ")}`, `Aspect ratio: ${aspect}`, `Avoid: ${avoid}`].join("\n"), sections };
}

function photoEdit(change: string, e: Record<string, string>, v: VisualInput): { text: string; sections: Section[] } {
  const keep = "the person's face, facial features, skin tone, hairstyle, body shape and expression exactly as in the original";
  const style = e.style?.trim() || "photorealistic, natural colour grading";
  const lighting = e.lighting?.trim() || "lighting that matches the new scene, with consistent shadows on the face";
  const aspect = e.aspect?.trim() || "4:5";
  const avoid = e.avoid?.trim() || "changing the face, plastic or over-smoothed skin, extra fingers, distorted hands, text, watermark";
  const sections: Section[] = [
    { id: "edit", title: "Edit", lines: [change] }, { id: "keep", title: "Keep unchanged", lines: [keep] },
    { id: "style", title: "Style", lines: [style] }, { id: "aspect", title: "Aspect ratio", lines: [aspect] }, { id: "avoid", title: "Avoid", lines: [avoid] },
  ];
  if (v.mode === "concise") return { text: `Using the uploaded photo: ${lowerFirst(change)}. Keep ${keep}. ${style}. Aspect ratio ${aspect}. Avoid: ${avoid}.`, sections };
  return { text: [
    "Using the uploaded photo as the reference:",
    `Edit: ${change}`,
    `Keep unchanged: ${keep}`,
    `Style: ${style}; ${lighting}`,
    `Aspect ratio: ${aspect}`,
    `Avoid: ${avoid}`,
  ].join("\n"), sections };
}
