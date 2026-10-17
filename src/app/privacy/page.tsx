import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "How PromptPilot handles your data.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <div className="prose-simple mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Draft, last updated {SITE.lastReviewed}. This draft needs legal review before commercial launch.</p>
      <h2>What runs in your browser</h2>
      <p>The Prompt Builder, Agent Templates generator, Instagram Studio composer and Enhancer analysis run entirely in your browser. Text you type there is not sent to our servers.</p>
      <h2>Saved prompts</h2>
      <ul>
        <li>If you are not signed in, saved prompts are stored in your browser&apos;s localStorage on your device.</li>
        <li>If sign-in is enabled and you sign in, saved prompts are stored in our database (Supabase), protected by row-level security so only your account can read them unless you choose to share.</li>
      </ul>
      <h2>Optional LLM enhancement</h2>
      <p>When you use &ldquo;Enhance with LLM&rdquo;, your prompt and API key are sent to our server for that single request and forwarded to the provider you chose (OpenAI, Anthropic, xAI or the URL you entered). We do not store or log the key or the prompt. The provider&apos;s own privacy policy applies to what they receive. If you tick &ldquo;Remember in this browser&rdquo;, the key is stored in your browser&apos;s localStorage on your device.</p>
      <h2>Accounts</h2>
      <p>If you sign in, we store your email address and the data you save. You can delete saved prompts at any time from the dashboard. Contact us to delete your account.</p>
      <h2>Analytics and cookies</h2>
      <p>This version does not include third-party analytics or advertising. Sign-in (if enabled) uses storage needed to keep you logged in.</p>
      <h2>Photos</h2>
      <p>We never receive your photos. Instagram Studio prompts are pasted into third-party tools (e.g. Gemini, ChatGPT) where you upload photos under their terms. Only edit images of people who consented.</p>
      <h2>Contact</h2>
      <p>Questions: use the contact address published on this site.</p>
    </div>
  );
}
