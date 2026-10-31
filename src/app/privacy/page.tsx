import type { Metadata } from "next";
import Link from "next/link";
import { SITE, OWNER } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "How PromptPilot handles your data.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <div className="prose-simple mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Draft, last updated {SITE.lastReviewed}. This draft needs legal review before commercial launch.</p>
      <h2>What runs in your browser</h2>
      <p>The Prompt Builder, coding agent kit generator, Instagram Studio composer and Enhancer analysis run in your browser. Text you type into those forms is not sent to our servers.</p>
      <p>Share links made by the builder keep your goal after the # in the link, which browsers do not send to our servers, logs or other sites. Short links (/s/…) store only the builder settings you chose to share, so anyone with the link can open them. Exception: older links and category starter links that put the goal in the page URL (?goal=…) reach our hosting provider like any web request and may appear in its standard request logs. Don&apos;t put sensitive personal information in prompts or share links.</p>
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
      <h2 id="dpdp">Your rights in India (DPDP Act, 2023)</h2>
      <p>This section describes how we handle personal data under India&apos;s Digital Personal Data Protection Act, 2023. It is a draft pending legal review.</p>
      <h3>What we store</h3>
      <ul>
        <li><strong>Account (only if you sign in):</strong> your email address and sign-in records, kept by Supabase Auth.</li>
        <li><strong>Saved prompts (signed in):</strong> the title, prompt text, builder settings and share settings you save.</li>
        <li><strong>Short share links:</strong> the builder settings you chose to share. They aren&apos;t linked to your account.</li>
        <li><strong>Pro waitlist:</strong> your email, your consent, and the date you joined. We use it only to tell you when Pro launches.</li>
        <li><strong>Not stored by us:</strong> text in the builder while you are signed out, prompts saved in your browser (localStorage), photos, and API keys.</li>
      </ul>
      <h3>Where it is stored</h3>
      <p>Our database runs on Supabase in the <strong>[SUPABASE_REGION]</strong> region. The website is hosted on Vercel.</p>
      <h3>Delete or correct your data</h3>
      <ul>
        <li>You can delete saved prompts yourself from <Link href="/dashboard">My saved prompts</Link>. To clear browser-saved prompts, clear this site&apos;s data in your browser.</li>
        <li>To delete your account, remove yourself from the waitlist, or get a copy of your data, email <strong>{OWNER.contactEmail}</strong> from the address involved. See the <Link href="/contact">contact page</Link>. We aim to reply within [RESPONSE_DAYS] days.</li>
        <li>You can withdraw consent for the waitlist at any time. It is as easy as giving it.</li>
        <li>Grievance officer: <strong>[GRIEVANCE_OFFICER_NAME]</strong>, {OWNER.contactEmail}.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions: see the <Link href="/contact">contact page</Link>. More about us on the <Link href="/about">About page</Link>.</p>
    </div>
  );
}
