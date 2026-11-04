import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/site";

const title = "Image Prompt Builder vs Prompt Galleries | PromptPilot AI";
const description = "Prompt galleries let you copy other people's prompts. PromptPilot builds an image or reel prompt from your own goal, for Indian festivals, shops, weddings and reels.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/image-prompt-builder" }, openGraph: { images: [DEFAULT_OG_IMAGE], title, description, url: absoluteUrl("/image-prompt-builder") } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">Build your own image prompt, don&apos;t just browse one</h1>
      <p className="lead">Galleries such as <a className="underline" href="https://prompthero.com/" rel="noopener noreferrer">PromptHero</a> are community prompt galleries: you browse prompts other people shared and copy one. That works when someone already made what you need.</p>
      <p className="mt-4">PromptPilot is a builder. You describe your own poster, ad, invite or reel, in English or Hinglish, and get a prompt shaped for the model you use:</p>
      <ul className="mt-4 list-disc pl-6 text-sm">
        <li>Midjourney: descriptive prompt with <code>--ar</code>, <code>--v</code> and <code>--style</code> flags.</li>
        <li>Gemini / Nano Banana and DALL·E / ChatGPT: plain descriptive text.</li>
        <li>Sora / Veo / Runway: a timed shot list for a 9:16 reel.</li>
      </ul>
      <p className="mt-4 text-sm">Use cases: festival posters, shop ads, WhatsApp status, shaadi invites, Instagram reels and Shorts.</p>
      <div className="mt-8"><Link className="btn btn-primary" href="/image-reel-builder">Open the Image &amp; Reel builder</Link></div>
    </div>
  );
}
