import type { Metadata } from "next";
import Link from "next/link";
import { ImageReelBuilder } from "@/components/ImageReelBuilder";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/site";

const title = "Image & Reel Prompt Builder for India (Free) | PromptPilot AI";
const description = "Free prompt builder for festival posters, shop ads, WhatsApp status, shaadi invites and Instagram reels. Output for Midjourney, Gemini / Nano Banana, DALL·E and Sora / Veo / Runway. Hinglish input works.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/image-reel-builder" }, openGraph: { images: [DEFAULT_OG_IMAGE], title, description, url: absoluteUrl("/image-reel-builder") } };

type SP = Record<string, string | string[] | undefined>;
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const g = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h1">Image &amp; Reel prompt builder</h1>
      <p className="lead">Pick a use case and a model. You get a prompt in the format that model expects: Midjourney flags, plain text for Gemini and ChatGPT, or a shot list for video models. Free, no signup.</p>
      <div className="mt-8"><ImageReelBuilder initial={{ useCase: g("uc"), model: g("model"), subject: g("subject") }} /></div>
      <p className="mt-8 text-sm text-muted">Prompts come from fixed templates, so the same input gives the same prompt. Image results depend on the model you paste them into. Looking for a gallery instead? See the <Link className="underline" href="/image-prompt-builder">builder vs gallery</Link> note.</p>
    </div>
  );
}
