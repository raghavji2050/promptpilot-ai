import type { Metadata } from "next";
import { StudioComposer } from "@/components/StudioComposer";
import { LibraryBrowser } from "@/components/LibraryBrowser";
import { SOCIAL_PROMPTS } from "@/content";

export const metadata: Metadata = {
  title: "Instagram Studio: Gemini & ChatGPT Photo Editing Prompts (English & Hindi)",
  description: "Compose photo-edit prompts for Gemini and ChatGPT with identity preservation built in: retro, poster, headshot, festive styles, 4:5 and 9:16 formats. English and Hindi.",
  alternates: { canonical: "/instagram-studio" },
};

export default function InstagramStudioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h1">Instagram Studio</h1>
      <p className="lead">Pick a style and format; get a photo-edit prompt for Gemini or ChatGPT that tells the model to keep your face unchanged. Works for Reels covers, feed posts and Stories.</p>
      <div className="mt-8"><StudioComposer /></div>
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900">Social prompt library</h2>
        <p className="mt-2 text-sm text-slate-600">Labels: <strong>Reported trend</strong> = a dated third-party source reported it recently (linked on the prompt page); <strong>Seasonal</strong> = tied to a date or festival; <strong>Evergreen</strong> = a lasting format with no claim it&apos;s trending now.</p>
        <div className="mt-6"><LibraryBrowser items={SOCIAL_PROMPTS} showTrend showLocale /></div>
      </section>
    </div>
  );
}
